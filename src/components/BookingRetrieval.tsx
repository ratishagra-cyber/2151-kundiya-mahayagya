import React from 'react';
import { Search, Ticket, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Booking, SessionType } from '../types';
import { findBooking, cancelSession } from '../services/storageService';
import { PassCard } from './PassCard';

interface BookingRetrievalProps {
  onBackToHome: () => void;
  lang: 'en' | 'hi';
}

export const BookingRetrieval: React.FC<BookingRetrievalProps> = ({
  onBackToHome,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancellingSession, setCancellingSession] = React.useState<{ date: string; session: SessionType } | null>(null);

  // Quick lookup test chips from pre-seeded data
  const demoLookups = [
    { label: 'Pandit Rameshwar Sharma', query: '9829012345', id: 'MY-2026-1042' },
    { label: 'Vikram Singh Chauhan', query: '9412098765', id: 'MY-2026-1043' },
    { label: 'Dr. Anand Kumar Gupta', query: 'MY-2026-2184', id: 'MY-2026-2184' },
  ];

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : searchQuery;
    if (!q.trim()) return;

    setFeedbackMsg(null);
    setHasSearched(true);
    const localResult = findBooking(q);
    if (localResult) {
      setActiveBooking(localResult);
      return;
    }

    // Fallback: Query Neon backend
    try {
      const res = await fetch(`/api/admin/booking-detail?bookingId=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data && data.success && data.booking) {
        const b = data.booking;
        const formattedBooking: Booking = {
          id: b.bookingCode || b.id,
          createdAt: b.createdAt || new Date().toISOString(),
          yagyakarta: b.yagyakarta,
          participants: b.participants,
          allocations: (b.allocations || []).map((a: any) => ({
            ...a,
            kundNumber: Number(a.kundNumber),
          })),
          status: b.status || 'confirmed',
        };
        setActiveBooking(formattedBooking);
      } else {
        setActiveBooking(null);
      }
    } catch {
      setActiveBooking(null);
    }
  };

  const handleCancelSession = (date: string, session: SessionType) => {
    if (!activeBooking) return;
    
    const res = cancelSession(activeBooking.id, date, session);
    if (res.success && res.updatedBooking) {
      setActiveBooking(res.updatedBooking);
      setCancellingSession(null);
      setFeedbackMsg({
        type: 'success',
        text: lang === 'hi'
          ? `सत्र ${date} (${session}) सफलतापूर्वक रद्द कर दिया गया। आपकी सीटें अन्य भक्तों हेतु जारी कर दी गई हैं।`
          : `Session on ${date} (${session}) successfully released. Seats restored to Kund pool.`,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-6 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Ticket className="w-3.5 h-3.5 text-amber-700" />
          <span>{lang === 'hi' ? 'प्रवेश पत्र एवं कुंड खोज' : 'E-Pass & Kund Lookup'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
          {lang === 'hi' ? 'अपना यज्ञ प्रवेश पत्र पुनः प्राप्त करें' : 'Retrieve Booking & View Kund Pass'}
        </h1>
        <p className="text-xs text-stone-600">
          {lang === 'hi'
            ? 'पंजीकरण के समय दर्ज किया गया मोबाइल नंबर अथवा बुकिंग आईडी (उदा. MY-2026-1042) दर्ज करें।'
            : 'Enter the registered mobile number or your booking ID (e.g., MY-2026-1042) to view and print your pass.'}
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-5 mb-6">
        <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'मोबाइल नंबर (10 अंक) या बुकिंग आईडी दर्ज करें...' : 'Enter 10-digit mobile or Booking ID (e.g. MY-2026-1042)...'}
              className="w-full min-h-[48px] pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{lang === 'hi' ? 'प्रवेश पत्र खोजें' : 'Search Pass'}</span>
          </button>
        </form>

        {/* Demo Fast Lookups */}
        <div className="mt-3.5 pt-3.5 border-t border-stone-100 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
          <span className="font-semibold text-stone-700">
            {lang === 'hi' ? 'त्वरित परीक्षण:' : 'Quick Demo Test:'}
          </span>
          {demoLookups.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSearchQuery(item.query);
                handleSearch(undefined, item.query);
              }}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 transition-colors text-[11px] cursor-pointer"
            >
              {item.label} ({item.id})
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          )}
          <p className="font-medium">{feedbackMsg.text}</p>
        </div>
      )}

      {/* Results View */}
      {activeBooking ? (
        <div className="space-y-6">
          
          {/* Quick Header */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-stone-900">{activeBooking.yagyakarta.fullName}</span>
              <span className="text-stone-500 ml-2">({activeBooking.participants.length} members)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                {activeBooking.status}
              </span>
            </div>
          </div>

          {/* Render Full Printable E-Pass */}
          <PassCard
            booking={activeBooking}
            onBackToHome={onBackToHome}
            lang={lang}
          />

          {/* Manage / Release Specific Session (Partial Cancellation) */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  {lang === 'hi' ? 'सत्र संशोधन अथवा आंशिक निरस्तीकरण' : 'Session Modification & Cancellation'}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'hi'
                    ? 'यदि किसी कारणवश आप किसी सत्र में उपस्थित नहीं हो पा रहे हैं, तो सीटें निरस्त कर सकते हैं।'
                    : 'If unable to attend a specific session, release it to free seats for other devotees.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {activeBooking.allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900">{alloc.date}</span>
                    <span className="text-stone-500 ml-2">
                      ({alloc.session === 'morning' ? 'Morning 8-11 AM' : 'Afternoon 1-4 PM'})
                    </span>
                    <span className="ml-2 font-mono font-semibold text-rose-900">
                      {lang === 'hi' ? 'कुण्ड ' : 'Kund '}{alloc.kundNumber} {alloc.zone ? `(${alloc.zone})` : ''}
                    </span>
                  </div>

                  {cancellingSession?.date === alloc.date && cancellingSession?.session === alloc.session ? (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-700 font-medium text-[11px]">Confirm release?</span>
                      <button
                        onClick={() => handleCancelSession(alloc.date, alloc.session)}
                        className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-bold text-[11px] hover:bg-rose-800 cursor-pointer"
                      >
                        Yes, Release Seats
                      </button>
                      <button
                        onClick={() => setCancellingSession(null)}
                        className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCancellingSession({ date: alloc.date, session: alloc.session })}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'यह सत्र निरस्त करें' : 'Release this session'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : hasSearched ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">
            {lang === 'hi' ? 'कोई पंजीकरण नहीं मिला' : 'No Booking Found'}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            {lang === 'hi'
              ? `"${searchQuery}" से मेल खाता कोई रिकॉर्ड नहीं मिला। कृपया 10 अंकों का मान्य मोबाइल नंबर जांचें।`
              : `No record matching "${searchQuery}". Please verify your 10-digit mobile number.`}
          </p>
        </div>
      ) : null}

    </div>
  );
};
