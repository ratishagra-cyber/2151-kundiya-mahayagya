import { neon } from '@neondatabase/serverless';

/**
 * Endpoint: POST & GET /api/admin/attendance
 * 
 * - POST: Adopts a booking code scanned at the entry gate, checks validity,
 *         records entry into `attendance` table, and returns devotee details.
 * - GET: Returns recent admittance logs and real-time statistics for the session.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL environment variable is not configured on the server.',
    });
  }

  const sql = neon(databaseUrl);

  // Ensure attendance table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_code TEXT NOT NULL,
        event_date DATE NOT NULL,
        session TEXT NOT NULL,
        kund_number SMALLINT,
        attendee_count SMALLINT DEFAULT 1,
        scanned_at TIMESTAMPTZ DEFAULT NOW(),
        scanned_by TEXT DEFAULT 'Gate Operator',
        status TEXT DEFAULT 'admitted'
      );
    `;
  } catch {}

  // GET: Fetch recent attendance scans and session total
  if (req.method === 'GET') {
    try {
      let date = '2026-12-14';
      let session = 'morning';

      if (req.query) {
        if (req.query.date) date = String(req.query.date).trim();
        if (req.query.session) session = String(req.query.session).trim().toLowerCase();
      } else if (req.url && req.url.includes('?')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const d = urlObj.searchParams.get('date');
        const s = urlObj.searchParams.get('session');
        if (d) date = d.trim();
        if (s) session = s.trim().toLowerCase();
      }

      const rows = await sql`
        SELECT 
          att.id,
          att.booking_code,
          att.event_date,
          att.session,
          att.kund_number,
          att.attendee_count,
          att.scanned_at,
          att.scanned_by,
          att.status,
          b.yagyakarta_name,
          b.primary_mobile,
          b.city
        FROM attendance att
        LEFT JOIN bookings b ON att.booking_code = b.booking_code
        WHERE att.event_date = ${date}::date AND LOWER(att.session) = ${session}
        ORDER BY att.scanned_at DESC
        LIMIT 50;
      `;

      const stats = await sql`
        SELECT 
          COUNT(*)::int AS total_groups,
          COALESCE(SUM(attendee_count), 0)::int AS total_devotees
        FROM attendance
        WHERE event_date = ${date}::date AND LOWER(session) = ${session};
      `;

      return res.status(200).json({
        success: true,
        date,
        session,
        summary: stats[0] || { total_groups: 0, total_devotees: 0 },
        recentScans: rows.map((r: any) => ({
          id: r.id,
          bookingCode: r.booking_code,
          yagyakartaName: r.yagyakarta_name || 'यजमान',
          primaryMobile: r.primary_mobile || '',
          city: r.city || '',
          kundNumber: r.kund_number ? Number(r.kund_number) : null,
          attendeeCount: Number(r.attendee_count) || 1,
          scannedAt: r.scanned_at,
          scannedBy: r.scanned_by,
          status: r.status,
        })),
      });
    } catch (err: any) {
      console.error('Error fetching attendance list:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch attendance.' });
    }
  }

  // POST: Record admittance for a scanned/entered booking code
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let rawCode = (body.bookingCode || body.booking_code || body.code || '').trim();
      const date = (body.date || body.eventDate || body.event_date || '2026-12-14').trim();
      const session = (body.session || 'morning').trim().toLowerCase();
      const scannedBy = (body.scannedBy || body.scanned_by || 'Gate Operator').trim();

      // Clean QR code payload if URL or prefixed
      if (rawCode.includes('token=')) {
        rawCode = rawCode.split('token=')[1].split('&')[0];
      }
      if (rawCode.startsWith('MY-') || rawCode.startsWith('my-')) {
        rawCode = rawCode.toUpperCase();
      }

      if (!rawCode) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: bookingCode',
        });
      }

      // 1. Look up booking from database
      const bookingRows = await sql`
        SELECT * FROM bookings
        WHERE booking_code ILIKE ${rawCode}
           OR id::text = ${rawCode}
        LIMIT 1;
      `;

      if (!bookingRows || bookingRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No valid booking found for code "${rawCode}". Please verify booking ID.`,
        });
      }

      const booking = bookingRows[0];
      const finalBookingCode = booking.booking_code || booking.id;

      // 2. Fetch participant count
      const partCountRes = await sql`
        SELECT COUNT(*)::int AS count FROM participants WHERE booking_id = ${booking.id};
      `;
      const participantCount = partCountRes[0]?.count || 1;

      // 3. Find allocated kund number for this session
      let kundNumber: number | null = null;
      try {
        const allocRows = await sql`
          SELECT kund_number FROM allocations
          WHERE booking_id = ${booking.id}
            AND event_date = ${date}::date
            AND LOWER(session) = ${session}
          LIMIT 1;
        `;
        if (allocRows && allocRows.length > 0 && allocRows[0].kund_number) {
          kundNumber = Number(allocRows[0].kund_number);
        }
      } catch {}

      // Fallback: check json allocations column on booking record
      if (!kundNumber && booking.allocations) {
        try {
          const rawAlloc = typeof booking.allocations === 'string' ? JSON.parse(booking.allocations) : booking.allocations;
          if (Array.isArray(rawAlloc)) {
            const match = rawAlloc.find((a: any) => a.date === date && a.session === session);
            if (match && match.kundNumber) {
              kundNumber = Number(match.kundNumber);
            } else if (rawAlloc.length > 0 && rawAlloc[0].kundNumber) {
              kundNumber = Number(rawAlloc[0].kundNumber);
            }
          }
        } catch {}
      }

      // 4. Check if already scanned for this date and session
      const existingScan = await sql`
        SELECT * FROM attendance
        WHERE booking_code = ${finalBookingCode}
          AND event_date = ${date}::date
          AND LOWER(session) = ${session}
        LIMIT 1;
      `;

      if (existingScan && existingScan.length > 0) {
        const prior = existingScan[0];
        return res.status(200).json({
          success: true,
          alreadyAdmitted: true,
          message: `Devotee group already admitted at ${new Date(prior.scanned_at).toLocaleTimeString()}.`,
          attendee: {
            yagyakartaName: booking.yagyakarta_name,
            bookingCode: finalBookingCode,
            kundNumber: prior.kund_number || kundNumber,
            attendeeCount: prior.attendee_count || participantCount,
            city: booking.city || 'अयोध्या',
            address: booking.address || '',
            primaryMobile: booking.primary_mobile,
            status: 'already_admitted',
            scannedAt: prior.scanned_at,
            date,
            session,
          },
        });
      }

      // 5. Insert new attendance record
      const insertedScan = await sql`
        INSERT INTO attendance (
          booking_code,
          event_date,
          session,
          kund_number,
          attendee_count,
          scanned_by,
          status
        ) VALUES (
          ${finalBookingCode},
          ${date}::date,
          ${session},
          ${kundNumber},
          ${participantCount},
          ${scannedBy},
          'admitted'
        )
        RETURNING *;
      `;

      const rec = insertedScan[0];

      return res.status(200).json({
        success: true,
        alreadyAdmitted: false,
        message: 'Devotee admission verified and logged successfully!',
        attendee: {
          yagyakartaName: booking.yagyakarta_name,
          bookingCode: finalBookingCode,
          kundNumber: kundNumber,
          attendeeCount: participantCount,
          city: booking.city || 'अयोध्या',
          address: booking.address || '',
          primaryMobile: booking.primary_mobile,
          status: 'admitted',
          scannedAt: rec.scanned_at,
          date,
          session,
        },
      });
    } catch (err: any) {
      console.error('Error recording attendance:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to record gate attendance.',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed.`,
  });
}
