import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      yagyakarta_name,
      primary_mobile,
      secondary_mobile,
      email,
      city,
      state,
      gotra,
      participants,
      sessions,
    } = req.body;

    const bookingCode = 'MYA-' + Date.now().toString().slice(-8);

    const [booking] = await sql`
      insert into bookings (
        booking_code, yagyakarta_name, primary_mobile, secondary_mobile,
        email, city, state, gotra
      ) values (
        ${bookingCode}, ${yagyakarta_name}, ${primary_mobile}, ${secondary_mobile},
        ${email}, ${city}, ${state}, ${gotra}
      )
      returning id, booking_code
    `;

    if (participants?.length) {
      for (const p of participants) {
        await sql`
          insert into participants (booking_id, name, age, gender, relationship, mobile)
          values (${booking.id}, ${p.name}, ${p.age}, ${p.gender}, ${p.relationship}, ${p.mobile})
        `;
      }
    }

    return res.status(200).json({ bookingCode, bookingId: booking.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
