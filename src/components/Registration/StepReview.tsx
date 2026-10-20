import React from 'react';
import { ShieldCheck, Flame, Users, Calendar, Phone, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, ArrowLeft } from 'lucide-react';
import { Participant, YagyakartaDetails } from '../../types';
import { EVENT_DAYS } from '../../data/eventConfig';

interface StepReviewProps {
  yagyakarta: YagyakartaDetails;
  participants: Participant[];
  onConfirm: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  allocationError: string | null;
  lang: 'en' | 'hi';
}

export const StepReview: React.FC<StepReviewProps> = ({
  yagyakarta,
  participants,
  onConfirm,
  onPrev,
  isSubmitting,
  allocationError,
  lang,
}) => {
  const [showDetailedSchedule, setShowDetailedSchedule] = React.useState(false);

  // Aggregate sessions
  const activeDaysSummary: {
    date: string;
    dayLabel: string;
    morningCount: number;
    afternoonCount: number;
  }[] = [];

  let totalSessionAttendances = 0;

  for (const day of EVENT_DAYS) {
    const morningCount = participants.filter((p) => p.schedule.find((s) => s.date === day.date)?.morning).length;
    const afternoonCount = participants.filter((p) => p.schedule.find((s) => s.date === day.date)?.afternoon).length;

    if (morningCount > 0 || afternoonCount > 0) {
      activeDaysSummary.push({
        date: day.date,
        dayLabel: day.shortLabel,
        morningCount,
        afternoonCount,
      });
      totalSessionAttendances += (morningCount + afternoonCount);
    }
  }

  // Calculate distinct mobiles
  const candidateMobiles: (string | undefined)[] = [
    yagyakarta.primaryMobile,
    yagyakarta.secondaryMobile,
    ...participants.slice(1).map((p) => p.mobile),
  ];
  const uniqueMobiles = Array.from(
    new Set(
      candidateMobiles
        .filter((m): m is string => typeof m === 'string' && m.replace(/\D/g, '').length === 10)
        .map((m) => m.replace(/\D/g, ''))
    )
  );

  return (
    <div className="space-y-5 pb-24 sm:pb-6">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
          <span>{lang === 'hi' ? 'चरण 4 / 4' : 'Step 4 of 4'}</span>
          <span>·</span>
          <span>{lang === 'hi' ? 'समीक्षा एवं पुष्टि' : 'Review & Allocate Kund'}</span>
        </div>
        <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
          {lang === 'hi' ? 'पंजीकरण सारांश की जांच करें' : 'Verify Details Before Allocation'}
        </h2>
        <p className="text-xs text-stone-600">
          {lang === 'hi'
            ? 'पुष्टि करते ही हमारे बेस्ट-फिट इंजन द्वारा आपको तुरंत भौतिक कुंड नंबर आवंटित कर दिया जाएगा।'
            : 'Upon confirmation, our engine assigns your dedicated Kund and generates your E-Pass.'}
        </p>
      </div>

      {/* RETAINED: Family Integrity Guarantee Messaging */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-950">
            {lang === 'hi' ? 'अखंड परिवार गारंटी (Family Integrity Guarantee)' : 'Family Integrity Guarantee (Never Split)'}
          </div>
          <p className="text-stone-700 leading-relaxed text-[11px]">
            {lang === 'hi'
              ? 'परिवार के सभी सदस्य प्रत्येक सत्र में एक ही कुंड पर एक साथ बैठेंगे। किसी भी सदस्य को अलग नहीं किया जाएगा।'
              : 'All attending members of your family will be seated side-by-side at the same Kund. No family members will ever be separated.'}
          </p>
        </div>
      </div>

      {/* Concise Summary Cards (Default Concise View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Card 1: Coordinator */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-2 text-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {lang === 'hi' ? 'मुख्य समन्वयक (यज्ञकर्ता)' : 'Yagyakarta / Coordinator'}
          </div>
          <div className="text-sm font-bold text-stone-900">{yagyakarta.fullName}</div>
          <div className="text-stone-600 font-mono">
            +91 {yagyakarta.primaryMobile}
            {yagyakarta.secondaryMobile ? ` · Alt: +91 ${yagyakarta.secondaryMobile}` : ''}
          </div>
          <div className="text-stone-600">
            {yagyakarta.city}, {yagyakarta.state} {yagyakarta.gotra ? `· Gotra: ${yagyakarta.gotra}` : ''}
          </div>
        </div>

        {/* Card 2: Devotees & Schedule Overview */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-2 text-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {lang === 'hi' ? 'समूह विवरण' : 'Devotees & Attendance'}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 text-sm">
              {participants.length} {lang === 'hi' ? 'साधक सदस्य' : 'Devotee Members'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {participants.length >= 3 ? `${uniqueMobiles.length} Phones Verified` : 'Verified'}
            </span>
          </div>
          <div className="text-stone-600">
            <span>{activeDaysSummary.length} {lang === 'hi' ? 'दिनों में कुल' : 'days total ·'} </span>
            <span className="font-semibold text-stone-900">{totalSessionAttendances} {lang === 'hi' ? 'सत्र आहुति' : 'session attendances'}</span>
          </div>
          <div className="text-[11px] text-stone-500 truncate">
            {participants.map((p) => p.name).join(', ')}
          </div>
        </div>

      </div>

      {/* CONCISE SCHEDULE WITH OPTIONAL EXPAND TOGGLE */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-stone-900 text-xs">
              {lang === 'hi' ? 'सत्र उपस्थिति सारांश' : 'Booked Sessions Matrix'}
            </div>
            <div className="text-[11px] text-stone-500">
              {activeDaysSummary.length} {lang === 'hi' ? 'सक्रिय दिवस चयनित' : 'active days scheduled'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetailedSchedule(!showDetailedSchedule)}
            className="min-h-[44px] px-3 text-xs font-semibold text-rose-900 hover:text-rose-950 flex items-center gap-1 cursor-pointer"
          >
            <span>{showDetailedSchedule ? (lang === 'hi' ? 'संक्षिप्त करें' : 'Hide details') : (lang === 'hi' ? 'विस्तार से देखें' : 'View full breakdown')}</span>
            {showDetailedSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Compact Bar by Default */}
        <div className="flex flex-wrap gap-2">
          {activeDaysSummary.map((d) => (
            <div key={d.date} className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium">
              <span className="font-bold text-stone-900">{d.dayLabel}: </span>
              {d.morningCount > 0 && <span className="text-amber-800">☀️ {d.morningCount}p </span>}
              {d.afternoonCount > 0 && <span className="text-rose-800">🌅 {d.afternoonCount}p</span>}
            </div>
          ))}
        </div>

        {/* Expanded Detailed Matrix */}
        {showDetailedSchedule && (
          <div className="pt-3 border-t border-stone-100 space-y-2 animate-in fade-in duration-150">
            {activeDaysSummary.map((d) => {
              const morningNames = participants
                .filter((p) => p.schedule.find((s) => s.date === d.date)?.morning)
                .map((p) => p.name);
              const afternoonNames = participants
                .filter((p) => p.schedule.find((s) => s.date === d.date)?.afternoon)
                .map((p) => p.name);

              return (
                <div key={d.date} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] space-y-1">
                  <div className="font-bold text-stone-900">{d.date} ({d.dayLabel})</div>
                  {morningNames.length > 0 && (
                    <div className="text-stone-600">
                      <span className="font-semibold text-amber-900">☀️ Morning (8-11 AM):</span> {morningNames.join(', ')}
                    </div>
                  )}
                  {afternoonNames.length > 0 && (
                    <div className="text-stone-600">
                      <span className="font-semibold text-rose-900">🌅 Afternoon (1-4 PM):</span> {afternoonNames.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allocation Error if any */}
      {allocationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed font-semibold">{allocationError}</p>
        </div>
      )}

      {/* Desktop Footer Actions */}
      <div className="hidden sm:flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          ← {lang === 'hi' ? 'वापस जाएं (संशोधन)' : 'Back to Edit'}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="min-h-[48px] px-8 py-3 rounded-2xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-lg shadow-rose-950/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{lang === 'hi' ? 'कुंड आवंटन प्रक्रियाधीन...' : 'Allocating Best-Fit Kund...'}</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300/40" />
              <span>
                {lang === 'hi'
                  ? 'पंजीकरण पूर्ण करें एवं कुंड नंबर प्राप्त करें'
                  : 'Confirm Registration & Receive Kund Pass'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="min-h-[48px] px-4 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 border border-stone-300"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 min-h-[48px] rounded-xl font-bold text-sm bg-rose-900 text-amber-100 shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{lang === 'hi' ? 'आवंटन जारी...' : 'Allocating...'}</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 text-amber-300" />
              <span>{lang === 'hi' ? 'कुंड आवंटित करें' : 'Confirm & Allocate Kund'}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
