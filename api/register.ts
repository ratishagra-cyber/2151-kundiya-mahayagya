import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const MAX_PER_KUND = 8;
const TOTAL_KUNDS = 2151;

async function findBestKund(
  eventDate: string,
  session: string,
  familySize: number
): Promise<number | null> {
  // Get current occupancy for this date/session
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

  // Also exclude blocked kunds
  const blocked = await sql`
    select kund_number from kund_blocks
    where event_date = ${eventDate} and session = ${session}
  `;
  const blockedSet = new Set(blocked.map((b: any) => b.kund_number));

  // Prefer partially filled kunds that can fit the family
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

  // Otherwise take the first empty kund
  for (let k = 1; k <= TOTAL_KUNDS; k++) {
    if (blockedSet.has(k)) continue;
    const occupied = occupancy.get(k) || 0;
    if (occupied === 0) return k;
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const y = body.yagyakarta || {};

    const yagyakarta_name = (y.fullName || '').trim();
    const primary_mobile = (y.primaryMobile || '').trim();
    const secondary_mobile = (y.secondaryMobile || '').trim() || null;
    const email = (y.email || '').trim() || null;
    const address = (y.address || '').trim();
    const city = (y.city || '').trim();
    const state = (y.state || '').trim() || null;
    const gotra = (y.gotra || '').trim() || null;

    const participants = body.participants || [];
    const familySchedule = body.familySchedule || [];

    if (!yagyakarta_name || !primary_mobile || !city || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const familySize = Math.max(participants.length, 1);
    const bookingCode = body.bookingCode || body.id || 'MYA-' + Date.now().toString().slice(-8);

    // Insert booking
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

    // Insert participants
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

    // Allocate kunds for each selected session
    const allocated: any[] = [];
    for (const s of familySchedule) {
      if (!s.morning && !s.afternoon) continue;

      const sessionsToAllocate = [];
      if (s.morning) sessionsToAllocate.push('morning');
      if (s.afternoon) sessionsToAllocate.push('afternoon');

      for (const session of sessionsToAllocate) {
        const kund = await findBestKund(s.date, session, familySize);
        if (kund === null) {
          return res.status(409).json({
            error: `No kund available for ${s.date} ${session}`,
          });
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
