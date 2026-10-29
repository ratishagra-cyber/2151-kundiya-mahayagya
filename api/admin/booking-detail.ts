import { neon } from '@neondatabase/serverless';

/**
 * Endpoint: GET /api/admin/booking-detail
 * Query params: ?bookingId=<code>
 * 
 * Returns full details of a specific booking:
 * - Yagyakarta details (name, mobiles, address, city, gotra, etc.)
 * - List of participants (name, age, gender, relationship, mobile, isYagyakarta)
 * - Allocated sessions with kund numbers, date, session, and participant count
 */
export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Please use GET.`,
    });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL environment variable is not configured on the server.',
      });
    }

    // Parse bookingId parameter from query object or URL
    let bookingId = '';
    if (req.query && typeof req.query.bookingId === 'string') {
      bookingId = req.query.bookingId.trim();
    } else if (req.url && req.url.includes('?')) {
      const urlObj = new URL(req.url, 'http://localhost');
      bookingId = (urlObj.searchParams.get('bookingId') || urlObj.searchParams.get('code') || '').trim();
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: bookingId',
      });
    }

    const sql = neon(databaseUrl);

    // 1. Fetch booking record
    const bookingRows = await sql`
      SELECT * FROM bookings
      WHERE booking_code = ${bookingId}
         OR id::text = ${bookingId}
      LIMIT 1;
    `;

    if (!bookingRows || bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Booking with ID or code "${bookingId}" was not found.`,
      });
    }

    const b = bookingRows[0];

    // 2. Fetch all participants for this booking
    const participantRows = await sql`
      SELECT id, name, age, gender, relationship, mobile
      FROM participants
      WHERE booking_id = ${b.id}
      ORDER BY id ASC;
    `;

    const participants = participantRows.map((p: any, idx: number) => {
      const isSelf = 
        idx === 0 || 
        (p.relationship && p.relationship.toLowerCase().includes('self')) ||
        (p.name && b.yagyakarta_name && p.name.trim().toLowerCase() === b.yagyakarta_name.trim().toLowerCase());

      return {
        id: p.id,
        name: p.name || 'सदस्य',
        age: p.age !== null && p.age !== undefined ? Number(p.age) : null,
        gender: p.gender || 'male',
        relationship: p.relationship || (isSelf ? 'Self / Yagyakarta' : 'Family Member'),
        mobile: p.mobile || '',
        isYagyakarta: isSelf,
      };
    });

    // 3. Fetch allocations for this booking
    let allocations: any[] = [];
    try {
      const allocRows = await sql`
        SELECT id, event_date, kund_number, participant_count, session
        FROM allocations
        WHERE booking_id = ${b.id}
        ORDER BY event_date ASC, session ASC;
      `;

      allocations = allocRows.map((a: any) => {
        let dateStr = '';
        if (a.event_date instanceof Date) {
          dateStr = a.event_date.toISOString().split('T')[0];
        } else if (typeof a.event_date === 'string') {
          dateStr = a.event_date.split('T')[0];
        }

        const kundNum = Number(a.kund_number) || 1;
        let sector = 'A';
        if (kundNum <= 400) sector = 'A';
        else if (kundNum <= 800) sector = 'B';
        else if (kundNum <= 1200) sector = 'C';
        else if (kundNum <= 1600) sector = 'D';
        else sector = 'E';

        return {
          id: a.id,
          date: dateStr,
          session: a.session || 'morning',
          kundNumber: kundNum,
          sector,
          kundName: `कुण्ड ${kundNum}`,
          participantCount: Number(a.participant_count) || participants.length || 1,
        };
      });
    } catch (allocErr) {
      console.warn('Allocations query warning:', allocErr);
    }

    // 4. Return consolidated response
    const yagyakarta = {
      name: (b.yagyakarta_name || 'यजमान').trim(),
      fullName: (b.yagyakarta_name || 'यजमान').trim(),
      primaryMobile: b.primary_mobile || '',
      secondaryMobile: b.secondary_mobile || '',
      email: b.email || '',
      address: b.address || 'पंजीकृत पता उपलब्ध नहीं',
      city: b.city || 'अयोध्या',
      state: b.state || 'उत्तर प्रदेश',
      gotra: b.gotra || 'उपलब्ध नहीं',
    };

    return res.status(200).json({
      success: true,
      booking: {
        id: b.id,
        bookingCode: b.booking_code || b.id,
        status: b.status || 'confirmed',
        createdAt: b.created_at,
        yagyakarta,
        participants,
        allocations,
      },
    });
  } catch (error: any) {
    console.error('Error fetching booking detail from Neon Postgres:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Database error occurred while fetching booking detail.',
    });
  }
}
