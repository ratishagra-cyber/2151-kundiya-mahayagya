import { DaySchedule, Booking } from '../types';

export const EVENT_DETAILS = {
  title: '2151 Kundiya Mrityunjay Maa Pitambara Mahayagya',
  titleHindi: 'आगरा में 2151 कुंडीय मृत्युंजय माँ पीताम्बरा महायज्ञ',
  venue: 'JCB Tiraha, Shastripuram, Agra, Uttar Pradesh',
  patron: 'Swami Ramdas Ji Maharaj (Mukhya Yajman)',
  datesLabel: '14–21 December 2026 (8 Divya Days)',
  totalKunds: 2151,
  seatsPerKund: 8,
  totalSessionCapacity: 2151 * 8, // 17,208 seats per session
  morningTimings: '8:00 AM – 11:00 AM (Pratahkalin Ahuti)',
  afternoonTimings: '1:00 PM – 4:00 PM (Madhyahnkalin Ahuti)',
  bannerPath: '/assets/aistudio/December_Mahayagya_Devotional_Banner_762fe65c.png',
};

export const EVENT_DAYS: { date: string; label: string; shortLabel: string; tithi: string }[] = [
  { date: '2026-12-14', label: 'Day 1 - 14 Dec 2026 (Mon)', shortLabel: '14 Dec (M)', tithi: 'Yagya Aarambh & Arani Manthan' },
  { date: '2026-12-15', label: 'Day 2 - 15 Dec 2026 (Tue)', shortLabel: '15 Dec (T)', tithi: 'Panchdev Poojan & Havan' },
  { date: '2026-12-16', label: 'Day 3 - 16 Dec 2026 (Wed)', shortLabel: '16 Dec (W)', tithi: 'Mahamrityunjay Vishesh Ahuti' },
  { date: '2026-12-17', label: 'Day 4 - 17 Dec 2026 (Thu)', shortLabel: '17 Dec (Th)', tithi: 'Pitambara Shatru Samhara Prayog' },
  { date: '2026-12-18', label: 'Day 5 - 18 Dec 2026 (Fri)', shortLabel: '18 Dec (F)', tithi: 'Shri Suktam & Lakshmi Havan' },
  { date: '2026-12-19', label: 'Day 6 - 19 Dec 2026 (Sat)', shortLabel: '19 Dec (Sa)', tithi: 'Rudra Gayatri Maha Ahuti' },
  { date: '2026-12-20', label: 'Day 7 - 20 Dec 2026 (Sun)', shortLabel: '20 Dec (Su)', tithi: 'Sarva Karya Siddhi Havan' },
  { date: '2026-12-21', label: 'Day 8 - 21 Dec 2026 (Mon)', shortLabel: '21 Dec (M)', tithi: 'Maha Poornahuti & Kalash Visarjan' },
];

export const KUND_ZONES = [
  { id: 'Zone A', name: 'Divya Sanctum (North)', range: [1, 300] as [number, number], color: '#be123c' },
  { id: 'Zone B', name: 'Rudra Enclosure (East)', range: [301, 600] as [number, number], color: '#c2410c' },
  { id: 'Zone C', name: 'Pitambara Central Sanctum', range: [601, 950] as [number, number], color: '#b45309' },
  { id: 'Zone D', name: 'Mahamrityunjay Enclosure (West)', range: [951, 1300] as [number, number], color: '#047857' },
  { id: 'Zone E', name: 'Shiv Shakti Enclosure (South)', range: [1301, 1650] as [number, number], color: '#4338ca' },
  { id: 'Zone F', name: 'Ganga-Yamuna Outer Ring East', range: [1651, 1950] as [number, number], color: '#0369a1' },
  { id: 'Zone G', name: 'Kailash Outer Ring West', range: [1951, 2151] as [number, number], color: '#6d28d9' },
];

export function getZoneForKund(kundNumber: number): { id: string; name: string } {
  for (const zone of KUND_ZONES) {
    if (kundNumber >= zone.range[0] && kundNumber <= zone.range[1]) {
      return { id: zone.id, name: zone.name };
    }
  }
  return { id: 'Zone A', name: 'Divya Sanctum' };
}

export function createDefaultSchedule(): DaySchedule[] {
  return EVENT_DAYS.map((day) => ({
    date: day.date,
    dayLabel: day.shortLabel,
    morning: false,
    afternoon: false,
  }));
}

// Pre-seeded realistic bookings so that the event occupancy simulator is immediately live and testable
export const INITIAL_SEEDED_BOOKINGS: Booking[] = [
  {
    id: 'MY-2026-1042',
    createdAt: '2026-10-18T10:30:00Z',
    yagyakarta: {
      fullName: 'Pandit Rameshwar Sharma',
      primaryMobile: '9829012345',
      secondaryMobile: '9829012346',
      email: 'rameshwar.sharma@example.com',
      address: '42, Dayal Bagh, Near Temple',
      city: 'Agra',
      state: 'Uttar Pradesh',
      pincode: '282007',
      gotra: 'Bharadwaj',
      sankalpPurpose: 'Parivarik Kalyan & Arogya',
    },
    participants: [
      {
        id: 'p-1',
        name: 'Pandit Rameshwar Sharma',
        age: 54,
        gender: 'male',
        relationship: 'Self / Yagyakarta',
        mobile: '9829012345',
        isYagyakarta: true,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-2',
        name: 'Sunita Sharma',
        age: 50,
        gender: 'female',
        relationship: 'Spouse',
        mobile: '9829012346',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-3',
        name: 'Aditya Sharma',
        age: 24,
        gender: 'male',
        relationship: 'Child',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-4',
        name: 'Pooja Sharma',
        age: 22,
        gender: 'female',
        relationship: 'Child',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
    ],
    allocations: EVENT_DAYS.map(d => ({
      date: d.date,
      session: 'morning',
      kundNumber: 108,
      zone: 'Zone A',
      participantIds: ['p-1', 'p-2', 'p-3', 'p-4'],
      participantCount: 4,
    })),
    status: 'confirmed',
  },
  {
    id: 'MY-2026-1043',
    createdAt: '2026-10-18T11:15:00Z',
    yagyakarta: {
      fullName: 'Vikram Singh Chauhan',
      primaryMobile: '9412098765',
      secondaryMobile: '9412098766',
      address: '15-A, Krishna Nagar, Dampier Nagar',
      city: 'Mathura',
      state: 'Uttar Pradesh',
      pincode: '281001',
      gotra: 'Kashyap',
      sankalpPurpose: 'Vyapar Vriddhi',
    },
    participants: [
      {
        id: 'p-5',
        name: 'Vikram Singh Chauhan',
        age: 46,
        gender: 'male',
        relationship: 'Self / Yagyakarta',
        mobile: '9412098765',
        isYagyakarta: true,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-6',
        name: 'Rajni Chauhan',
        age: 42,
        gender: 'female',
        relationship: 'Spouse',
        mobile: '9412098766',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-7',
        name: 'Ranveer Chauhan',
        age: 18,
        gender: 'male',
        relationship: 'Child',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
      {
        id: 'p-8',
        name: 'Devika Chauhan',
        age: 15,
        gender: 'female',
        relationship: 'Child',
        isYagyakarta: false,
        schedule: EVENT_DAYS.map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: false })),
      },
    ],
    // Best-fit matches Kund 108 (which already had 4 seats taken by Pandit Sharma, making it 8/8 full!)
    allocations: EVENT_DAYS.map(d => ({
      date: d.date,
      session: 'morning',
      kundNumber: 108,
      zone: 'Zone A',
      participantIds: ['p-5', 'p-6', 'p-7', 'p-8'],
      participantCount: 4,
    })),
    status: 'confirmed',
  },
  {
    id: 'MY-2026-2184',
    createdAt: '2026-10-18T14:20:00Z',
    yagyakarta: {
      fullName: 'Dr. Anand Kumar Gupta',
      primaryMobile: '9811223344',
      address: 'B-12, Greater Kailash-I',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      gotra: 'Garg',
      sankalpPurpose: 'Maha Poornahuti Vishesh Darshan',
    },
    participants: [
      {
        id: 'p-9',
        name: 'Dr. Anand Kumar Gupta',
        age: 58,
        gender: 'male',
        relationship: 'Self / Yagyakarta',
        mobile: '9811223344',
        isYagyakarta: true,
        schedule: EVENT_DAYS.slice(5).map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: true })),
      },
      {
        id: 'p-10',
        name: 'Meenakshi Gupta',
        age: 55,
        gender: 'female',
        relationship: 'Spouse',
        isYagyakarta: false,
        schedule: EVENT_DAYS.slice(5).map(d => ({ date: d.date, dayLabel: d.shortLabel, morning: true, afternoon: true })),
      },
    ],
    allocations: [
      { date: '2026-12-19', session: 'morning', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
      { date: '2026-12-19', session: 'afternoon', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
      { date: '2026-12-20', session: 'morning', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
      { date: '2026-12-20', session: 'afternoon', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
      { date: '2026-12-21', session: 'morning', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
      { date: '2026-12-21', session: 'afternoon', kundNumber: 601, zone: 'Zone C', participantIds: ['p-9', 'p-10'], participantCount: 2 },
    ],
    status: 'confirmed',
  },
  {
    id: 'MY-2026-3390',
    createdAt: '2026-10-19T09:00:00Z',
    yagyakarta: {
      fullName: 'Shri Jagdish Prasad Mishra',
      primaryMobile: '9799887766',
      secondaryMobile: '9799887767',
      address: '78, Gomti Nagar, Near Riverside',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226001',
      gotra: 'Shandilya',
      sankalpPurpose: 'Maha Rudrabhishek',
    },
    participants: [
      { id: 'p-11', name: 'Jagdish Prasad Mishra', age: 62, gender: 'male', relationship: 'Self / Yagyakarta', mobile: '9799887766', isYagyakarta: true, schedule: [] },
      { id: 'p-12', name: 'Shanti Devi', age: 58, gender: 'female', relationship: 'Spouse', mobile: '9799887767', isYagyakarta: false, schedule: [] },
      { id: 'p-13', name: 'Alok Mishra', age: 34, gender: 'male', relationship: 'Child', isYagyakarta: false, schedule: [] },
      { id: 'p-14', name: 'Bhawna Mishra', age: 30, gender: 'female', relationship: 'Relative', isYagyakarta: false, schedule: [] },
      { id: 'p-15', name: 'Aarav Mishra', age: 8, gender: 'male', relationship: 'Child', isYagyakarta: false, schedule: [] },
      { id: 'p-16', name: 'Kavya Mishra', age: 6, gender: 'female', relationship: 'Child', isYagyakarta: false, schedule: [] },
    ],
    // Group of 6 booked for Day 1 & Day 2 Morning
    allocations: [
      { date: '2026-12-14', session: 'morning', kundNumber: 955, zone: 'Zone D', participantIds: ['p-11', 'p-12', 'p-13', 'p-14', 'p-15', 'p-16'], participantCount: 6 },
      { date: '2026-12-15', session: 'morning', kundNumber: 955, zone: 'Zone D', participantIds: ['p-11', 'p-12', 'p-13', 'p-14', 'p-15', 'p-16'], participantCount: 6 },
    ],
    status: 'confirmed',
  },
];
