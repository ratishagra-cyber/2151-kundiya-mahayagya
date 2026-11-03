import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { booking_code, event_date, session, scanned_by } = req.body || {};

  if (!booking_code || !event_date || !session) {
    return res.status(400).json({ error: 'booking_code, event_date, and session are required' });
  }

  try {
    // Find the booking and count participants
    const booking = await sql`
      SELECT 
        b.id, 
        b.booking_code, 
        b.yagyakarta_name,
        b.primary_mobile,
        b.city,
        b.address,
        (SELECT COUNT(*)::int FROM participants p WHERE p.booking_id = b.id) as participant_count
      FROM bookings b
      WHERE b.booking_code = ${booking_code}
      LIMIT 1
    `;

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const b = booking[0];
    const participantCount = b.participant_count || 1;

    // Check for matching allocation for this date/session
    const allocation = await sql`
      SELECT kund_number
      FROM allocations
      WHERE booking_id = ${b.id}
        AND event_date = ${event_date}
        AND session = ${session}
      LIMIT 1
    `;

    if (allocation.length === 0) {
      return res.status(400).json({
        error: 'No allocation found for this date and session',
        message: `Booking ${booking_code} is not registered for ${event_date} ${session}`,
      });
    }

    const kund_number = allocation[0].kund_number;

    // Check for duplicate attendance
    const existing = await sql`
      SELECT id, scanned_at
      FROM attendance
      WHERE booking_id = ${b.id}
        AND event_date = ${event_date}
        AND session = ${session}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Already marked for this session',
        alreadyMarked: true,
        scanned_at: existing[0].scanned_at,
        attendee: {
          yagyakartaName: b.yagyakarta_name,
          bookingCode: b.booking_code,
          kundNumber: kund_number,
          attendeeCount: participantCount,
          primaryMobile: b.primary_mobile,
          city: b.city,
          address: b.address,
          date: event_date,
          session,
        },
      });
    }

    // Record attendance
    await sql`
      INSERT INTO attendance (
        booking_id, booking_code, event_date, session,
        kund_number, attendee_count, scanned_by
      ) VALUES (
        ${b.id}, ${booking_code}, ${event_date}, ${session},
        ${kund_number}, ${participantCount}, ${scanned_by || 'operator'}
      )
    `;

    const now = new Date().toISOString();

    return res.status(200).json({
      success: true,
      attendee: {
        yagyakartaName: b.yagyakarta_name,
        bookingCode: b.booking_code,
        kundNumber: kund_number,
        attendeeCount: participantCount,
        primaryMobile: b.primary_mobile,
        city: b.city,
        address: b.address,
        status: 'admitted',
        scannedAt: now,
        date: event_date,
        session,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
