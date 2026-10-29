import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const MAX_PER_KUND = 8;
const TOTAL_KUNDS = 2151;

async function findBestKund(
  eventDate: string,
  session: string,
  familySize: number
): Promise<number | null> {
  const rows = await sql`
    select kund_number, coalesce(sum(participant_count), 0)::int as occupied
    from allocations
    where event_date = ${eventDate} and session = ${session}
    group by kund_number
  `;

  const occupancy = new Map<number, number>();
  for (const row of rows) {
    occupancy.set(row.kund_number, row.occupied);
  }

  const blocked = await sql`
    select kund_number from kund_blocks
    where event_date = ${eventDate} and session = ${session}
  `;
  const blockedSet = new Set(blocked.map((b: any) => b.kund_number));

  let bestPartial: number | null = null;
  let bestPartialOccupied = -1;

  for (let k = 1; k <= TOTAL_KUNDS; k++) {
    if (blockedSet.has(k)) continue;
    const occupied = occupancy.get(k) || 0;
    if (occupied + familySize <= MAX_PER_KUND) {
      if (occupied > 0 && occupied > bestPartialOccupied) {
        bestPartial = k;
        bestPartialOccupied = occupied;
      }
    }
  }

  if (bestPartial !== null) return bestPartial;

  for (let k = 1; k <= TOTAL_KUNDS; k++) {
    if (blockedSet.has(k)) continue;
    const occupied = occupancy.get(k) || 0;
    if (occupied === 0) return k;
  }

  return null;
}

async function isKundAvailable(
  kundNumber: number,
  eventDate: string,
  session: string,
  familySize: number
): Promise<boolean> {
  const [blocked] = await sql`
    select id from kund_blocks
    where kund_number = ${kundNumber} and event_date = ${eventDate} and session = ${session}
  `;
  if (blocked) return false;

  const [occ] = await sql`
    select coalesce(sum(participant_count), 0)::int as occupied
    from allocations
    where event_date = ${eventDate} and session = ${session} and kund_number = ${kundNumber}
  `;
  const occupied = occ?.occupied || 0;
  return occupied + familySize <= MAX_PER_KUND;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Honeypot check — reject bots that fill hidden fields
    if (body.website || body.company || body.url || body.honeypot) {
      return res.status(200).json({ success: true, bookingCode: 'MY-BOT-0000' });
    }

    const y = body.yagyakarta || {};

    const yagyakarta_name = (y.fullName || y.yagyakarta_name || '').trim();
    const primary_mobile = (y.primaryMobile || y.primary_mobile || '').trim();
    const secondary_mobile = (y.secondaryMobile || y.secondary_mobile || '').trim() || null;
    const email = (y.email || '').trim() || null;
    const address = (y.address || body.address || '').trim();
    const city = (y.city || body.city || '').trim();
    const state = (y.state || body.state || '').trim() || null;
    const gotra = (y.gotra || body.gotra || '').trim() || null;

    const participants = body.participants || [];
    const familySchedule = body.familySchedule || [];
    const requestedAllocations = body.allocations || [];

    if (!yagyakarta_name || !primary_mobile || !city || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { yagyakarta_name, primary_mobile, city, address },
      });
    }

    const familySize = Math.max(participants.length, 1);
    const bookingCode = body.bookingCode || body.id || 'MYA-' + Date.now().toString().slice(-8);

    const [booking] = await sql`
      insert into bookings (
        booking_code, yagyakarta_name, primary_mobile, secondary_mobile,
        email, address, city, state, gotra
      ) values (
        ${bookingCode}, ${yagyakarta_name}, ${primary_mobile}, ${secondary_mobile},
        ${email}, ${address}, ${city}, ${state}, ${gotra}
      )
      returning id, booking_code
    `;

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

    const allocated: any[] = [];

    const requestedMap = new Map<string, number>();
    for (const a of requestedAllocations) {
      if (a.date && a.session && a.kundNumber) {
        requestedMap.set(`${a.date}|${a.session}`, Number(a.kundNumber));
      }
    }

    for (const s of familySchedule) {
      if (!s.morning && !s.afternoon) continue;

      const sessionsToAllocate = [];
      if (s.morning) sessionsToAllocate.push('morning');
      if (s.afternoon) sessionsToAllocate.push('afternoon');

      for (const session of sessionsToAllocate) {
        const key = `${s.date}|${session}`;
        const requestedKund = requestedMap.get(key);

        let kund: number | null = null;

        if (requestedKund) {
          const available = await isKundAvailable(requestedKund, s.date, session, familySize);
          if (available) {
            kund = requestedKund;
          } else {
            return res.status(409).json({
              error: `Kund ${requestedKund} is not available for ${s.date} ${session}`,
            });
          }
        } else {
          kund = await findBestKund(s.date, session, familySize);
          if (kund === null) {
            return res.status(409).json({
              error: `No kund available for ${s.date} ${session}`,
            });
          }
        }

        await sql`
          insert into allocations (booking_id, event_date, session, kund_number, participant_count)
          values (${booking.id}, ${s.date}, ${session}, ${kund}, ${familySize})
        `;

        allocated.push({
          date: s.date,
          session,
          kundNumber: kund,
          participantCount: familySize,
        });
      }
    }

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
        address,
        city,
        state,
        gotra,
      },
      participants,
      allocations: allocated,
      familySchedule,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
