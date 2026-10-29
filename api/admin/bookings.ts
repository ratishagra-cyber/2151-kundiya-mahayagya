import { neon } from '@neondatabase/serverless';

/**
 * Endpoint: GET /api/admin/bookings
 * Query params: ?search=<term>
 * 
 * Returns all bookings with:
 * Booking Code, Yagyakarta Name, Primary Mobile, City, Address, Participant Count, Created At
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

    // Parse search parameter from query object or URL
    let search = '';
    if (req.query && typeof req.query.search === 'string') {
      search = req.query.search.trim();
    } else if (req.url && req.url.includes('?')) {
      const urlObj = new URL(req.url, 'http://localhost');
      search = (urlObj.searchParams.get('search') || '').trim();
    }

    const sql = neon(databaseUrl);

    let rows: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      rows = await sql`
        SELECT 
          b.id,
          b.booking_code,
          b.yagyakarta_name,
          b.primary_mobile,
          b.secondary_mobile,
          b.email,
          b.address,
          b.city,
          b.state,
          b.gotra,
          b.status,
          b.created_at,
          COALESCE(
            (SELECT COUNT(*)::int FROM participants p WHERE p.booking_id = b.id),
            1
          ) AS participant_count
        FROM bookings b
        WHERE 
          b.booking_code ILIKE ${searchPattern} OR
          b.yagyakarta_name ILIKE ${searchPattern} OR
          b.primary_mobile ILIKE ${searchPattern} OR
          COALESCE(b.secondary_mobile, '') ILIKE ${searchPattern} OR
          COALESCE(b.city, '') ILIKE ${searchPattern} OR
          COALESCE(b.address, '') ILIKE ${searchPattern} OR
          COALESCE(b.gotra, '') ILIKE ${searchPattern}
        ORDER BY b.created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT 
          b.id,
          b.booking_code,
          b.yagyakarta_name,
          b.primary_mobile,
          b.secondary_mobile,
          b.email,
          b.address,
          b.city,
          b.state,
          b.gotra,
          b.status,
          b.created_at,
          COALESCE(
            (SELECT COUNT(*)::int FROM participants p WHERE p.booking_id = b.id),
            1
          ) AS participant_count
        FROM bookings b
        ORDER BY b.created_at DESC;
      `;
    }

    const bookings = rows.map((r: any) => ({
      id: r.id,
      bookingCode: r.booking_code || r.id,
      booking_code: r.booking_code || r.id,
      yagyakartaName: (r.yagyakarta_name || 'यजमान').trim(),
      yagyakarta_name: (r.yagyakarta_name || 'यजमान').trim(),
      primaryMobile: r.primary_mobile || '',
      primary_mobile: r.primary_mobile || '',
      secondaryMobile: r.secondary_mobile || '',
      secondary_mobile: r.secondary_mobile || '',
      email: r.email || '',
      city: r.city || 'अयोध्या',
      address: r.address || 'पंजीकृत पता उपलब्ध नहीं',
      state: r.state || 'उत्तर प्रदेश',
      gotra: r.gotra || '',
      participantCount: parseInt(r.participant_count, 10) || 1,
      participant_count: parseInt(r.participant_count, 10) || 1,
      status: r.status || 'confirmed',
      createdAt: r.created_at,
      created_at: r.created_at,
    }));

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
      search: search || null,
    });
  } catch (error: any) {
    console.error('Error fetching admin bookings from Neon Postgres:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Database error occurred while fetching bookings.',
    });
  }
}
