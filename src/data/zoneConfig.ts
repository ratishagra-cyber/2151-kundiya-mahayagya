export interface SectorConfig {
  id: string; // e.g. "z1-sec-a"
  name: string; // "Sector A"
  nameHi: string; // "सेक्टर क"
  startKund: number;
  endKund: number;
  totalKunds: number;
}

export interface ZoneConfig {
  id: number;
  name: string;
  nameHi: string;
  shortName: string;
  startKund: number;
  endKund: number;
  totalKunds: number;
  sectors: SectorConfig[];
}

function createSectorsForZone(zoneId: number, startKund: number, endKund: number): SectorConfig[] {
  const total = endKund - startKund + 1;
  const sectorCount = 4;
  const baseSize = Math.floor(total / sectorCount);
  const remainder = total % sectorCount;

  const sectorLetters = ['A', 'B', 'C', 'D'];
  const sectorHindiLetters = ['क', 'ख', 'ग', 'घ'];
  const sectors: SectorConfig[] = [];

  let currentStart = startKund;
  for (let i = 0; i < sectorCount; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    const currentEnd = currentStart + size - 1;
    sectors.push({
      id: `z${zoneId}-sec-${sectorLetters[i].toLowerCase()}`,
      name: `Sector ${sectorLetters[i]}`,
      nameHi: `सेक्टर ${sectorHindiLetters[i]}`,
      startKund: currentStart,
      endKund: currentEnd,
      totalKunds: size,
    });
    currentStart = currentEnd + 1;
  }

  return sectors;
}

export const ZONES: ZoneConfig[] = [
  {
    id: 1,
    name: 'Zone 1 - Brahma Kund Precinct',
    nameHi: 'जोन 1 - ब्रह्म कुण्ड परिसर',
    shortName: 'Zone 1',
    startKund: 1,
    endKund: 195,
    totalKunds: 195,
    sectors: createSectorsForZone(1, 1, 195),
  },
  {
    id: 2,
    name: 'Zone 2 - Vishnu Kund Precinct',
    nameHi: 'जोन 2 - विष्णु कुण्ड परिसर',
    shortName: 'Zone 2',
    startKund: 196,
    endKund: 390,
    totalKunds: 195,
    sectors: createSectorsForZone(2, 196, 390),
  },
  {
    id: 3,
    name: 'Zone 3 - Shiva Kund Precinct',
    nameHi: 'जोन 3 - शिव कुण्ड परिसर',
    shortName: 'Zone 3',
    startKund: 391,
    endKund: 585,
    totalKunds: 195,
    sectors: createSectorsForZone(3, 391, 585),
  },
  {
    id: 4,
    name: 'Zone 4 - Gayatri Kund Precinct',
    nameHi: 'जोन 4 - गायत्री कुण्ड परिसर',
    shortName: 'Zone 4',
    startKund: 586,
    endKund: 780,
    totalKunds: 195,
    sectors: createSectorsForZone(4, 586, 780),
  },
  {
    id: 5,
    name: 'Zone 5 - Ganga Kund Precinct',
    nameHi: 'जोन 5 - गंगा कुण्ड परिसर',
    shortName: 'Zone 5',
    startKund: 781,
    endKund: 975,
    totalKunds: 195,
    sectors: createSectorsForZone(5, 781, 975),
  },
  {
    id: 6,
    name: 'Zone 6 - Saraswati Kund Precinct',
    nameHi: 'जोन 6 - सरस्वती कुण्ड परिसर',
    shortName: 'Zone 6',
    startKund: 976,
    endKund: 1170,
    totalKunds: 195,
    sectors: createSectorsForZone(6, 976, 1170),
  },
  {
    id: 7,
    name: 'Zone 7 - Yamuna Kund Precinct',
    nameHi: 'जोन 7 - यमुना कुण्ड परिसर',
    shortName: 'Zone 7',
    startKund: 1171,
    endKund: 1365,
    totalKunds: 195,
    sectors: createSectorsForZone(7, 1171, 1365),
  },
  {
    id: 8,
    name: 'Zone 8 - Narmada Kund Precinct',
    nameHi: 'जोन 8 - नर्मदा कुण्ड परिसर',
    shortName: 'Zone 8',
    startKund: 1366,
    endKund: 1560,
    totalKunds: 195,
    sectors: createSectorsForZone(8, 1366, 1560),
  },
  {
    id: 9,
    name: 'Zone 9 - Sindhu Kund Precinct',
    nameHi: 'जोन 9 - सिन्धु कुण्ड परिसर',
    shortName: 'Zone 9',
    startKund: 1561,
    endKund: 1755,
    totalKunds: 195,
    sectors: createSectorsForZone(9, 1561, 1755),
  },
  {
    id: 10,
    name: 'Zone 10 - Kaveri Kund Precinct',
    nameHi: 'जोन 10 - कावेरी कुण्ड परिसर',
    shortName: 'Zone 10',
    startKund: 1756,
    endKund: 1950,
    totalKunds: 195,
    sectors: createSectorsForZone(10, 1756, 1950),
  },
  {
    id: 11,
    name: 'Zone 11 - Mahamrityunjaya Kund Precinct',
    nameHi: 'जोन 11 - महामृत्युंजय कुण्ड परिसर',
    shortName: 'Zone 11',
    startKund: 1951,
    endKund: 2151,
    totalKunds: 201,
    sectors: createSectorsForZone(11, 1951, 2151),
  },
];

export function findZoneByKund(kundNumber: number): ZoneConfig | undefined {
  return ZONES.find((z) => kundNumber >= z.startKund && kundNumber <= z.endKund);
}

export function findSectorByKund(kundNumber: number): { zone: ZoneConfig; sector: SectorConfig } | undefined {
  const zone = findZoneByKund(kundNumber);
  if (!zone) return undefined;
  const sector = zone.sectors.find((s) => kundNumber >= s.startKund && kundNumber <= s.endKund);
  if (!sector) return undefined;
  return { zone, sector };
}
