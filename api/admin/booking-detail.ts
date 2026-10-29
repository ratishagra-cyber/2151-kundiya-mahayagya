import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const [booking] = await sql`
      select * from bookings where id = ${bookingId} or booking_code = ${bookingId}
    `;

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const participants = await sql`
      select name, age, gender, relationship, mobile
      from participants
      where booking_id = ${booking.id}
    `;

    const allocations = await sql`
      select event_date, session, kund_number, participant_count
      from allocations
      where booking_id = ${booking.id}
      order by event_date, session
    `;

    return res.status(200).json({
      booking,
      participants,
      allocations,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
