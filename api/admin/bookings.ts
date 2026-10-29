import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, limit = '100', offset = '0' } = req.query;

    let rows;
    if (search) {
      const term = `%${search}%`;
      rows = await sql`
        select 
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
          (select count(*) from participants p where p.booking_id = b.id)::int as participant_count
        from bookings b
        where 
          b.yagyakarta_name ilike ${term}
          or b.primary_mobile ilike ${term}
          or b.booking_code ilike ${term}
          or b.city ilike ${term}
        order by b.created_at desc
        limit ${parseInt(limit)} offset ${parseInt(offset)}
      `;
    } else {
      rows = await sql`
        select 
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
          (select count(*) from participants p where p.booking_id = b.id)::int as participant_count
        from bookings b
        order by b.created_at desc
        limit ${parseInt(limit)} offset ${parseInt(offset)}
      `;
    }

    return res.status(200).json({ bookings: rows });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
