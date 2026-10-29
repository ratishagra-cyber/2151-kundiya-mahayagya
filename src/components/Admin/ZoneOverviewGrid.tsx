import React from 'react';
import { 
  Layers, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowLeft, 
  Search,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { ZONES, ZoneConfig, SectorConfig, findSectorByKund } from '../../data/zoneConfig';
import { KundSeatGrid, KundDetailInfo } from './KundSeatGrid';

export interface ZoneSummaryItem {
  zoneId: number;
  name: string;
  nameHi: string;
  startKund: number;
  endKund: number;
  totalKunds: number;
  occupiedKunds: number;
  vacantKunds: number;
  partialKunds: number;
  fullKunds: number;
  blockedKunds: number;
  occupiedSeats: number;
  capacitySeats: number;
  fillPercentage: number;
}

interface ZoneOverviewGridProps {
  zoneSummaries?: ZoneSummaryItem[];
  kundDetailsMap: Record<number, KundDetailInfo>;
  onSelectBooking?: (bookingCode: string) => void;
  lang?: 'en' | 'hi';
}

export const ZoneOverviewGrid: React.FC<ZoneOverviewGridProps> = ({
  zoneSummaries = [],
  kundDetailsMap,
  onSelectBooking,
  lang = 'hi',
}) => {
  const [selectedZoneId, setSelectedZoneId] = React.useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string | null>(null);
  const [kundSearchInput, setKundSearchInput] = React.useState<string>('');
  const [jumpError, setJumpError] = React.useState<string | null>(null);

  // Map zoneSummaries by zoneId for fast lookup
  const summaryMap = React.useMemo(() => {
    const map = new Map<number, ZoneSummaryItem>();
    zoneSummaries.forEach((s) => map.set(s.zoneId, s));
    return map;
  }, [zoneSummaries]);

  const activeZone: ZoneConfig | undefined = selectedZoneId
    ? ZONES.find((z) => z.id === selectedZoneId)
    : undefined;

  const activeSector: SectorConfig | undefined = activeZone
    ? (activeZone.sectors.find((s) => s.id === selectedSectorId) || activeZone.sectors[0])
    : undefined;

  // Handle direct jump to kund number 1-2151
  const handleJumpToKund = (e: React.FormEvent) => {
    e.preventDefault();
    setJumpError(null);
    const num = parseInt(kundSearchInput.trim(), 10);
    if (isNaN(num) || num < 1 || num > 2151) {
      setJumpError(lang === 'hi' ? 'कृपया 1 से 2151 के बीच कुण्ड संख्या दर्ज करें' : 'Enter a valid kund number between 1 and 2151');
      return;
    }

    const match = findSectorByKund(num);
    if (match) {
      setSelectedZoneId(match.zone.id);
      setSelectedSectorId(match.sector.id);
      setKundSearchInput('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Direct Jump Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-3xl border border-stone-200">
        <div>
          <div className="text-xs font-bold text-stone-900 font-serif flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>{lang === 'hi' ? '11 मण्डलीय जोन एवं कुण्ड ऑक्यूपेंसी' : '11 Sacred Zones & Kund Occupancy Grid'}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {lang === 'hi' 
              ? 'जोन कार्ड पर क्लिक करके उसके सेक्टर व बस-सीट कुण्ड ग्रिड में जाएं।' 
              : 'Click any zone card to expand its sectors and tap individual kunds.'}
          </p>
        </div>

        {/* Quick Kund Jumper */}
        <form onSubmit={handleJumpToKund} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="number"
              min={1}
              max={2151}
              value={kundSearchInput}
              onChange={(e) => {
                setKundSearchInput(e.target.value);
                setJumpError(null);
              }}
              placeholder={lang === 'hi' ? 'कुण्ड सं. (उदा. 108)' : 'Jump to Kund # (e.g. 108)'}
              className="min-h-[44px] w-44 pl-3 pr-2 rounded-xl border border-stone-300 bg-white text-xs font-mono placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'खोजें' : 'Jump'}</span>
          </button>
        </form>
      </div>

      {jumpError && (
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-medium">
          {jumpError}
        </div>
      )}

      {/* VIEW MODE 1: ALL 11 ZONES IN A GRID OF CARDS (Laptop/Mobile responsive) */}
      {!activeZone ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ZONES.map((zone) => {
            const summary = summaryMap.get(zone.id);
            const totalKunds = zone.totalKunds;
            const occupiedCount = summary?.occupiedKunds || 0;
            const vacantCount = summary?.vacantKunds ?? (totalKunds - occupiedCount);
            const fillPercentage = summary?.fillPercentage ?? Number(((occupiedCount / totalKunds) * 100).toFixed(1));
            const blockedCount = summary?.blockedKunds || 0;
            const fullCount = summary?.fullKunds || 0;
            const partialCount = summary?.partialKunds || 0;

            return (
              <div
                key={zone.id}
                onClick={() => {
                  setSelectedZoneId(zone.id);
                  setSelectedSectorId(zone.sectors[0].id);
                }}
                className="group p-5 bg-white rounded-3xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Zone Header */}
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 text-[11px]">
                      {zone.shortName}
                    </span>
                    <span className="font-mono text-stone-500 font-semibold text-[11px]">
                      #{zone.startKund} – #{zone.endKund}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors mt-1.5 leading-snug">
                    {lang === 'hi' ? zone.nameHi : zone.name}
                  </h3>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center py-2 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="p-1.5">
                    <div className="text-[10px] font-semibold text-stone-500 uppercase">
                      {lang === 'hi' ? 'कुल कुण्ड' : 'Total Kunds'}
                    </div>
                    <div className="text-lg font-mono font-extrabold text-stone-900 tabular-nums">
                      {totalKunds}
                    </div>
                  </div>
                  <div className="p-1.5 border-l border-stone-200">
                    <div className="text-[10px] font-semibold text-emerald-700 uppercase">
                      {lang === 'hi' ? 'रिक्त (खाली)' : 'Vacant'}
                    </div>
                    <div className="text-lg font-mono font-extrabold text-emerald-950 tabular-nums">
                      {vacantCount}
                    </div>
                  </div>
                </div>

                {/* Fill Percentage & Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-medium">
                      {lang === 'hi' ? 'ऑक्यूपेंसी प्रतिशत:' : 'Fill Percentage:'}
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {fillPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, fillPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Sub status badges & CTA */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    {occupiedCount > 0 ? (
                      <span className="text-amber-700 font-semibold">{occupiedCount} {lang === 'hi' ? 'आवंटित' : 'active'}</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">{lang === 'hi' ? 'पूर्णतः रिक्त' : 'All empty'}</span>
                    )}
                    {blockedCount > 0 && (
                      <span className="text-purple-700">· {blockedCount} {lang === 'hi' ? 'ब्लॉक' : 'blocked'}</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-900 group-hover:text-rose-950">
                    <span>{lang === 'hi' ? 'विस्तार' : 'View'}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: EXPANDED ZONE WITH SECTORS AND BUS-SEAT KUND GRID */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Breadcrumb Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedZoneId(null);
                  setSelectedSectorId(null);
                }}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सभी 11 जोन' : 'All 11 Zones'}</span>
              </button>

              <span className="text-stone-300">/</span>

              <div className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                {lang === 'hi' ? activeZone.nameHi : activeZone.name}
              </div>
              <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Kund #{activeZone.startKund} – #{activeZone.endKund}
              </span>
            </div>

            {/* Quick Zone Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 font-medium">
                {lang === 'hi' ? 'जोन बदलें:' : 'Switch Zone:'}
              </label>
              <select
                value={activeZone.id}
                onChange={(e) => {
                  const zId = Number(e.target.value);
                  const z = ZONES.find((item) => item.id === zId);
                  if (z) {
                    setSelectedZoneId(z.id);
                    setSelectedSectorId(z.sectors[0].id);
                  }
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.shortName}: {lang === 'hi' ? z.nameHi : z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sector Tabs (4 Sectors: A, B, C, D) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activeZone.sectors.map((sec) => {
              const isSelected = sec.id === activeSector?.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectorId(sec.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? 'bg-stone-900 text-amber-300 border-stone-950 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{lang === 'hi' ? sec.nameHi : sec.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-stone-800 text-amber-200' : 'bg-stone-100 text-stone-600'
                  }`}>
                    #{sec.startKund}–#{sec.endKund}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bus Seat Kund Grid for Selected Sector */}
          {activeSector && (
            <KundSeatGrid
              zone={activeZone}
              sector={activeSector}
              kundDetailsMap={kundDetailsMap}
              onSelectBooking={onSelectBooking}
              lang={lang}
            />
          )}

        </div>
      )}

    </div>
  );
};
