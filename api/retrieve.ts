import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mobile, bookingCode } = req.query;

    if (!mobile && !bookingCode) {
      return res.status(400).json({ error: 'mobile or bookingCode is required' });
    }

    let booking;

    if (bookingCode) {
      const [row] = await sql`
        select * from bookings where booking_code = ${bookingCode}
      `;
      booking = row;
    } else {
      const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
      const [row] = await sql`
        select * from bookings
        where primary_mobile like ${'%' + cleanMobile}
           or secondary_mobile like ${'%' + cleanMobile}
        order by created_at desc
        limit 1
      `;
      booking = row;
    }

    if (!booking) {
      return res.status(404).json({ error: 'No booking found' });
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
      booking: {
        bookingCode: booking.booking_code,
        yagyakartaName: booking.yagyakarta_name,
        primaryMobile: booking.primary_mobile,
        secondaryMobile: booking.secondary_mobile,
        email: booking.email,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        gotra: booking.gotra,
        status: booking.status,
        createdAt: booking.created_at,
      },
      participants,
      allocations,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
