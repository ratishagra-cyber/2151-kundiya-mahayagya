import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const y = body.yagyakarta || {};

    const yagyakarta_name = y.fullName || '';
    const primary_mobile = y.primaryMobile || '';
    const secondary_mobile = y.secondaryMobile || null;
    const email = y.email || null;
    const city = y.city || '';
    const state = y.state || null;
    const gotra = y.gotra || null;
    const pincode = y.pincode || null;

    const participants = body.participants || [];
    const allocations = body.allocations || [];
    const familySchedule = body.familySchedule || [];

    if (!yagyakarta_name || !primary_mobile || !city) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { yagyakarta_name, primary_mobile, city },
      });
    }

    const bookingCode = body.bookingCode || body.id || 'MYA-' + Date.now().toString().slice(-8);

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
            ${p.name || ''},
            ${p.age || null},
            ${p.gender || null},
            ${p.relationship || null},
            ${p.mobile || null}
          )
        `;
      }
    }

    // Return the shape the frontend expects so it can generate the pass
    return res.status(200).json({
      success: true,
      bookingCode,
      id: bookingCode,
      bookingId: booking.id,
      status: 'confirmed',
      yagyakarta: {
        fullName: yagyakarta_name,
        primaryMobile: primary_mobile,
        secondaryMobile: secondary_mobile,
        email,
        city,
        state,
        gotra,
        pincode,
      },
      participants,
      allocations,
      familySchedule,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
