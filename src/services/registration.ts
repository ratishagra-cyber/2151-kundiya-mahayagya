import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
 * Saves Mahayagya registration:
 * 1. Inserts into the "bookings" table in Supabase
 * 2. Inserts related participants into the "participants" table
 * 3. Keeps local storage synchronized for offline/continuity
 * 4. Returns the unique booking code
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

  // Prepare full local booking model
  const bookingModel: Booking = {
    id: bookingCode,
    createdAt,
    yagyakarta,
    participants,
    allocations,
    status,
  };

  // Always sync locally so offline pass retrieval and local dashboard remain reliable
  try {
    addBooking(bookingModel);
  } catch (err) {
    console.warn('Local storage backup warning:', err);
  }

  // If Supabase credentials are not configured yet, succeed gracefully with local storage
  if (!isSupabaseConfigured) {
    console.info(
      'Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set yet. Booking saved locally with code:',
      bookingCode
    );
    return {
      success: true,
      bookingCode,
    };
  }

  try {
    // 1. Insert into "bookings" table
    const bookingRow = {
      booking_code: bookingCode,
      full_name: yagyakarta.fullName,
      primary_mobile: yagyakarta.primaryMobile,
      secondary_mobile: yagyakarta.secondaryMobile || null,
      email: yagyakarta.email || null,
      city: yagyakarta.city,
      state: yagyakarta.state,
      pincode: yagyakarta.pincode,
      gotra: yagyakarta.gotra || null,
      sankalp_purpose: yagyakarta.sankalpPurpose || null,
      allocations: allocations,
      status,
      created_at: createdAt,
    };

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingRow]);

    if (bookingError) {
      console.error('Supabase bookings insert error:', bookingError);
      return {
        success: false,
        bookingCode,
        error: `Supabase Bookings Error: ${bookingError.message}`,
      };
    }

    // 2. Insert related participants into "participants" table
    const participantRows = participants.map((p) => ({
      booking_code: bookingCode,
      name: p.name,
      age: typeof p.age === 'number' ? p.age : (parseInt(p.age as string, 10) || null),
      gender: p.gender,
      relationship: p.relationship,
      mobile: p.mobile || null,
      is_yagyakarta: Boolean(p.isYagyakarta),
      schedule: p.schedule,
    }));

    if (participantRows.length > 0) {
      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participantRows);

      if (participantsError) {
        console.error('Supabase participants insert error:', participantsError);
        return {
          success: false,
          bookingCode,
          error: `Supabase Participants Error: ${participantsError.message}`,
        };
      }
    }

    return {
      success: true,
      bookingCode,
    };
  } catch (err: any) {
    console.error('Unexpected Supabase insertion exception:', err);
    return {
      success: false,
      bookingCode,
      error: err?.message || 'Unexpected database error occurred while saving registration.',
    };
  }
}
