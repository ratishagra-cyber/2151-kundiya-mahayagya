import React from 'react';
import { 
  X, 
  Check, 
  Search, 
  Sparkles, 
  Lock,
  Sun,
  Sunset,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy
} from 'lucide-react';
import { ZONES, findSectorByKund } from '../../data/zoneConfig';
import { HavanKundIcon } from '../Common/HavanKundIcon';
import { SessionType } from '../../types';

export interface SelectedSessionOption {
  date: string;
  session: SessionType;
  dayLabel: string;
}

export interface SessionKundAllocation {
  kundNumber: number;
  zone: string;
}

interface ManualKundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSessions: SelectedSessionOption[];
  initialSessionKey?: string | null;
  sessionAllocations: Record<string, SessionKundAllocation>;
  onSaveAllocations: (allocations: Record<string, SessionKundAllocation>) => void;
  familySize: number;
  lang?: 'en' | 'hi';
}

export const ManualKundPickerModal: React.FC<ManualKundPickerModalProps> = ({
  isOpen,
  onClose,
  selectedSessions = [],
  initialSessionKey,
  sessionAllocations = {},
  onSaveAllocations,
  familySize,
  lang = 'hi',
}) => {
  // Ensure we have at least one fallback session if none provided
  const safeSessions: SelectedSessionOption[] = React.useMemo(() => {
    if (selectedSessions.length > 0) return selectedSessions;
    return [{ date: '2026-12-14', session: 'morning', dayLabel: 'Day 1 · 14 Dec' }];
  }, [selectedSessions]);

  // Active session tab (key: `${date}_${session}`)
  const [activeSessionKey, setActiveSessionKey] = React.useState<string>(() => {
    if (initialSessionKey && safeSessions.some((s) => `${s.date}_${s.session}` === initialSessionKey)) {
      return initialSessionKey;
    }
    return `${safeSessions[0].date}_${safeSessions[0].session}`;
  });

  // Local copy of allocations being edited inside the modal
  const [tempAllocations, setTempAllocations] = React.useState<Record<string, SessionKundAllocation>>(sessionAllocations);

  // Active Zone & Sector selection in the map
  const [selectedZoneId, setSelectedZoneId] = React.useState<number>(1);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string>('z1-sec-a');

  // Search input
  const [searchKundText, setSearchKundText] = React.useState<string>('');
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Occupancy and blocked data for current date & session
  const [isLoadingOccupancy, setIsLoadingOccupancy] = React.useState<boolean>(false);
  const [occupancyData, setOccupancyData] = React.useState<
    Record<number, { occupied?: number; occupiedSeats: number; remainingSeats?: number; isBlocked: boolean; blockedReason?: string }>
  >({});
  const [copySuccessMessage, setCopySuccessMessage] = React.useState<string | null>(null);

  // Sync state when modal opens or initialSessionKey / sessionAllocations change
  React.useEffect(() => {
    if (isOpen) {
      setTempAllocations(sessionAllocations);
      const targetKey =
        initialSessionKey && safeSessions.some((s) => `${s.date}_${s.session}` === initialSessionKey)
          ? initialSessionKey
          : `${safeSessions[0].date}_${safeSessions[0].session}`;
      setActiveSessionKey(targetKey);

      // If this session has a kund selected, focus that zone
      const existing = sessionAllocations[targetKey];
      if (existing?.kundNumber) {
        const match = findSectorByKund(existing.kundNumber);
        if (match) {
          setSelectedZoneId(match.zone.id);
          setSelectedSectorId(match.sector.id);
        }
      }
    }
  }, [isOpen, initialSessionKey, sessionAllocations, safeSessions]);

  // Current session object
  const currentSessionObj = React.useMemo(() => {
    return safeSessions.find((s) => `${s.date}_${s.session}` === activeSessionKey) || safeSessions[0];
  }, [safeSessions, activeSessionKey]);

  // Fetch occupancy and blocks specific to current active session date & session type
  React.useEffect(() => {
    if (!isOpen || !currentSessionObj) return;

    let isMounted = true;
    setIsLoadingOccupancy(true);
    setSearchError(null);

    fetch(`/api/admin/occupancy?date=${encodeURIComponent(currentSessionObj.date)}&session=${encodeURIComponent(currentSessionObj.session)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.kundDetails) {
          setOccupancyData(data.kundDetails);
        } else {
          setOccupancyData({});
        }
      })
      .catch((err) => {
        console.warn('Could not load session occupancy, continuing with live defaults:', err);
        if (isMounted) setOccupancyData({});
      })
      .finally(() => {
        if (isMounted) setIsLoadingOccupancy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentSessionObj.date, currentSessionObj.session]);

  if (!isOpen) return null;

  const currentZone = ZONES.find((z) => z.id === selectedZoneId) || ZONES[0];
  const currentSector = currentZone.sectors.find((s) => s.id === selectedSectorId) || currentZone.sectors[0];

  const currentChosenForActiveSession = tempAllocations[activeSessionKey]?.kundNumber || null;

  // Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const num = parseInt(searchKundText.trim(), 10);
    if (isNaN(num) || num < 1 || num > 2151) {
      setSearchError(lang === 'hi' ? 'कृपया 1 से 2151 के बीच कुण्ड संख्या डालें' : 'Enter a number between 1 and 2151');
      return;
    }

    const info = occupancyData[num];
    if (info?.isBlocked) {
      setSearchError(
        lang === 'hi'
          ? `कुण्ड ${num} इस सत्र (${currentSessionObj.dayLabel} ${currentSessionObj.session}) के लिए ब्लॉक/आरक्षित है।`
          : `Kund ${num} is blocked for this session (${currentSessionObj.dayLabel} ${currentSessionObj.session}).`
      );
      return;
    }

    const occupied = typeof info?.occupied === 'number' ? info.occupied : (info?.occupiedSeats || 0);
    if (occupied + familySize > 8) {
      setSearchError(
        lang === 'hi'
          ? `कुण्ड ${num} में पर्याप्त स्थान नहीं है (${occupied}/8 भरे हैं, आपके परिवार में ${familySize} सदस्य हैं)।`
          : `Kund ${num} has only ${8 - occupied} seats remaining for family of ${familySize}.`
      );
      return;
    }

    const match = findSectorByKund(num);
    if (match) {
      setSelectedZoneId(match.zone.id);
      setSelectedSectorId(match.sector.id);
      const zoneName = `${match.zone.shortName} · ${match.sector.name}`;
      setTempAllocations((prev) => ({
        ...prev,
        [activeSessionKey]: { kundNumber: num, zone: zoneName },
      }));
      setSearchKundText('');
    }
  };

  const handleSelectKund = (kNum: number) => {
    const info = occupancyData[kNum];
    if (info?.isBlocked) return;
    const occupied = typeof info?.occupied === 'number' ? info.occupied : (info?.occupiedSeats || 0);
    if (occupied + familySize > 8) return;

    const match = findSectorByKund(kNum);
    const zoneName = match ? `${match.zone.shortName} · ${match.sector.name}` : `Zone ${selectedZoneId}`;

    setTempAllocations((prev) => ({
      ...prev,
      [activeSessionKey]: { kundNumber: kNum, zone: zoneName },
    }));
    setSearchError(null);
    setCopySuccessMessage(null);
  };

  // Helper: Apply current session's selected Kund to all other selected sessions
  const handleApplyToAllSessions = () => {
    if (!currentChosenForActiveSession) return;
    const currentAllocation = tempAllocations[activeSessionKey];
    if (!currentAllocation) return;

    const updated = { ...tempAllocations };
    for (const s of safeSessions) {
      const k = `${s.date}_${s.session}`;
      updated[k] = { ...currentAllocation };
    }
    setTempAllocations(updated);
    setCopySuccessMessage(
      lang === 'hi'
        ? `कुण्ड ${currentChosenForActiveSession} सभी ${safeSessions.length} सत्रों पर लागू कर दिया गया है।`
        : `Kund ${currentChosenForActiveSession} applied to all ${safeSessions.length} sessions.`
    );
    setTimeout(() => setCopySuccessMessage(null), 3000);
  };

  // Check how many sessions have allocations
  const allocatedCount = safeSessions.filter((s) => tempAllocations[`${s.date}_${s.session}`]?.kundNumber).length;
  const isAllAllocated = allocatedCount === safeSessions.length;

  const handleConfirmAll = () => {
    onSaveAllocations(tempAllocations);
    onClose();
  };

  // Kund numbers in current sector
  const kundsInSector: number[] = [];
  for (let k = currentSector.startKund; k <= currentSector.endKund; k++) {
    kundsInSector.push(k);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <HavanKundIcon status="selected" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                  {lang === 'hi' ? 'सत्र-वार कुण्ड चयन' : 'Date & Session Kund Map'}
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-semibold">
                  {familySize} {lang === 'hi' ? 'श्रद्धालु एक साथ' : 'Devotees Together'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif leading-tight">
                {lang === 'hi' ? 'प्रत्येक सत्र के लिए अपना पवित्र कुण्ड चुनें' : 'Select Sacred Kund for Each Session'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Session Switcher Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-stone-100 border-b border-stone-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{lang === 'hi' ? 'परिवार के चयनित सत्र (क्लिक कर कुण्ड चुनें):' : 'Family Sessions (Click to allocate):'}</span>
            </span>
            <span className="text-[11px] font-bold text-stone-700 font-mono">
              {allocatedCount} / {safeSessions.length} {lang === 'hi' ? 'सत्र निर्धारित' : 'allocated'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {safeSessions.map((s) => {
              const sKey = `${s.date}_${s.session}`;
              const isCurrentTab = sKey === activeSessionKey;
              const chosen = tempAllocations[sKey]?.kundNumber;
              const isMorning = s.session === 'morning';

              return (
                <button
                  key={sKey}
                  type="button"
                  onClick={() => {
                    setActiveSessionKey(sKey);
                    if (chosen) {
                      const match = findSectorByKund(chosen);
                      if (match) {
                        setSelectedZoneId(match.zone.id);
                        setSelectedSectorId(match.sector.id);
                      }
                    }
                  }}
                  className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 cursor-pointer ${
                    isCurrentTab
                      ? 'bg-stone-900 text-amber-300 border-stone-950 shadow-sm ring-2 ring-amber-400'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isMorning ? (
                      <Sun className={`w-3.5 h-3.5 ${isCurrentTab ? 'text-amber-400' : 'text-amber-600'}`} />
                    ) : (
                      <Sunset className={`w-3.5 h-3.5 ${isCurrentTab ? 'text-rose-400' : 'text-rose-600'}`} />
                    )}
                    <span>{s.dayLabel}</span>
                    <span className="text-[10px] opacity-75">
                      ({isMorning ? '8-11 AM' : '1-4 PM'})
                    </span>
                  </div>

                  {chosen ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isCurrentTab ? 'bg-amber-400 text-stone-950' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {lang === 'hi' ? 'कुण्ड ' : 'Kund '}{chosen}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold animate-pulse">
                      {lang === 'hi' ? 'चुनें' : 'Select'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Session Status & Quick Kund Search */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-stone-800 flex items-center gap-2">
            <span className="font-bold text-rose-950 flex items-center gap-1">
              {currentSessionObj.session === 'morning' ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Sunset className="w-3.5 h-3.5 text-rose-600" />}
              <span>{currentSessionObj.dayLabel} ({currentSessionObj.session === 'morning' ? 'प्रातः सत्र' : 'दोपहर सत्र'})</span>
            </span>
            <span className="text-stone-400">·</span>
            {currentChosenForActiveSession ? (
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'hi' ? 'वर्तमान चयन: कुण्ड ' : 'Selected: Kund '}{currentChosenForActiveSession}</span>
              </span>
            ) : (
              <span className="text-rose-800 font-semibold">
                {lang === 'hi' ? 'नीचे ग्रिड से इस सत्र के लिए कुण्ड चुनें' : 'Pick a Kund below for this session'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Action: Apply Kund to all sessions if 2 or more sessions exist */}
            {safeSessions.length > 1 && currentChosenForActiveSession && (
              <button
                type="button"
                onClick={handleApplyToAllSessions}
                className="min-h-[36px] px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-semibold border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Use this Kund for all selected sessions"
              >
                <Copy className="w-3 h-3 text-amber-700" />
                <span>{lang === 'hi' ? `कुण्ड ${currentChosenForActiveSession} सभी में लागू करें` : `Apply Kund ${currentChosenForActiveSession} to All`}</span>
              </button>
            )}

            {/* Quick Kund Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={2151}
                value={searchKundText}
                onChange={(e) => {
                  setSearchKundText(e.target.value);
                  setSearchError(null);
                }}
                placeholder={lang === 'hi' ? 'कुण्ड संख्या...' : 'Kund no...'}
                className="min-h-[36px] w-28 sm:w-32 px-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="min-h-[36px] px-3 rounded-xl bg-stone-900 text-amber-300 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'खोजें' : 'Go'}
              </button>
            </form>
          </div>
        </div>

        {/* Notification / Error feedback */}
        {copySuccessMessage && (
          <div className="px-5 py-2 bg-emerald-50 text-emerald-900 text-xs font-medium border-b border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copySuccessMessage}</span>
          </div>
        )}

        {searchError && (
          <div className="px-5 py-2 bg-rose-50 text-rose-800 text-xs font-medium border-b border-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Modal Body: Zones, Sectors, and Kund Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Zone Selector Horizontal Ribbon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                {lang === 'hi' ? '1. मण्डलीय जोन चुनें:' : '1. Select Sacred Zone:'}
              </label>
              {isLoadingOccupancy && (
                <span className="text-[11px] text-amber-700 flex items-center gap-1 animate-pulse font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{lang === 'hi' ? 'सत्र उपलब्धता लोड हो रही है...' : 'Loading session availability...'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {ZONES.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setSelectedSectorId(zone.sectors[0].id);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer text-left ${
                      isSelected
                        ? 'bg-stone-900 text-amber-300 border-stone-950 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-bold">{zone.shortName}</div>
                    <div className="text-[10px] opacity-75">{zone.startKund}–{zone.endKund}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sector Tabs (A, B, C, D) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {lang === 'hi' ? '2. सेक्टर चुनें:' : '2. Select Sector:'}
              </label>
              <span className="text-xs font-serif font-bold text-stone-800">
                {lang === 'hi' ? currentZone.nameHi : currentZone.name}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {currentZone.sectors.map((sec) => {
                const isSelected = sec.id === selectedSectorId;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectorId(sec.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs font-bold'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{lang === 'hi' ? sec.nameHi : sec.name}</span>
                    <span className="ml-1.5 font-mono text-[10px] opacity-80">
                      ({sec.startKund}–{sec.endKund})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bus Seat Kund Grid with Sacred Havan Kund Line Diagram */}
          <div className="bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-600 mb-3 pb-2 border-b border-stone-200 gap-2">
              <div className="font-semibold flex items-center gap-2">
                <span>{lang === 'hi' ? '3. उपलब्ध कुण्ड पर क्लिक करें:' : '3. Tap any available Kund below:'}</span>
                <span className="text-[11px] text-stone-500 font-normal">
                  ({currentSessionObj.dayLabel} · {currentSessionObj.session})
                </span>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-2.5 text-[10px] font-medium flex-wrap">
                <span className="flex items-center gap-1 text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span>Available (0 occ)</span>
                </span>
                <span className="flex items-center gap-1 text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span>Partial (1–7 occ)</span>
                </span>
                <span className="flex items-center gap-1 text-rose-950 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
                  <span>No Vacancy (8 occ)</span>
                </span>
                <span className="flex items-center gap-1 text-purple-950 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                  <span>Blocked</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {kundsInSector.map((kNum) => {
                const isSelected = currentChosenForActiveSession === kNum;
                const kundInfo = occupancyData[kNum];
                const isBlocked = Boolean(kundInfo?.isBlocked);
                // Use the "occupied" field from GET /api/admin/occupancy (with fallback to occupiedSeats)
                const occupied = typeof kundInfo?.occupied === 'number' ? kundInfo.occupied : (kundInfo?.occupiedSeats || 0);
                const remainingSeats = Math.max(0, 8 - occupied);
                const cannotFitFamily = !isBlocked && (occupied + familySize > 8);
                const isFull = !isBlocked && (occupied >= 8 || cannotFitFamily);
                const isPartial = !isBlocked && occupied >= 1 && occupied <= 7;
                const isEmpty = !isBlocked && occupied === 0;

                let kundStatus: 'empty' | 'partial' | 'full' | 'blocked' | 'selected' = 'empty';
                if (isBlocked) {
                  kundStatus = 'blocked';
                } else if (isSelected) {
                  kundStatus = 'selected';
                } else if (isFull) {
                  kundStatus = 'full';
                } else if (isPartial) {
                  kundStatus = 'partial';
                }

                let seatClasses = '';
                if (isBlocked) {
                  seatClasses = 'bg-purple-50 text-purple-950 border-purple-300 opacity-70 cursor-not-allowed';
                } else if (isSelected) {
                  seatClasses = 'bg-stone-900 text-amber-300 border-stone-950 ring-2 ring-amber-400 ring-offset-2 scale-105 shadow-md font-bold cursor-pointer';
                } else if (isFull) {
                  seatClasses = 'bg-rose-50 text-rose-950 border-rose-300 opacity-70 cursor-not-allowed';
                } else if (isPartial) {
                  seatClasses = 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 hover:border-amber-400 cursor-pointer';
                } else {
                  // Completely available (0 occupied): light/green
                  seatClasses = 'bg-emerald-50/70 text-emerald-950 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400 cursor-pointer';
                }

                return (
                  <button
                    key={kNum}
                    type="button"
                    disabled={isBlocked || isFull}
                    onClick={() => handleSelectKund(kNum)}
                    className={`min-h-[66px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${seatClasses}`}
                    title={`Kund ${kNum}: ${
                      isBlocked
                        ? 'Blocked'
                        : isSelected
                        ? 'Selected for this session'
                        : occupied >= 8
                        ? 'No vacancy (8/8 occupied)'
                        : cannotFitFamily
                        ? `Cannot fit family of ${familySize} (${occupied}/8 occupied, ${remainingSeats} left)`
                        : isPartial
                        ? `Partially available (${occupied}/8 occupied, ${remainingSeats} left)`
                        : 'Completely available (0 occupied, 8 left)'
                    }`}
                  >
                    {/* Traditional Havan Kund line diagram */}
                    <div className="mb-0.5">
                      <HavanKundIcon status={kundStatus} size={22} />
                    </div>

                    <span className="font-mono text-xs sm:text-sm font-extrabold tabular-nums leading-tight">
                      {kNum}
                    </span>

                    <div className="mt-0.5 w-full flex justify-center">
                      {isBlocked ? (
                        <span className="text-[9px] font-semibold text-purple-900 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Blocked</span>
                        </span>
                      ) : isSelected ? (
                        <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Selected</span>
                        </span>
                      ) : occupied >= 8 ? (
                        <span className="text-[9px] text-rose-900 font-bold">No vacancy</span>
                      ) : cannotFitFamily ? (
                        <span className="text-[9px] text-rose-900 font-medium">{remainingSeats} left (need {familySize})</span>
                      ) : isPartial ? (
                        <span className="text-[9px] text-amber-950 font-bold bg-amber-200/90 px-1 py-0.2 rounded-sm border border-amber-400">
                          {remainingSeats} left
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-900 font-medium">0/8</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 text-center sm:text-left">
            {isAllAllocated ? (
              <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'hi'
                    ? `सभी ${safeSessions.length} सत्रों के लिए कुण्ड सफलतापूर्वक निर्धारित हैं।`
                    : `All ${safeSessions.length} sessions have chosen Kunds.`}
                </span>
              </span>
            ) : (
              <span className="text-amber-900 font-medium">
                {lang === 'hi'
                  ? `${safeSessions.length - allocatedCount} सत्रों के लिए कुण्ड चुनना शेष है।`
                  : `${safeSessions.length - allocatedCount} session(s) pending selection.`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={allocatedCount === 0}
              className="min-h-[44px] flex-1 sm:flex-initial px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {lang === 'hi'
                  ? `कुण्ड चयन सहेजें (${allocatedCount}/${safeSessions.length})`
                  : `Save Allocations (${allocatedCount}/${safeSessions.length})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
