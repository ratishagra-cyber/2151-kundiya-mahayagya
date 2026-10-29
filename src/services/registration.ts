import { Booking, Participant, YagyakartaDetails, AllocatedSession, DaySchedule } from '../types';
import { addBooking } from './storageService';

export interface SaveRegistrationPayload {
  id?: string;
  bookingCode?: string;
  website?: string;
  yagyakarta: YagyakartaDetails;
  participants: Participant[];
  allocations: AllocatedSession[];
  familySchedule?: DaySchedule[];
  status?: 'confirmed' | 'partially_cancelled' | 'cancelled';
  createdAt?: string;
}

export interface SaveRegistrationResponse {
  success: boolean;
  bookingCode: string;
  data?: Booking;
  source?: 'neon' | 'local_fallback';
  error?: string;
}

/**
 * Saves Mahayagya registration:
 * 1. Calls POST /api/register to insert into Neon Postgres via serverless function.
 * 2. Any 200 response with success: true is treated as a successful registration.
 * 3. The returned data is synchronized with local storage and returned to the caller.
 * 4. Falls back to localStorage only if the API call fails (network error, offline, or 500).
 */
export async function saveRegistration(
  payload: SaveRegistrationPayload | Booking
): Promise<SaveRegistrationResponse> {
  const bookingCode =
    ('bookingCode' in payload && payload.bookingCode) ||
    payload.id ||
    `MY-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const createdAt = payload.createdAt || new Date().toISOString();
  const status = payload.status || 'confirmed';
  const { yagyakarta, participants, allocations } = payload;
  const familySchedule = ('familySchedule' in payload && payload.familySchedule) || undefined;
  const website = ('website' in payload && payload.website) || payload.yagyakarta?.website || '';

  const registrationData = {
    bookingCode,
    id: bookingCode,
    createdAt,
    status,
    website,
    yagyakarta,
    participants,
    allocations,
    familySchedule,
  };

  const localBookingModel: Booking = {
    id: bookingCode,
    createdAt,
    yagyakarta,
    participants,
    allocations,
    familySchedule,
    status,
  };

  // 1. Attempt POST /api/register
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && (data.success === true || response.status === 200)) {
        const confirmedCode = data.bookingCode || data.id || data.bookingId || bookingCode;

        // Construct resolved booking model from server response
        const resolvedBooking: Booking = {
          id: confirmedCode,
          createdAt,
          yagyakarta: data.yagyakarta || yagyakarta,
          participants: data.participants || participants,
          allocations: data.allocations || allocations,
          familySchedule: data.familySchedule || familySchedule,
          status: data.status || status,
        };

        // Sync with local storage for instant offline retrieval
        try {
          addBooking(resolvedBooking);
        } catch (localErr) {
          console.warn('Local storage cache sync note:', localErr);
        }

        return {
          success: true,
          bookingCode: confirmedCode,
          data: resolvedBooking,
          source: 'neon',
        };
      }
    }

    // If response was not 200, log detail before fallback
    let errDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errDetail = errJson.error;
    } catch {}
    console.warn(`API /api/register non-200 (${errDetail}), invoking localStorage fallback.`);
  } catch (apiError: any) {
    console.warn('Network or endpoint error calling /api/register, invoking localStorage fallback:', apiError?.message);
  }

  // 2. Fallback to localStorage only if API call failed
  try {
    addBooking(localBookingModel);
    return {
      success: true,
      bookingCode,
      data: localBookingModel,
      source: 'local_fallback',
    };
  } catch (storageError: any) {
    console.error('LocalStorage fallback error:', storageError);
    return {
      success: false,
      bookingCode,
      error: storageError?.message || 'Failed to save registration.',
    };
  }
}
