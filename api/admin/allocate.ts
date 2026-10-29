import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, date, session, kundNumber } = req.body || {};

    if (!bookingId || !date || !session || !kundNumber) {
      return res.status(400).json({ error: 'bookingId, date, session, and kundNumber are required' });
    }

    // Get family size for this booking
    const [booking] = await sql`
      select id from bookings where id = ${bookingId} or booking_code = ${bookingId}
    `;
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [countRow] = await sql`
      select count(*)::int as cnt from participants where booking_id = ${booking.id}
    `;
    const familySize = Math.max(countRow?.cnt || 1, 1);

    // Check current occupancy of the target kund
    const [occ] = await sql`
      select coalesce(sum(participant_count), 0)::int as occupied
      from allocations
      where event_date = ${date} and session = ${session} and kund_number = ${kundNumber}
    `;

    const occupied = occ?.occupied || 0;
    if (occupied + familySize > 8) {
      return res.status(409).json({ error: 'Kund does not have enough seats for this family' });
    }

    // Check if blocked
    const [blocked] = await sql`
      select id from kund_blocks
      where kund_number = ${kundNumber} and event_date = ${date} and session = ${session}
    `;
    if (blocked) {
      return res.status(409).json({ error: 'Kund is blocked' });
    }

    // Remove any existing allocation for this booking on this date/session
    await sql`
      delete from allocations
      where booking_id = ${booking.id} and event_date = ${date} and session = ${session}
    `;

    // Insert new allocation
    await sql`
      insert into allocations (booking_id, event_date, session, kund_number, participant_count)
      values (${booking.id}, ${date}, ${session}, ${kundNumber}, ${familySize})
    `;

    return res.status(200).json({ success: true, kundNumber, familySize });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
