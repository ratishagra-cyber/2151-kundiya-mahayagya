import { Booking, AllocatedSession, SessionType, KundSessionOccupancy } from '../types';
import { EVENT_DETAILS, getZoneForKund } from '../data/eventConfig';

export interface AllocationRequest {
  date: string;
  session: SessionType;
  participantIds: string[];
}

export interface AllocationResult {
  allocations: AllocatedSession[];
  success: boolean;
  error?: string;
}

import { getBlockedKunds } from './adminService';

/**
 * Calculates current occupancy for all kunds for a specific date and session
 * based on all confirmed bookings in the database and administrative blocks.
 */
export function calculateKundOccupancyMap(
  existingBookings: Booking[],
  date: string,
  session: SessionType
): Map<number, KundSessionOccupancy> {
  const map = new Map<number, KundSessionOccupancy>();
  const blockedList = getBlockedKunds();

  // Initialize all 2,151 kunds
  for (let num = 1; num <= EVENT_DETAILS.totalKunds; num++) {
    const { id: zoneId } = getZoneForKund(num);
    const blockRec = blockedList.find(
      (b) => b.kundNumber === num && b.date === date && b.session === session
    );

    map.set(num, {
      kundNumber: num,
      zone: zoneId,
      date,
      session,
      occupiedSeats: blockRec ? EVENT_DETAILS.seatsPerKund : 0,
      capacity: EVENT_DETAILS.seatsPerKund,
      isBlocked: Boolean(blockRec),
      blockRecord: blockRec,
      bookings: [],
    });
  }

  // Populate from active bookings
  for (const booking of existingBookings) {
    if (booking.status === 'cancelled') continue;

    for (const alloc of booking.allocations) {
      if (alloc.date === date && alloc.session === session) {
        const kund = map.get(alloc.kundNumber);
        if (kund && !kund.isBlocked) {
          kund.occupiedSeats += alloc.participantCount;
          kund.bookings.push({
            bookingId: booking.id,
            yagyakartaName: booking.yagyakarta.fullName,
            contactNumber: booking.yagyakarta.primaryMobile,
            city: booking.yagyakarta.city,
            participantCount: alloc.participantCount,
            participantNames: booking.participants
              .filter((p) => alloc.participantIds.includes(p.id))
              .map((p) => p.name),
          });
        }
      }
    }
  }

  return map;
}

/**
 * Best-Fit Kund Allocation Logic
 * Critical Invariants:
 * 1. NEVER split a family. All participants in the group for a session MUST sit in the same Kund.
 * 2. Max group size = 8.
 * 3. Best-Fit: Prefer existing partially occupied kunds that leave the fewest empty seats:
 *    i.e., maximize (occupied + groupSize <= 8) -> minimum (8 - (occupied + groupSize)).
 * 4. Continuity bonus: If family is attending another session and that same Kund has space & best-fit, prefer continuity.
 */
export function allocateBestFitKunds(
  requests: AllocationRequest[],
  existingBookings: Booking[]
): AllocationResult {
  const allocatedSessions: AllocatedSession[] = [];
  
  // Clone existing bookings for simulation state during this allocation
  const simulatedBookings: Booking[] = JSON.parse(JSON.stringify(existingBookings));

  // Preferred kund if family was already placed (for continuity across days/sessions)
  let previouslyAssignedKund: number | null = null;

  for (const req of requests) {
    const groupSize = req.participantIds.length;
    if (groupSize === 0) continue;

    if (groupSize > EVENT_DETAILS.seatsPerKund) {
      return {
        allocations: [],
        success: false,
        error: `Group size of ${groupSize} exceeds maximum physical kund capacity of ${EVENT_DETAILS.seatsPerKund}. Families cannot be split.`,
      };
    }

    const occupancyMap = calculateKundOccupancyMap(simulatedBookings, req.date, req.session);

    // Find candidate kunds that can accommodate the entire group together
    const validCandidates: {
      kundNumber: number;
      occupied: number;
      remainingAfter: number;
      isPartiallyFilled: boolean;
      isPreferredContinuity: boolean;
    }[] = [];

    for (let num = 1; num <= EVENT_DETAILS.totalKunds; num++) {
      const data = occupancyMap.get(num)!;
      if (!data.isBlocked && data.occupiedSeats + groupSize <= EVENT_DETAILS.seatsPerKund) {
        validCandidates.push({
          kundNumber: num,
          occupied: data.occupiedSeats,
          remainingAfter: EVENT_DETAILS.seatsPerKund - (data.occupiedSeats + groupSize),
          isPartiallyFilled: data.occupiedSeats > 0,
          isPreferredContinuity: previouslyAssignedKund === num,
        });
      }
    }

    if (validCandidates.length === 0) {
      return {
        allocations: [],
        success: false,
        error: `No single Kund has ${groupSize} contiguous seats available for ${req.date} (${req.session}). Total physical capacity reached.`,
      };
    }

    // Best-Fit Sorting Priority:
    // 1. If previously assigned Kund for this family has exact 0 remaining seats, highest priority.
    // 2. Partially filled kunds prioritized over pristine empty kunds (to maximize packing efficiency)
    // 3. Among partially filled kunds, minimize remainingAfter (i.e. fewest empty seats remaining)
    // 4. If no partially filled kund fits, prefer pristine empty kund with continuity or lowest number.
    validCandidates.sort((a, b) => {
      // If one of them achieves exact zero waste (perfect fit of 8/8)
      if (a.remainingAfter === 0 && b.remainingAfter !== 0) return -1;
      if (b.remainingAfter === 0 && a.remainingAfter !== 0) return 1;

      // Prefer partially filled kunds over empty kunds (Best-Fit rule)
      if (a.isPartiallyFilled && !b.isPartiallyFilled) return -1;
      if (!a.isPartiallyFilled && b.isPartiallyFilled) return 1;

      if (a.isPartiallyFilled && b.isPartiallyFilled) {
        // Both partially filled: Pick the one that leaves FEWEST empty seats
        if (a.remainingAfter !== b.remainingAfter) {
          return a.remainingAfter - b.remainingAfter;
        }
        // Tie-breaker: prefer same kund continuity if equal
        if (a.isPreferredContinuity && !b.isPreferredContinuity) return -1;
        if (!a.isPreferredContinuity && b.isPreferredContinuity) return 1;
        // Tie-breaker: lower kund number
        return a.kundNumber - b.kundNumber;
      }

      // Both are empty kunds: prefer continuity if available
      if (a.isPreferredContinuity && !b.isPreferredContinuity) return -1;
      if (!a.isPreferredContinuity && b.isPreferredContinuity) return 1;

      // Otherwise lowest number first
      return a.kundNumber - b.kundNumber;
    });

    const chosen = validCandidates[0];
    const { id: zoneId } = getZoneForKund(chosen.kundNumber);

    const newAlloc: AllocatedSession = {
      date: req.date,
      session: req.session,
      kundNumber: chosen.kundNumber,
      zone: zoneId,
      participantIds: req.participantIds,
      participantCount: groupSize,
    };

    allocatedSessions.push(newAlloc);
    previouslyAssignedKund = chosen.kundNumber;

    // Record in simulated bookings so subsequent session allocations within this booking reflect this
    simulatedBookings.push({
      id: 'temp-in-flight',
      createdAt: new Date().toISOString(),
      yagyakarta: { fullName: '', primaryMobile: '', address: '', city: '', state: '', pincode: '' },
      participants: [],
      allocations: [newAlloc],
      status: 'confirmed',
    });
  }

  return {
    allocations: allocatedSessions,
    success: true,
  };
}

/**
 * Reassign an existing booking session to a different Kund with strict capacity & family integrity check
 */
export function reassignSessionKund(
  bookingId: string,
  date: string,
  session: SessionType,
  targetKundNumber: number,
  allBookings: Booking[]
): { success: boolean; message: string; updatedBookings?: Booking[] } {
  if (targetKundNumber < 1 || targetKundNumber > EVENT_DETAILS.totalKunds) {
    return { success: false, message: `Kund number must be between 1 and ${EVENT_DETAILS.totalKunds}` };
  }

  const booking = allBookings.find((b) => b.id === bookingId);
  if (!booking) return { success: false, message: 'Booking not found' };

  const targetAlloc = booking.allocations.find((a) => a.date === date && a.session === session);
  if (!targetAlloc) return { success: false, message: 'Session allocation not found for this booking' };

  // Check capacity on target kund excluding current booking's participants
  const otherBookings = allBookings.filter((b) => b.id !== bookingId);
  const occupancyMap = calculateKundOccupancyMap(otherBookings, date, session);
  const targetData = occupancyMap.get(targetKundNumber);

  const neededSeats = targetAlloc.participantCount;
  const currentOccupied = targetData ? targetData.occupiedSeats : 0;

  if (currentOccupied + neededSeats > EVENT_DETAILS.seatsPerKund) {
    return {
      success: false,
      message: `Kund ${targetKundNumber} cannot accommodate ${neededSeats} participants. Current occupancy: ${currentOccupied}/8. Available: ${8 - currentOccupied}. Family cannot be split.`,
    };
  }

  const { id: zoneId } = getZoneForKund(targetKundNumber);

  const updatedBookings = allBookings.map((b) => {
    if (b.id !== bookingId) return b;
    return {
      ...b,
      allocations: b.allocations.map((a) => {
        if (a.date === date && a.session === session) {
          return {
            ...a,
            kundNumber: targetKundNumber,
            zone: zoneId,
          };
        }
        return a;
      }),
    };
  });

  return {
    success: true,
    message: `Successfully reassigned to Kund ${targetKundNumber} (${zoneId}) without splitting family.`,
    updatedBookings,
  };
}
