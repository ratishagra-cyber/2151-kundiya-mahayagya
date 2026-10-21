import { Booking, Participant, YagyakartaDetails, AllocatedSession } from '../types';
import { addBooking } from './storageService';

export interface SaveRegistrationPayload {
  id?: string;
  bookingCode?: string;
  yagyakarta: YagyakartaDetails;
  participants: Participant[];
  allocations: AllocatedSession[];
  status?: 'confirmed' | 'partially_cancelled' | 'cancelled';
  createdAt?: string;
}

export interface SaveRegistrationResponse {
  success: boolean;
  bookingCode: string;
  error?: string;
}

/**
 * Saves Mahayagya registration to local persistence (localStorage):
 * 1. Generates or preserves unique Booking ID (e.g., 'MY-2026-8491')
 * 2. Persists the complete booking record with family details and allocations
 * 3. Returns the unique booking code for pass generation and confirmation
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

  const bookingModel: Booking = {
    id: bookingCode,
    createdAt,
    yagyakarta,
    participants,
    allocations,
    status,
  };

  try {
    addBooking(bookingModel);
    return {
      success: true,
      bookingCode,
    };
  } catch (err: any) {
    console.error('Registration persistence error:', err);
    return {
      success: false,
      bookingCode,
      error: err?.message || 'Failed to save booking. Please try again.',
    };
  }
}
