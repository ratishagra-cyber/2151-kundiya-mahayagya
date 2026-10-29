import React from 'react';
import { 
  Users, 
  Flame, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Phone, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { SectorConfig, ZoneConfig } from '../../data/zoneConfig';
import { HavanKundIcon } from '../Common/HavanKundIcon';

export interface KundDetailInfo {
  kundNumber: number;
  occupiedSeats: number;
  isBlocked: boolean;
  blockedReason?: string;
  families: Array<{
    bookingCode: string;
    yagyakartaName: string;
    primaryMobile: string;
    city: string;
    participantCount: number;
  }>;
}

interface KundSeatGridProps {
  zone: ZoneConfig;
  sector: SectorConfig;
  kundDetailsMap: Record<number, KundDetailInfo>;
  onSelectBooking?: (bookingCode: string) => void;
  date?: string;
  session?: string;
  onBlockToggled?: () => void;
  lang?: 'en' | 'hi';
}

export const KundSeatGrid: React.FC<KundSeatGridProps> = ({
  zone,
  sector,
  kundDetailsMap,
  onSelectBooking,
  date = '2026-12-14',
  session = 'morning',
  onBlockToggled,
  lang = 'hi',
}) => {
  const [activeKundNumber, setActiveKundNumber] = React.useState<number | null>(null);
  const [blockReasonInput, setBlockReasonInput] = React.useState<string>('VIP / Reserved');
  const [isBlockingLoading, setIsBlockingLoading] = React.useState<boolean>(false);
  const [blockActionMessage, setBlockActionMessage] = React.useState<string | null>(null);

  // Generate all kund numbers in this sector range [startKund..endKund]
  const kundNumbers = React.useMemo(() => {
    const list: number[] = [];
    for (let k = sector.startKund; k <= sector.endKund; k++) {
      list.push(k);
    }
    return list;
  }, [sector.startKund, sector.endKund]);

  const activeKundInfo: KundDetailInfo | null = activeKundNumber
    ? kundDetailsMap[activeKundNumber] || {
        kundNumber: activeKundNumber,
        occupiedSeats: 0,
        isBlocked: false,
        families: [],
      }
    : null;

  // Handle Administrative Block / Unblock action
  const handleToggleBlock = async (action: 'block' | 'unblock') => {
    if (!activeKundNumber) return;
    setIsBlockingLoading(true);
    setBlockActionMessage(null);

    try {
      const res = await fetch('/api/admin/block-kund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          kundNumber: activeKundNumber,
          date,
          session,
          reason: blockReasonInput.trim() || 'VIP / Reserved by Admin',
          blockedBy: 'Admin Operator',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setBlockActionMessage(
          action === 'block'
            ? (lang === 'hi' ? `कुण्ड ${activeKundNumber} सफलतापूर्वक ब्लॉक कर दिया गया।` : `Kund ${activeKundNumber} blocked successfully.`)
            : (lang === 'hi' ? `कुण्ड ${activeKundNumber} अनब्लॉक कर दिया गया।` : `Kund ${activeKundNumber} unblocked successfully.`)
        );
        if (onBlockToggled) {
          onBlockToggled();
        }
      } else {
        setBlockActionMessage(data?.error || 'Failed to toggle block status.');
      }
    } catch (err: any) {
      setBlockActionMessage(err?.message || 'Network error updating block status.');
    } finally {
      setIsBlockingLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sector Header & Legend (Plain numbers, no #) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm">
              {lang === 'hi' ? sector.nameHi : sector.name}
            </span>
            <span className="text-xs font-mono text-stone-600 bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
              {lang === 'hi' ? 'कुण्ड' : 'Kund'} {sector.startKund} – {sector.endKund} ({sector.totalKunds} {lang === 'hi' ? 'कुण्ड' : 'kunds'})
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {lang === 'hi' 
              ? 'पारंपरिक हवन कुण्ड ग्रिड: किसी भी कुण्ड पर क्लिक करके बैठे परिवारों का विवरण अथवा ब्लॉक नियंत्रण देखें।' 
              : 'Sacred Havan Kund grid: tap any kund to view seated devotees or manage operator block.'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="font-semibold">{lang === 'hi' ? 'रिक्त (0/8)' : 'Empty (0/8)'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="font-semibold">{lang === 'hi' ? 'आंशिक (1-7/8)' : 'Partial (1-7/8)'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-900">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
            <span className="font-semibold">{lang === 'hi' ? 'पूर्ण (8/8)' : 'Full (8/8)'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-50 border border-purple-300 text-purple-900">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
            <span className="font-semibold">{lang === 'hi' ? 'ब्लॉक' : 'Blocked'}</span>
          </div>
        </div>
      </div>

      {/* Traditional Havan Kund Grid Layout */}
      <div className="bg-stone-100/70 p-3 sm:p-5 rounded-3xl border border-stone-200/90 shadow-inner">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {kundNumbers.map((kNum) => {
            const info = kundDetailsMap[kNum];
            const isBlocked = Boolean(info?.isBlocked);
            const occupiedSeats = info?.occupiedSeats || 0;
            const isFull = !isBlocked && occupiedSeats >= 8;
            const isPartial = !isBlocked && occupiedSeats > 0 && occupiedSeats < 8;
            const isEmpty = !isBlocked && occupiedSeats === 0;
            const isSelected = activeKundNumber === kNum;

            let status: 'empty' | 'partial' | 'full' | 'blocked' = 'empty';
            let seatClasses = '';

            if (isBlocked) {
              status = 'blocked';
              seatClasses = 'bg-purple-100/90 text-purple-950 border-purple-300 hover:bg-purple-200';
            } else if (isFull) {
              status = 'full';
              seatClasses = 'bg-rose-100/90 text-rose-950 border-rose-300 hover:bg-rose-200';
            } else if (isPartial) {
              status = 'partial';
              seatClasses = 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200';
            } else {
              status = 'empty';
              seatClasses = 'bg-white text-stone-700 border-emerald-300 hover:bg-emerald-50/80 hover:border-emerald-400';
            }

            return (
              <button
                key={kNum}
                type="button"
                onClick={() => {
                  setActiveKundNumber(isSelected ? null : kNum);
                  setBlockActionMessage(null);
                }}
                className={`relative group flex flex-col items-center justify-between p-2 rounded-2xl border text-center transition-all cursor-pointer min-h-[64px] ${seatClasses} ${
                  isSelected ? 'ring-2 ring-stone-900 ring-offset-2 scale-105 shadow-md z-10' : 'hover:scale-[1.02]'
                }`}
                title={`Kund ${kNum}: ${
                  isBlocked ? 'Blocked' : isFull ? 'Full (8/8)' : isPartial ? `Partial (${occupiedSeats}/8)` : 'Empty (0/8)'
                }`}
              >
                {/* Traditional Havan Kund line diagram */}
                <div className="w-full flex items-center justify-center my-0.5">
                  <HavanKundIcon
                    status={status}
                    size={24}
                    showFlame={!isEmpty}
                  />
                </div>

                {/* Kund Number (Plain digits, no #) */}
                <div className="font-mono font-extrabold text-xs sm:text-sm tabular-nums leading-tight">
                  {kNum}
                </div>

                {/* Capacity badge pill */}
                <div className="mt-1 w-full flex justify-center">
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-semibold ${
                    isBlocked 
                      ? 'bg-purple-200/80 text-purple-900' 
                      : isFull 
                      ? 'bg-rose-200/80 text-rose-900' 
                      : isPartial 
                      ? 'bg-amber-200/80 text-amber-950 font-bold' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isBlocked ? 'BLOCKED' : `${occupiedSeats}/8`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide-in / Expanded Kund Details & Block Control Panel */}
      {activeKundInfo && (
        <div className="mt-4 p-4 sm:p-6 bg-white rounded-3xl border-2 border-stone-900 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-400 text-stone-950 flex flex-col items-center justify-center">
                <HavanKundIcon status={activeKundInfo.isBlocked ? 'blocked' : activeKundInfo.occupiedSeats > 0 ? 'partial' : 'empty'} size={28} />
                <span className="text-[10px] font-mono font-extrabold">{activeKundInfo.kundNumber}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                    {lang === 'hi' ? 'कुण्ड' : 'Kund'} {activeKundInfo.kundNumber}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeKundInfo.isBlocked
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : activeKundInfo.occupiedSeats >= 8
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : activeKundInfo.occupiedSeats > 0
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {activeKundInfo.isBlocked
                      ? (lang === 'hi' ? 'आरक्षित / ब्लॉक' : 'Blocked / Reserved')
                      : activeKundInfo.occupiedSeats >= 8
                      ? (lang === 'hi' ? 'पूर्ण (8/8)' : 'Full (8/8)')
                      : activeKundInfo.occupiedSeats > 0
                      ? (lang === 'hi' ? `आंशिक (${activeKundInfo.occupiedSeats}/8)` : `Partial (${activeKundInfo.occupiedSeats}/8)`)
                      : (lang === 'hi' ? 'पूर्णतः रिक्त (0/8)' : 'Vacant (0/8)')}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {lang === 'hi' ? zone.nameHi : zone.name} · {lang === 'hi' ? sector.nameHi : sector.name}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveKundNumber(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ADMIN KUND BLOCKING CONTROL (Requirement 3) */}
          <div className="my-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'hi' ? 'ऑपरेटर ब्लॉक / अनब्लॉक नियंत्रण' : 'Operator Kund Block Control'}</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {lang === 'hi'
                    ? 'ब्लॉक किए गए कुण्ड सार्वजनिक आवंटन में उपलब्ध नहीं होंगे और kund_blocks तालिका में सुरक्षित रहेंगे।'
                    : 'Blocked kunds are locked from public allocation for this session and stored in kund_blocks.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeKundInfo.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => handleToggleBlock('unblock')}
                    disabled={isBlockingLoading}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isBlockingLoading ? 'Updating...' : (lang === 'hi' ? 'कुण्ड अनब्लॉक करें' : 'Unblock Kund')}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={blockReasonInput}
                      onChange={(e) => setBlockReasonInput(e.target.value)}
                      placeholder="Reason (e.g. VIP reserve)"
                      className="min-h-[38px] px-3 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 placeholder:text-stone-400 w-36 sm:w-44 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleBlock('block')}
                      disabled={isBlockingLoading}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isBlockingLoading ? 'Updating...' : (lang === 'hi' ? 'कुण्ड ब्लॉक करें' : 'Block Kund')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {blockActionMessage && (
              <div className="mt-2.5 text-xs font-semibold text-purple-900 bg-purple-100/70 p-2 rounded-xl border border-purple-200">
                {blockActionMessage}
              </div>
            )}
          </div>

          {/* Capacity Progress Bar */}
          <div className="py-2 border-b border-stone-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-stone-700">
                {lang === 'hi' ? 'बैठने की कुल क्षमता:' : 'Seating Capacity:'}
              </span>
              <span className="font-mono font-bold text-stone-900">
                {activeKundInfo.occupiedSeats} / 8 {lang === 'hi' ? 'स्थान भरे' : 'devotees seated'} ({8 - activeKundInfo.occupiedSeats} {lang === 'hi' ? 'शेष' : 'remaining'})
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div 
                className={`h-full transition-all duration-300 ${
                  activeKundInfo.isBlocked 
                    ? 'bg-purple-600' 
                    : activeKundInfo.occupiedSeats >= 8 
                    ? 'bg-rose-600' 
                    : activeKundInfo.occupiedSeats > 0 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (activeKundInfo.occupiedSeats / 8) * 100)}%` }}
              />
            </div>
          </div>

          {/* Blocked alert reason */}
          {activeKundInfo.isBlocked && (
            <div className="my-3 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold">{lang === 'hi' ? 'ब्लॉक कारण: ' : 'Blocked Reason: '}</span>
                <span>{activeKundInfo.blockedReason || 'VIP / Offline booking reserve'}</span>
              </div>
            </div>
          )}

          {/* Seated Families List */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-600" />
                <span>
                  {lang === 'hi' ? 'इस कुण्ड पर आवंटित परिवार' : 'Families Allocated to this Kund'}
                </span>
                <span className="text-stone-400 font-normal">
                  ({activeKundInfo.families?.length || 0})
                </span>
              </h4>
            </div>

            {(!activeKundInfo.families || activeKundInfo.families.length === 0) ? (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">
                    {lang === 'hi' ? 'यह कुण्ड वर्तमान में रिक्त है' : 'This Kund is Currently Vacant'}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {lang === 'hi'
                      ? 'इस सत्र में पूरे 8 श्रद्धालुओं के लिए स्थान उपलब्ध है।'
                      : 'All 8 seating slots are open for devotee assignment.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeKundInfo.families.map((fam, idx) => (
                  <div
                    key={`${fam.bookingCode}-${idx}`}
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-100/80 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">
                          {fam.yagyakartaName || 'Yagyakarta'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-mono font-bold">
                          {fam.bookingCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                        {fam.primaryMobile && (
                          <a
                            href={`tel:${fam.primaryMobile}`}
                            className="inline-flex items-center gap-1 text-stone-700 hover:text-amber-700"
                          >
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span className="font-mono">+91 {fam.primaryMobile}</span>
                          </a>
                        )}
                        {fam.city && (
                          <span className="inline-flex items-center gap-1 text-stone-500">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{fam.city}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-amber-900 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <Users className="w-3 h-3 text-amber-700" />
                          <span>{fam.participantCount} {lang === 'hi' ? 'श्रद्धालु' : 'devotees'}</span>
                        </span>
                      </div>
                    </div>

                    {onSelectBooking && (
                      <button
                        type="button"
                        onClick={() => onSelectBooking(fam.bookingCode)}
                        className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-950 font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <span>{lang === 'hi' ? 'विवरण देखें' : 'View Booking'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
