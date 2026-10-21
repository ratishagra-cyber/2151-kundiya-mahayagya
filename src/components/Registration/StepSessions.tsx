import React from 'react';
import { Calendar, Sun, Sunset, Sparkles, Check, AlertCircle, Users, ArrowLeft, ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { Participant, DaySchedule, SessionType } from '../../types';
import { EVENT_DAYS } from '../../data/eventConfig';

interface StepSessionsProps {
  familySchedule: DaySchedule[];
  setFamilySchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
  participants: Participant[];
  onNext: () => void;
  onPrev: () => void;
  lang: 'en' | 'hi';
}

export const StepSessions: React.FC<StepSessionsProps> = ({
  familySchedule,
  setFamilySchedule,
  participants,
  onNext,
  onPrev,
  lang,
}) => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Toggle single session for the entire family
  const toggleSession = (date: string, session: SessionType) => {
    setFamilySchedule((prev) =>
      prev.map((day) => {
        if (day.date === date) {
          return {
            ...day,
            [session]: !day[session],
          };
        }
        return day;
      })
    );
    setErrorMessage(null);
  };

  // Toggle both morning and afternoon for a given date
  const toggleWholeDay = (date: string) => {
    setFamilySchedule((prev) =>
      prev.map((day) => {
        if (day.date === date) {
          const bothActive = day.morning && day.afternoon;
          return {
            ...day,
            morning: !bothActive,
            afternoon: !bothActive,
          };
        }
        return day;
      })
    );
    setErrorMessage(null);
  };

  // Presets for the entire family
  const applyAllDaysBoth = () => {
    setFamilySchedule(
      EVENT_DAYS.map((d) => ({
        date: d.date,
        dayLabel: d.shortLabel,
        morning: true,
        afternoon: true,
      }))
    );
    setErrorMessage(null);
  };

  const applyAllDaysMorning = () => {
    setFamilySchedule(
      EVENT_DAYS.map((d) => ({
        date: d.date,
        dayLabel: d.shortLabel,
        morning: true,
        afternoon: false,
      }))
    );
    setErrorMessage(null);
  };

  const applyWeekendOnly = () => {
    setFamilySchedule(
      EVENT_DAYS.map((d) => {
        const isWeekend = d.date === '2026-12-19' || d.date === '2026-12-20';
        return {
          date: d.date,
          dayLabel: d.shortLabel,
          morning: isWeekend,
          afternoon: isWeekend,
        };
      })
    );
    setErrorMessage(null);
  };

  const clearAllSessions = () => {
    setFamilySchedule(
      EVENT_DAYS.map((d) => ({
        date: d.date,
        dayLabel: d.shortLabel,
        morning: false,
        afternoon: false,
      }))
    );
    setErrorMessage(null);
  };

  // Total session count for the family
  const totalFamilySessions = familySchedule.reduce(
    (total, d) => total + (d.morning ? 1 : 0) + (d.afternoon ? 1 : 0),
    0
  );

  const activeDaysCount = familySchedule.filter((d) => d.morning || d.afternoon).length;

  const handleNext = () => {
    if (totalFamilySessions === 0) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया अपने परिवार के लिए कम से कम एक सत्र (प्रातः अथवा दोपहर) का चयन करें।'
          : 'Please select at least one session for your family.'
      );
      return;
    }
    setErrorMessage(null);
    onNext();
  };

  return (
    <div className="space-y-5 pb-24 sm:pb-6">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
          <span>{lang === 'hi' ? 'चरण 3 / 4' : 'Step 3 of 4'}</span>
          <span>·</span>
          <span>{lang === 'hi' ? 'परिवार सत्र चयन' : 'Family Session Schedule'}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              {lang === 'hi' ? 'परिवार के लिए आहुति सत्र एवं तिथियां चुनें' : 'Select Yagya Dates & Sessions for Your Family'}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {lang === 'hi'
                ? `चयनित सत्र पूरे परिवार (${participants.length} सदस्य) पर एक साथ लागू होंगे। परिवार एक ही कुंड पर बैठेगा।`
                : `Selected sessions apply to all ${participants.length} family members together. You will be seated at the same Kund.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 tabular-nums shrink-0">
              {totalFamilySessions} {lang === 'hi' ? 'सत्र चयनित' : 'Sessions Selected'}
            </span>
          </div>
        </div>
      </div>

      {/* FAMILY REASSURANCE STRIP */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300/80 flex items-start gap-3">
        <Users className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950">
              {lang === 'hi'
                ? `परिवार के सभी ${participants.length} सदस्य एक साथ भाग लेंगे`
                : `All ${participants.length} Family Members Attend Together`}
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              {activeDaysCount} / 8 {lang === 'hi' ? 'दिन सक्रिय' : 'Days Active'}
            </span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            {lang === 'hi'
              ? `साधक: ${participants.map((p) => p.name || 'सदस्य').join(', ')} — प्रत्येक चयनित सत्र में सभी सदस्य एक ही समर्पित कुंड पर बैठेंगे।`
              : `Devotees: ${participants.map((p) => p.name || 'Member').join(', ')} — all members are allocated together at one physical Kund.`}
          </p>
        </div>
      </div>

      {/* 1-Tap Quick Action Presets (Apply to the entire family) */}
      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800">
          <span className="flex items-center gap-1.5 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'hi' ? '1-टैप त्वरित चयन (पूरे परिवार के लिए):' : '1-Tap Quick Presets for the Entire Family:'}</span>
          </span>
          {totalFamilySessions > 0 && (
            <button
              type="button"
              onClick={clearAllSessions}
              className="text-[11px] text-stone-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'hi' ? 'रीसेट करें' : 'Clear All'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-0.5">
          <button
            type="button"
            onClick={applyAllDaysBoth}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'पूर्ण 8 दिन (दोनों सत्र · 16 सत्र)' : 'All 8 Days (Both Sessions · 16 Total)'}
          </button>
          
          <button
            type="button"
            onClick={applyAllDaysMorning}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'सभी 8 दिन प्रातः (8–11 AM · 8 सत्र)' : 'All 8 Days Morning (8–11 AM · 8 Total)'}
          </button>

          <button
            type="button"
            onClick={applyWeekendOnly}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'सप्ताहांत (19–20 Dec · 4 सत्र)' : 'Weekend Only (19–20 Dec · 4 Total)'}
          </button>
        </div>
      </div>

      {/* 8-Day Calendar Cards (Single unified family selection) */}
      <div className="space-y-3">
        {EVENT_DAYS.map((day) => {
          const scheduleItem = familySchedule.find((s) => s.date === day.date) || {
            date: day.date,
            dayLabel: day.shortLabel,
            morning: false,
            afternoon: false,
          };

          const isMorningActive = scheduleItem.morning;
          const isAfternoonActive = scheduleItem.afternoon;
          const isFullDay = isMorningActive && isAfternoonActive;

          return (
            <div
              key={day.date}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                isMorningActive || isAfternoonActive
                  ? 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-400/20'
                  : 'bg-stone-50/80 border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Day Header & Whole Day Chip Button */}
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-stone-900">{day.label}</div>
                    <div className="text-[11px] text-amber-900/80 font-medium">{day.tithi}</div>
                  </div>

                  {/* Whole Day Chip Button */}
                  <button
                    type="button"
                    onClick={() => toggleWholeDay(day.date)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isFullDay
                        ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isFullDay ? (lang === 'hi' ? '✓ दोनों सत्र' : '✓ Both Sessions') : (lang === 'hi' ? '+ दोनों सत्र' : '+ Both Sessions')}
                  </button>
                </div>

                {/* Session Toggles with Comfortable Touch Targets (>= 44px) */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  
                  {/* Morning Session Button */}
                  <button
                    type="button"
                    onClick={() => toggleSession(day.date, 'morning')}
                    className={`min-h-[46px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center sm:justify-start gap-2 border transition-all cursor-pointer ${
                      isMorningActive
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <Sun className={`w-4 h-4 ${isMorningActive ? 'text-stone-950' : 'text-amber-500'}`} />
                    <div className="text-left">
                      <div className="leading-tight font-bold">{lang === 'hi' ? 'प्रातः' : 'Morning'}</div>
                      <div className="text-[10px] opacity-80 font-mono">8:00–11:00 AM</div>
                    </div>
                    {isMorningActive && <Check className="w-3.5 h-3.5 ml-1 shrink-0" />}
                  </button>

                  {/* Afternoon Session Button */}
                  <button
                    type="button"
                    onClick={() => toggleSession(day.date, 'afternoon')}
                    className={`min-h-[46px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center sm:justify-start gap-2 border transition-all cursor-pointer ${
                      isAfternoonActive
                        ? 'bg-rose-800 text-amber-100 border-rose-900 shadow-xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-rose-300'
                    }`}
                  >
                    <Sunset className={`w-4 h-4 ${isAfternoonActive ? 'text-amber-300' : 'text-rose-500'}`} />
                    <div className="text-left">
                      <div className="leading-tight font-bold">{lang === 'hi' ? 'दोपहर' : 'Afternoon'}</div>
                      <div className="text-[10px] opacity-80 font-mono">1:00–4:00 PM</div>
                    </div>
                    {isAfternoonActive && <Check className="w-3.5 h-3.5 ml-1 shrink-0" />}
                  </button>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Desktop Footer Navigation */}
      <div className="hidden sm:flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
        >
          ← {lang === 'hi' ? 'पूर्व चरण' : 'Previous Step'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="min-h-[46px] px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{lang === 'hi' ? 'समीक्षा एवं पुष्टि (चरण 4)' : 'Review & Confirm (Step 4)'}</span>
          <span>→</span>
        </button>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[46px] px-4 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 border border-stone-300"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 min-h-[46px] rounded-xl font-bold text-sm bg-rose-900 text-amber-100 shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <span>{lang === 'hi' ? 'समीक्षा करें (चरण 4)' : 'Next: Review (Step 4)'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
