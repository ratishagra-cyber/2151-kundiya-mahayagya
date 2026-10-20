import { Booking, SessionType } from '../types';
import { INITIAL_SEEDED_BOOKINGS } from '../data/eventConfig';

const STORAGE_KEY = 'mahayagya_2151_bookings_v1';

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_BOOKINGS));
      return INITIAL_SEEDED_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_BOOKINGS));
      return INITIAL_SEEDED_BOOKINGS;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading bookings from storage:', e);
    return INITIAL_SEEDED_BOOKINGS;
  }
}

export function saveAllBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error('Error saving bookings to storage:', e);
  }
}

export function addBooking(booking: Booking): void {
  const current = getStoredBookings();
  const updated = [booking, ...current];
  saveAllBookings(updated);
}

export function findBooking(query: string): Booking | null {
  const cleaned = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned) return null;

  const bookings = getStoredBookings();
  return (
    bookings.find((b) => {
      const matchId = b.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned);
      const matchPhone1 = b.yagyakarta.primaryMobile.replace(/\D/g, '').includes(cleaned);
      const matchPhone2 = b.yagyakarta.secondaryMobile?.replace(/\D/g, '').includes(cleaned) ?? false;
      const matchParticipantPhone = b.participants.some(
        (p) => p.mobile && p.mobile.replace(/\D/g, '').includes(cleaned)
      );
      return matchId || matchPhone1 || matchPhone2 || matchParticipantPhone;
    }) || null
  );
}

export function cancelSession(
  bookingId: string,
  date: string,
  session: SessionType
): { success: boolean; message: string; updatedBooking?: Booking } {
  const bookings = getStoredBookings();
  const target = bookings.find((b) => b.id === bookingId);
  if (!target) return { success: false, message: 'Booking not found' };

  const remainingAllocations = target.allocations.filter(
    (a) => !(a.date === date && a.session === session)
  );

  const newStatus = remainingAllocations.length === 0 ? 'cancelled' : 'partially_cancelled';

  const updatedBooking: Booking = {
    ...target,
    allocations: remainingAllocations,
    status: newStatus,
  };

  const updatedList = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
  saveAllBookings(updatedList);

  return {
    success: true,
    message: `Session ${date} (${session}) successfully released. Kund seat made available for other devotees.`,
    updatedBooking,
  };
}

export function cancelBooking(bookingId: string): boolean {
  const bookings = getStoredBookings();
  const updatedList = bookings.map((b) =>
    b.id === bookingId ? { ...b, status: 'cancelled' as const, allocations: [] } : b
  );
  saveAllBookings(updatedList);
  return true;
}

export function resetDemoData(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_BOOKINGS));
}
