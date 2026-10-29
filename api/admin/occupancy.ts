import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, session } = req.query;

    if (!date || !session) {
      return res.status(400).json({ error: 'date and session are required' });
    }

    // Get occupancy per kund for the given date/session
    const rows = await sql`
      select 
        a.kund_number,
        coalesce(sum(a.participant_count), 0)::int as occupied,
        json_agg(json_build_object(
          'booking_code', b.booking_code,
          'yagyakarta_name', b.yagyakarta_name,
          'primary_mobile', b.primary_mobile,
          'participant_count', a.participant_count
        )) as families
      from allocations a
      join bookings b on b.id = a.booking_id
      where a.event_date = ${date} and a.session = ${session}
      group by a.kund_number
      order by a.kund_number
    `;

    // Build a map for quick lookup
    const occupancyMap: Record<number, any> = {};
    for (const row of rows) {
      occupancyMap[row.kund_number] = {
        occupied: row.occupied,
        families: row.families,
      };
    }

    // Check blocked kunds
    const blocked = await sql`
      select kund_number, reason from kund_blocks
      where event_date = ${date} and session = ${session}
    `;
    const blockedMap: Record<number, string> = {};
    for (const b of blocked) {
      blockedMap[b.kund_number] = b.reason || 'blocked';
    }

    // Build full grid (1 to 2151)
    const grid = [];
    for (let k = 1; k <= 2151; k++) {
      const occ = occupancyMap[k];
      const isBlocked = blockedMap[k] !== undefined;
      grid.push({
        kund: k,
        occupied: occ?.occupied || 0,
        capacity: 8,
        status: isBlocked ? 'blocked' : (occ?.occupied || 0) === 0 ? 'empty' : (occ?.occupied || 0) >= 8 ? 'full' : 'partial',
        families: occ?.families || [],
        blockedReason: blockedMap[k] || null,
      });
    }

    return res.status(200).json({ date, session, grid });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
