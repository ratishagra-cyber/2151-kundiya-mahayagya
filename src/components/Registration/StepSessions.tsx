import React from 'react';
import { Calendar, Sun, Sunset, Copy, Sparkles, Check, AlertCircle, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { Participant, SessionType } from '../../types';
import { EVENT_DAYS } from '../../data/eventConfig';

interface StepSessionsProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onNext: () => void;
  onPrev: () => void;
  lang: 'en' | 'hi';
}

export const StepSessions: React.FC<StepSessionsProps> = ({
  participants,
  setParticipants,
  onNext,
  onPrev,
  lang,
}) => {
  const [activeParticipantIndex, setActiveParticipantIndex] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const activeParticipant = participants[activeParticipantIndex] || participants[0];

  // Helper to toggle specific session
  const toggleSession = (date: string, session: SessionType) => {
    setParticipants((prev) =>
      prev.map((p, idx) => {
        if (idx !== activeParticipantIndex) return p;

        const updatedSchedule = p.schedule.map((day) => {
          if (day.date === date) {
            return {
              ...day,
              [session]: !day[session],
            };
          }
          return day;
        });

        return { ...p, schedule: updatedSchedule };
      })
    );
    setErrorMessage(null);
  };

  // Proper toggle button for whole day
  const toggleWholeDay = (date: string) => {
    setParticipants((prev) =>
      prev.map((p, idx) => {
        if (idx !== activeParticipantIndex) return p;

        const dayItem = p.schedule.find((d) => d.date === date);
        const bothActive = dayItem?.morning && dayItem?.afternoon;

        const updatedSchedule = p.schedule.map((day) => {
          if (day.date === date) {
            return {
              ...day,
              morning: !bothActive,
              afternoon: !bothActive,
            };
          }
          return day;
        });

        return { ...p, schedule: updatedSchedule };
      })
    );
    setErrorMessage(null);
  };

  // Presets
  const applyAllDaysBoth = () => {
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        schedule: EVENT_DAYS.map((d) => ({
          date: d.date,
          dayLabel: d.shortLabel,
          morning: true,
          afternoon: true,
        })),
      }))
    );
  };

  const applyAllDaysMorning = () => {
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        schedule: EVENT_DAYS.map((d) => ({
          date: d.date,
          dayLabel: d.shortLabel,
          morning: true,
          afternoon: false,
        })),
      }))
    );
  };

  const applyWeekendOnly = () => {
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        schedule: EVENT_DAYS.map((d) => {
          const isWeekend = d.date === '2026-12-19' || d.date === '2026-12-20';
          return {
            date: d.date,
            dayLabel: d.shortLabel,
            morning: isWeekend,
            afternoon: isWeekend,
          };
        }),
      }))
    );
  };

  const copyCoordinatorScheduleToAll = () => {
    const coordinatorSchedule = participants[0]?.schedule;
    if (!coordinatorSchedule) return;

    setParticipants((prev) =>
      prev.map((p, idx) => {
        if (idx === 0) return p;
        return {
          ...p,
          schedule: JSON.parse(JSON.stringify(coordinatorSchedule)),
        };
      })
    );
  };

  const totalSelectedSessions = participants.reduce((total, p) => {
    return (
      total +
      p.schedule.reduce(
        (dayTotal, d) => dayTotal + (d.morning ? 1 : 0) + (d.afternoon ? 1 : 0),
        0
      )
    );
  }, 0);

  const handleNext = () => {
    if (totalSelectedSessions === 0) {
      setErrorMessage(
        lang === 'hi'
          ? 'कम से कम एक सत्र (प्रातः अथवा दोपहर) का चयन करना अनिवार्य है।'
          : 'Please select at least one session for at least one member.'
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
          <span>{lang === 'hi' ? '8-दिवसीय सत्र कैलेंडर' : '8-Day Session Calendar'}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              {lang === 'hi' ? 'आहुति सत्र एवं तिथियां चुनें' : 'Select Dates & Daily Sessions'}
            </h2>
            <p className="text-xs text-stone-600">
              {lang === 'hi'
                ? 'प्रातः 8-11 अथवा दोपहर 1-4 बजे। सदस्य स्वतंत्र रूप से दिन चुन सकते हैं।'
                : 'Morning 8–11 AM or Afternoon 1–4 PM across 14–21 Dec.'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 tabular-nums shrink-0">
            {totalSelectedSessions} {lang === 'hi' ? 'सत्र' : 'Sessions'}
          </span>
        </div>
      </div>

      {/* 1-Tap Quick Action Presets (Mobile Ergonomic) */}
      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800">
          <span className="flex items-center gap-1.5 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'hi' ? '1-टैप त्वरित चयन (सभी सदस्यों पर लागू)' : '1-Tap Quick Batch Presets (Apply to All)'}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-0.5">
          <button
            type="button"
            onClick={applyAllDaysBoth}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'पूर्ण 8 दिन (दोनों सत्र)' : 'All 8 Days (Both Sessions)'}
          </button>
          
          <button
            type="button"
            onClick={applyAllDaysMorning}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'सभी 8 दिन प्रातः (8–11 AM)' : 'All 8 Days Morning (8–11 AM)'}
          </button>

          <button
            type="button"
            onClick={applyWeekendOnly}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 shadow-2xs transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'सप्ताहांत (19–20 Dec)' : 'Weekend Only (19–20 Dec)'}
          </button>

          {participants.length > 1 && (
            <button
              type="button"
              onClick={copyCoordinatorScheduleToAll}
              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3 text-amber-700" />
              <span>{lang === 'hi' ? 'समन्वयक का शेड्यूल कॉपी करें' : "Copy Coordinator's Schedule"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Participant Selector Tabs (Clean Mobile Scroller without scrollbars) */}
      <div>
        <label className="block text-xs font-bold text-stone-700 mb-1.5">
          {lang === 'hi' ? 'सदस्य का शेड्यूल बदलें:' : 'Active Devotee Schedule:'}
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {participants.map((p, idx) => {
            const isSelected = idx === activeParticipantIndex;
            const memberSessionCount = p.schedule.reduce(
              (cnt, d) => cnt + (d.morning ? 1 : 0) + (d.afternoon ? 1 : 0),
              0
            );

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveParticipantIndex(idx)}
                className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-rose-900 text-amber-100 border-rose-950 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="max-w-[110px] truncate">{p.name || `Member #${idx + 1}`}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 font-mono">
                  {memberSessionCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8-Day Calendar Cards */}
      <div className="space-y-3">
        {EVENT_DAYS.map((day) => {
          const scheduleItem = activeParticipant.schedule.find((s) => s.date === day.date) || {
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
                
                {/* Day Header & Proper Button/Chip for Whole Day */}
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-stone-900">{day.label}</div>
                    <div className="text-[11px] text-amber-900/80 font-medium">{day.tithi}</div>
                  </div>

                  {/* PROPER BUTTON / CHIP FOR SELECT BOTH (Replacing small text link) */}
                  <button
                    type="button"
                    onClick={() => toggleWholeDay(day.date)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isFullDay
                        ? 'bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isFullDay ? '✓ Both' : '+ Both Sessions'}
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
