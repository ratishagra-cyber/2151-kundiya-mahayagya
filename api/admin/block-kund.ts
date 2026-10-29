import { neon } from '@neondatabase/serverless';

/**
 * Endpoint: POST & GET /api/admin/block-kund
 * 
 * Manages administrative blocking / unblocking of sacred kunds for specific dates and sessions.
 * Backed by the Neon Postgres `kund_blocks` table.
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

  // Ensure table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS kund_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kund_number SMALLINT NOT NULL,
        event_date DATE NOT NULL,
        session TEXT NOT NULL,
        reason TEXT,
        blocked_by TEXT DEFAULT 'Operator',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
  } catch (tErr) {
    // Already created
  }

  // GET: List blocked kunds for a date and session
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
        SELECT id, kund_number, event_date, session, reason, blocked_by, created_at
        FROM kund_blocks
        WHERE event_date = ${date}::date AND LOWER(session) = ${session}
        ORDER BY kund_number ASC;
      `;

      return res.status(200).json({
        success: true,
        date,
        session,
        blockedKunds: rows.map((r: any) => ({
          id: r.id,
          kundNumber: Number(r.kund_number),
          date: r.event_date instanceof Date ? r.event_date.toISOString().split('T')[0] : String(r.event_date).split('T')[0],
          session: r.session,
          reason: r.reason || 'Reserved / VIP',
          blockedBy: r.blocked_by || 'Admin',
          createdAt: r.created_at,
        })),
      });
    } catch (err: any) {
      console.error('Error fetching kund blocks:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch blocks.' });
    }
  }

  // POST: Block or Unblock a kund
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        action = 'block', // 'block' | 'unblock'
        kundNumber: inKundNumber,
        kund_number: inKund_number,
        date: inDate,
        eventDate: inEventDate,
        event_date: inEvent_date,
        session: inSession,
        reason: inReason = 'VIP / Reserved by Admin',
        blockedBy: inBlockedBy = 'Admin',
        blocked_by: inBlocked_by,
      } = body || {};

      const kundNumber = Number(inKundNumber || inKund_number);
      const eventDate = (inDate || inEventDate || inEvent_date || '2026-12-14').trim();
      const session = (inSession || 'morning').trim().toLowerCase();
      const reason = inReason.trim();
      const blockedBy = (inBlockedBy || inBlocked_by || 'Admin').trim();

      if (!kundNumber || kundNumber < 1 || kundNumber > 2151) {
        return res.status(400).json({
          success: false,
          error: 'Invalid kundNumber. Must be between 1 and 2151.',
        });
      }

      if (action === 'unblock') {
        // Delete block from kund_blocks
        await sql`
          DELETE FROM kund_blocks
          WHERE kund_number = ${kundNumber}
            AND event_date = ${eventDate}::date
            AND LOWER(session) = ${session};
        `;

        return res.status(200).json({
          success: true,
          action: 'unblock',
          kundNumber,
          date: eventDate,
          session,
          message: `Kund ${kundNumber} unblocked successfully for ${eventDate} (${session}).`,
        });
      }

      // Action: block
      // Remove any existing duplicate block for this slot first
      await sql`
        DELETE FROM kund_blocks
        WHERE kund_number = ${kundNumber}
          AND event_date = ${eventDate}::date
          AND LOWER(session) = ${session};
      `;

      // Insert fresh block
      await sql`
        INSERT INTO kund_blocks (
          kund_number,
          event_date,
          session,
          reason,
          blocked_by
        ) VALUES (
          ${kundNumber},
          ${eventDate}::date,
          ${session},
          ${reason},
          ${blockedBy}
        );
      `;

      return res.status(200).json({
        success: true,
        action: 'block',
        kundNumber,
        date: eventDate,
        session,
        reason,
        blockedBy,
        message: `Kund ${kundNumber} marked as BLOCKED for ${eventDate} (${session}).`,
      });
    } catch (err: any) {
      console.error('Error toggling kund block:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update kund block.',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed.`,
  });
}
