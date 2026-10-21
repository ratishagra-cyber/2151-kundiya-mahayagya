import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Accept multiple possible field names from the frontend
    const yagyakarta_name =
      body.yagyakarta_name ||
      body.yagyakartaName ||
      body.name ||
      body.coordinatorName ||
      '';

    const primary_mobile =
      body.primary_mobile ||
      body.primaryMobile ||
      body.mobile ||
      body.phone ||
      '';

    const secondary_mobile =
      body.secondary_mobile ||
      body.secondaryMobile ||
      body.altMobile ||
      body.alternateMobile ||
      null;

    const email = body.email || null;
    const city = body.city || '';
    const state = body.state || null;
    const gotra = body.gotra || null;

    const participants = body.participants || body.members || [];
    const sessions = body.sessions || body.selectedSessions || [];

    if (!yagyakarta_name || !primary_mobile || !city) {
      return res.status(400).json({
        error: 'Missing required fields: yagyakarta_name, primary_mobile, city',
      });
    }

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

    if (Array.isArray(participants) && participants.length > 0) {
      for (const p of participants) {
        await sql`
          insert into participants (booking_id, name, age, gender, relationship, mobile)
          values (
            ${booking.id},
            ${p.name || p.fullName || ''},
            ${p.age || null},
            ${p.gender || null},
            ${p.relationship || null},
            ${p.mobile || p.phone || null}
          )
        `;
      }
    }

    return res.status(200).json({ bookingCode, bookingId: booking.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
