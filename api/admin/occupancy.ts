import { neon } from '@neondatabase/serverless';

interface ZoneDefinition {
  id: number;
  name: string;
  nameHi: string;
  startKund: number;
  endKund: number;
  totalKunds: number;
}

const ZONE_DEFINITIONS: ZoneDefinition[] = [
  { id: 1, name: 'Zone 1 - Brahma Precinct', nameHi: 'जोन 1 - ब्रह्म कुण्ड परिसर', startKund: 1, endKund: 195, totalKunds: 195 },
  { id: 2, name: 'Zone 2 - Vishnu Precinct', nameHi: 'जोन 2 - विष्णु कुण्ड परिसर', startKund: 196, endKund: 390, totalKunds: 195 },
  { id: 3, name: 'Zone 3 - Shiva Precinct', nameHi: 'जोन 3 - शिव कुण्ड परिसर', startKund: 391, endKund: 585, totalKunds: 195 },
  { id: 4, name: 'Zone 4 - Gayatri Precinct', nameHi: 'जोन 4 - गायत्री कुण्ड परिसर', startKund: 586, endKund: 780, totalKunds: 195 },
  { id: 5, name: 'Zone 5 - Ganga Precinct', nameHi: 'जोन 5 - गंगा कुण्ड परिसर', startKund: 781, endKund: 975, totalKunds: 195 },
  { id: 6, name: 'Zone 6 - Saraswati Precinct', nameHi: 'जोन 6 - सरस्वती कुण्ड परिसर', startKund: 976, endKund: 1170, totalKunds: 195 },
  { id: 7, name: 'Zone 7 - Yamuna Precinct', nameHi: 'जोन 7 - यमुना कुण्ड परिसर', startKund: 1171, endKund: 1365, totalKunds: 195 },
  { id: 8, name: 'Zone 8 - Narmada Precinct', nameHi: 'जोन 8 - नर्मदा कुण्ड परिसर', startKund: 1366, endKund: 1560, totalKunds: 195 },
  { id: 9, name: 'Zone 9 - Sindhu Precinct', nameHi: 'जोन 9 - सिन्धु कुण्ड परिसर', startKund: 1561, endKund: 1755, totalKunds: 195 },
  { id: 10, name: 'Zone 10 - Kaveri Precinct', nameHi: 'जोन 10 - कावेरी कुण्ड परिसर', startKund: 1756, endKund: 1950, totalKunds: 195 },
  { id: 11, name: 'Zone 11 - Mahamrityunjaya Precinct', nameHi: 'जोन 11 - महामृत्युंजय कुण्ड परिसर', startKund: 1951, endKund: 2151, totalKunds: 201 },
];

/**
 * Endpoint: GET /api/admin/occupancy
 * Query params: ?date=<YYYY-MM-DD>&session=<morning|afternoon>
 * 
 * Returns:
 * 1. Summary metrics (totalKunds, emptyKunds, partialKunds, fullKunds, blockedKunds)
 * 2. 11 Zone Overviews with occupiedCount, vacantCount, fillPercentage
 * 3. Exact per-kund details & seated families for interactive bus-seat grid
 */
export default async function handler(req: any, res: any) {
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

    let date = '2026-12-14';
    let session = 'morning';

    if (req.query) {
      if (typeof req.query.date === 'string' && req.query.date.trim()) {
        date = req.query.date.trim();
      }
      if (typeof req.query.session === 'string' && req.query.session.trim()) {
        session = req.query.session.trim().toLowerCase();
      }
    } else if (req.url && req.url.includes('?')) {
      const urlObj = new URL(req.url, 'http://localhost');
      const d = urlObj.searchParams.get('date');
      const s = urlObj.searchParams.get('session');
      if (d) date = d.trim();
      if (s) session = s.trim().toLowerCase();
    }

    if (session !== 'morning' && session !== 'afternoon') {
      session = 'morning';
    }

    const sql = neon(databaseUrl);
    const totalKunds = 2151;
    const seatsPerKund = 8;
    const totalSeatsCapacity = totalKunds * seatsPerKund;

    // 1. Query detailed allocations with booking metadata
    const kundFamiliesMap: Record<number, Array<{
      bookingCode: string;
      yagyakartaName: string;
      primaryMobile: string;
      city: string;
      participantCount: number;
    }>> = {};

    const occupiedSeatsMap: Record<number, number> = {};
    let totalSeatsOccupied = 0;

    try {
      const allocRows = await sql`
        SELECT 
          a.kund_number,
          a.participant_count,
          b.booking_code,
          b.yagyakarta_name,
          b.primary_mobile,
          b.city
        FROM allocations a
        JOIN bookings b ON a.booking_id = b.id
        WHERE a.event_date = ${date}::date AND LOWER(a.session) = ${session}
        ORDER BY a.kund_number ASC;
      `;

      for (const r of allocRows) {
        const kNum = Number(r.kund_number);
        const count = Number(r.participant_count) || 1;
        if (kNum >= 1 && kNum <= totalKunds) {
          occupiedSeatsMap[kNum] = (occupiedSeatsMap[kNum] || 0) + count;
          totalSeatsOccupied += count;

          if (!kundFamiliesMap[kNum]) {
            kundFamiliesMap[kNum] = [];
          }
          kundFamiliesMap[kNum].push({
            bookingCode: r.booking_code,
            yagyakartaName: r.yagyakarta_name || '',
            primaryMobile: r.primary_mobile || '',
            city: r.city || '',
            participantCount: count,
          });
        }
      }
    } catch (allocErr) {
      console.warn('Occupancy allocations query error, falling back:', allocErr);
    }

    // 2. Query blocked kunds
    const blockedMap: Record<number, { reason: string; blockedBy: string }> = {};
    try {
      const blockRows = await sql`
        SELECT kund_number, reason, blocked_by
        FROM kund_blocks
        WHERE event_date = ${date}::date AND LOWER(session) = ${session};
      `;
      for (const b of blockRows) {
        const kNum = Number(b.kund_number);
        if (kNum >= 1 && kNum <= totalKunds) {
          blockedMap[kNum] = {
            reason: b.reason || 'Reserved / VIP',
            blockedBy: b.blocked_by || 'Admin',
          };
        }
      }
    } catch {
      // kund_blocks table may not exist or be empty
    }

    // 3. Compute overall occupancy statistics
    let fullKunds = 0;
    let partialKunds = 0;
    const blockedCount = Object.keys(blockedMap).length;

    for (const [kStr, seats] of Object.entries(occupiedSeatsMap)) {
      const kNum = Number(kStr);
      if (blockedMap[kNum]) continue;
      if (seats >= seatsPerKund) {
        fullKunds++;
      } else if (seats > 0) {
        partialKunds++;
      }
    }

    const emptyKunds = Math.max(0, totalKunds - blockedCount - fullKunds - partialKunds);
    const availableSeats = Math.max(0, totalSeatsCapacity - totalSeatsOccupied - (blockedCount * seatsPerKund));
    const occupancyPercentage = Number(((totalSeatsOccupied / totalSeatsCapacity) * 100).toFixed(2));

    // 4. Compute 11 Zone Summaries for Zone Overview cards
    const zoneSummaries = ZONE_DEFINITIONS.map((z) => {
      let zoneOccupiedKunds = 0;
      let zonePartialKunds = 0;
      let zoneFullKunds = 0;
      let zoneBlockedKunds = 0;
      let zoneOccupiedSeats = 0;

      for (let k = z.startKund; k <= z.endKund; k++) {
        if (blockedMap[k]) {
          zoneBlockedKunds++;
          continue;
        }
        const seats = occupiedSeatsMap[k] || 0;
        if (seats > 0) {
          zoneOccupiedKunds++;
          zoneOccupiedSeats += seats;
          if (seats >= seatsPerKund) {
            zoneFullKunds++;
          } else {
            zonePartialKunds++;
          }
        }
      }

      const zoneVacantKunds = Math.max(0, z.totalKunds - zoneBlockedKunds - zoneOccupiedKunds);
      const zoneCapacitySeats = z.totalKunds * seatsPerKund;
      const fillPercentage = Number(((zoneOccupiedSeats / zoneCapacitySeats) * 100).toFixed(1));

      return {
        zoneId: z.id,
        name: z.name,
        nameHi: z.nameHi,
        startKund: z.startKund,
        endKund: z.endKund,
        totalKunds: z.totalKunds,
        occupiedKunds: zoneOccupiedKunds,
        vacantKunds: zoneVacantKunds,
        partialKunds: zonePartialKunds,
        fullKunds: zoneFullKunds,
        blockedKunds: zoneBlockedKunds,
        occupiedSeats: zoneOccupiedSeats,
        capacitySeats: zoneCapacitySeats,
        fillPercentage,
      };
    });

    // 5. Structure Kund Details map for instant Bus-Seat grid rendering
    // Include all kunds that are occupied or blocked, or can be queried
    const kundDetails: Record<number, {
      kundNumber: number;
      occupied: number;
      occupiedSeats: number;
      availableSeats: number;
      remainingSeats: number;
      isBlocked: boolean;
      blockedReason?: string;
      families: Array<{
        bookingCode: string;
        yagyakartaName: string;
        primaryMobile: string;
        city: string;
        participantCount: number;
      }>;
    }> = {};

    for (const [kStr, seats] of Object.entries(occupiedSeatsMap)) {
      const kNum = Number(kStr);
      kundDetails[kNum] = {
        kundNumber: kNum,
        occupied: seats,
        occupiedSeats: seats,
        availableSeats: Math.max(0, seatsPerKund - seats),
        remainingSeats: Math.max(0, seatsPerKund - seats),
        isBlocked: Boolean(blockedMap[kNum]),
        blockedReason: blockedMap[kNum]?.reason,
        families: kundFamiliesMap[kNum] || [],
      };
    }

    for (const [kStr, blockInfo] of Object.entries(blockedMap)) {
      const kNum = Number(kStr);
      if (!kundDetails[kNum]) {
        kundDetails[kNum] = {
          kundNumber: kNum,
          occupied: 0,
          occupiedSeats: 0,
          availableSeats: 0,
          remainingSeats: 0,
          isBlocked: true,
          blockedReason: blockInfo.reason,
          families: [],
        };
      } else {
        kundDetails[kNum].isBlocked = true;
        kundDetails[kNum].blockedReason = blockInfo.reason;
      }
    }

    return res.status(200).json({
      success: true,
      date,
      session,
      totalKunds,
      emptyKunds,
      partialKunds,
      fullKunds,
      blockedKunds: blockedCount,
      seatsPerKund,
      totalSeatsCapacity,
      totalSeatsOccupied,
      availableSeats,
      occupancyPercentage,
      zoneSummaries,
      kundDetails,
    });
  } catch (error: any) {
    console.error('Error calculating occupancy summary from Neon Postgres:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Database error occurred while fetching occupancy summary.',
    });
  }
}
