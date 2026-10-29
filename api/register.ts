import { neon } from '@neondatabase/serverless';

/**
 * Vercel Serverless Function & Express Route Handler
 * Endpoint: POST /api/register
 * 
 * Inserts Mahayagya booking, participants, and allocations into Neon Postgres.
 */
export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Please use POST.`,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      yagyakarta: incomingYagyakarta,
      participants = [],
      allocations = [],
      familySchedule = [],
      bookingCode: incomingBookingCode,
      id: incomingId,
      status: incomingStatus = 'confirmed',
      createdAt: incomingCreatedAt = new Date().toISOString(),
    } = body || {};

    const yag = incomingYagyakarta || {};

    // Support both nested camelCase and flat snake_case field access
    const yagyakarta_name = (yag.fullName || yag.yagyakarta_name || body.yagyakarta_name || '').trim();
    const primary_mobile = (yag.primaryMobile || yag.primary_mobile || body.primary_mobile || '').trim();
    const secondary_mobile = (yag.secondaryMobile || yag.secondary_mobile || body.secondary_mobile || '').trim() || null;
    const email = (yag.email || body.email || '').trim() || null;
    const address = (yag.address || body.address || '').trim();
    const city = (yag.city || body.city || 'अयोध्या').trim() || 'अयोध्या';
    const state = (yag.state || body.state || 'उत्तर प्रदेश').trim();
    const pincode = (yag.pincode || body.pincode || '').trim() || null;
    const gotra = (yag.gotra || body.gotra || '').trim() || null;
    const sankalpPurpose = (yag.sankalpPurpose || yag.sankalp_purpose || body.sankalp_purpose || '').trim() || null;

    if (!yagyakarta_name || !primary_mobile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: yagyakarta_name (fullName), primary_mobile',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: address is mandatory',
      });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('DATABASE_URL environment variable is missing.');
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL environment variable is not configured on the server.',
      });
    }

    const bookingCode =
      incomingBookingCode ||
      incomingId ||
      body.booking_code ||
      `MY-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const sql = neon(databaseUrl);

    // 1. Ensure table schema compatibility with any extra columns
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_code TEXT NOT NULL,
          booking_id TEXT,
          yagyakarta_name TEXT NOT NULL,
          full_name TEXT,
          primary_mobile TEXT NOT NULL,
          secondary_mobile TEXT,
          email TEXT,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT,
          pincode TEXT,
          gotra TEXT,
          sankalp_purpose TEXT,
          allocations JSONB,
          family_schedule JSONB,
          language TEXT DEFAULT 'hi',
          status TEXT DEFAULT 'confirmed',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    } catch {
      // Table creation handled or exists
    }

    // Safely add any missing columns to existing bookings table
    await Promise.allSettled([
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pincode TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gotra TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS allocations JSONB;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS family_schedule JSONB;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sankalp_purpose TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS full_name TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_id TEXT;`,
      sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'hi';`,
    ]);

    // Safely add missing columns to participants table
    await Promise.allSettled([
      sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_yagyakarta BOOLEAN DEFAULT FALSE;`,
      sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS schedule JSONB;`,
      sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS booking_code TEXT;`,
    ]);

    // 2. Insert into bookings table and retrieve the database generated UUID and booking_code
    const insertBookingResult = await sql`
      INSERT INTO bookings (
        booking_code,
        booking_id,
        yagyakarta_name,
        full_name,
        primary_mobile,
        secondary_mobile,
        email,
        address,
        city,
        state,
        pincode,
        gotra,
        sankalp_purpose,
        allocations,
        family_schedule,
        status,
        created_at
      ) VALUES (
        ${bookingCode},
        ${bookingCode},
        ${yagyakarta_name},
        ${yagyakarta_name},
        ${primary_mobile},
        ${secondary_mobile},
        ${email},
        ${address},
        ${city},
        ${state},
        ${pincode},
        ${gotra},
        ${sankalpPurpose},
        ${JSON.stringify(allocations || [])},
        ${JSON.stringify(familySchedule || [])},
        ${incomingStatus},
        ${incomingCreatedAt}
      )
      RETURNING id, booking_code;
    `;

    const insertedRow = insertBookingResult[0] || {};
    const bookingUuid = insertedRow.id;
    const finalBookingCode = insertedRow.booking_code || bookingCode;

    // 3. Insert each participant linked by UUID booking_id
    if (Array.isArray(participants) && participants.length > 0 && bookingUuid) {
      for (const p of participants) {
        const ageNum = typeof p.age === 'number' ? p.age : (parseInt(p.age as string, 10) || null);

        await sql`
          INSERT INTO participants (
            booking_id,
            booking_code,
            name,
            age,
            gender,
            relationship,
            mobile,
            is_yagyakarta,
            schedule
          ) VALUES (
            ${bookingUuid},
            ${finalBookingCode},
            ${p.name || 'सदस्य'},
            ${ageNum},
            ${p.gender || 'male'},
            ${p.relationship || ''},
            ${p.mobile || null},
            ${Boolean(p.isYagyakarta)},
            ${JSON.stringify(p.schedule || [])}
          );
        `;
      }
    }

    // 4. Insert allocations if the allocations table exists
    if (Array.isArray(allocations) && allocations.length > 0 && bookingUuid) {
      for (const alloc of allocations) {
        if (alloc.date && alloc.kundNumber && alloc.session) {
          try {
            await sql`
              INSERT INTO allocations (
                booking_id,
                event_date,
                kund_number,
                participant_count,
                session
              ) VALUES (
                ${bookingUuid},
                ${alloc.date},
                ${alloc.kundNumber},
                ${participants.length || 1},
                ${alloc.session}
              );
            `;
          } catch (allocErr) {
            console.warn('Non-fatal: could not insert into allocations table:', allocErr);
          }
        }
      }
    }

    // 5. Return exact response shape required
    const sanitizedYagyakarta = {
      fullName: yagyakarta_name,
      primaryMobile: primary_mobile,
      secondaryMobile: secondary_mobile || undefined,
      email: email || undefined,
      address,
      city,
      state,
      pincode: pincode || '',
      gotra: gotra || undefined,
      sankalpPurpose: sankalpPurpose || undefined,
    };

    return res.status(200).json({
      success: true,
      bookingCode: finalBookingCode,
      id: finalBookingCode,
      bookingId: finalBookingCode,
      dbId: bookingUuid,
      status: incomingStatus,
      yagyakarta: sanitizedYagyakarta,
      participants,
      allocations,
      familySchedule,
    });
  } catch (error: any) {
    console.error('Error saving registration to Neon Postgres:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Database error occurred while saving registration.',
    });
  }
}
