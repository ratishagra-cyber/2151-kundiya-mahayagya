import React from 'react';
import { 
  Search, 
  Ticket, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  UserCheck, 
  Calendar, 
  MapPin, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Booking } from '../types';
import { findBooking } from '../services/storageService';
import { PassCard } from './PassCard';

interface BookingRetrievalProps {
  onBackToHome: () => void;
  lang: 'en' | 'hi';
}

type SearchMode = 'mobile' | 'bookingCode';

export const BookingRetrieval: React.FC<BookingRetrievalProps> = ({
  onBackToHome,
  lang,
}) => {
  const [searchMode, setSearchMode] = React.useState<SearchMode>('mobile');
  const [mobileInput, setMobileInput] = React.useState('');
  const [bookingCodeInput, setBookingCodeInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Result state
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);
  const [allMatchedBookings, setAllMatchedBookings] = React.useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Quick lookup test suggestions for devotees (including live database records)
  const demoLookups = [
    { label: 'Ashok Kumar Sharma', mobile: '9876543210', code: 'MY-2026-TEST2045' },
    { label: 'Harendra Singh', mobile: '9568006060', code: 'MY-2026-8370' },
    { label: 'Pandit Rameshwar Sharma', mobile: '9152791405', code: 'MY-2026-6940' },
  ];

  const handleSearch = async (e?: React.FormEvent, directValue?: string, directMode?: SearchMode) => {
    if (e) e.preventDefault();

    const mode = directMode || searchMode;
    const value = (directValue !== undefined ? directValue : mode === 'mobile' ? mobileInput : bookingCodeInput).trim();

    if (!value) {
      setErrorMessage(
        mode === 'mobile'
          ? (lang === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter your 10-digit mobile number.')
          : (lang === 'hi' ? 'कृपया अपना बुकिंग कोड दर्ज करें।' : 'Please enter your booking code.')
      );
      return;
    }

    if (mode === 'mobile') {
      const cleanDigits = value.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setErrorMessage(
          lang === 'hi'
            ? 'कृपया पूरा 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
            : 'Please enter a valid 10-digit mobile number.'
        );
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);
    setActiveBooking(null);
    setAllMatchedBookings([]);

    try {
      // 1. Call public GET /api/retrieve?mobile=<number> or ?bookingCode=<code>
      const url = mode === 'mobile'
        ? `/api/retrieve?mobile=${encodeURIComponent(value.replace(/\D/g, '').slice(-10))}`
        : `/api/retrieve?bookingCode=${encodeURIComponent(value)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.success && data.booking) {
        const bookingsList: Booking[] = Array.isArray(data.bookings) && data.bookings.length > 0
          ? data.bookings.map((b: any) => ({
              id: b.bookingCode || b.id,
              createdAt: b.createdAt || new Date().toISOString(),
              yagyakarta: b.yagyakarta,
              participants: b.participants,
              allocations: (b.allocations || []).map((a: any) => ({
                ...a,
                kundNumber: Number(a.kundNumber) || 1,
              })),
              status: b.status || 'confirmed',
            }))
          : [
              {
                id: data.booking.bookingCode || data.booking.id,
                createdAt: data.booking.createdAt || new Date().toISOString(),
                yagyakarta: data.booking.yagyakarta,
                participants: data.booking.participants,
                allocations: (data.booking.allocations || []).map((a: any) => ({
                  ...a,
                  kundNumber: Number(a.kundNumber) || 1,
                })),
                status: data.booking.status || 'confirmed',
              },
            ];

        setAllMatchedBookings(bookingsList);
        setActiveBooking(bookingsList[0]);
        return;
      }

      // 2. Client-side storage fallback if API returned 404 (for offline/demo cases)
      const localResult = findBooking(value);
      if (localResult) {
        setActiveBooking(localResult);
        setAllMatchedBookings([localResult]);
        return;
      }

      // If not found in API or local storage
      setErrorMessage(
        data?.error ||
          (lang === 'hi'
            ? `दर्ज किए गए ${mode === 'mobile' ? 'मोबाइल नंबर' : 'बुकिंग कोड'} "${value}" के लिए कोई पंजीकरण नहीं मिला।`
            : `No registration found matching "${value}". Please check your details.`)
      );
    } catch (err: any) {
      // Check local storage on network failure
      const localResult = findBooking(value);
      if (localResult) {
        setActiveBooking(localResult);
        setAllMatchedBookings([localResult]);
      } else {
        setErrorMessage(
          err?.message ||
            (lang === 'hi'
              ? 'प्रवेश पत्र प्राप्त करने में असमर्थ। कृपया नेटवर्क जांचें।'
              : 'Unable to retrieve pass. Please check your internet connection.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = () => {
    setActiveBooking(null);
    setAllMatchedBookings([]);
    setHasSearched(false);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Back to Home Navigation */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-stone-500" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}</span>
        </button>
      </div>

      {/* Main Container */}
      {!activeBooking ? (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <Ticket className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'hi' ? 'प्रवेश पत्र खोजें' : 'Find Your Pass'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              {lang === 'hi' ? 'यज्ञ प्रवेश पत्र एवं कुण्ड विवरण' : 'Retrieve Your Yagya Pravesh Patra'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              {lang === 'hi'
                ? 'अपने पंजीकृत मोबाइल नंबर अथवा बुकिंग कोड से अपना डिजिटल प्रवेश पत्र देखें व डाउनलोड करें।'
                : 'Search with your registered mobile number or booking code to view, download, or share your digital pass.'}
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
            
            {/* 1. Two Search Options: Mobile vs Booking Code */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('mobile');
                  setErrorMessage(null);
                }}
                className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  searchMode === 'mobile'
                    ? 'bg-rose-900 text-amber-50 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'hi' ? 'मोबाइल नंबर द्वारा' : 'By Mobile Number'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchMode('bookingCode');
                  setErrorMessage(null);
                }}
                className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  searchMode === 'bookingCode'
                    ? 'bg-rose-900 text-amber-50 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>{lang === 'hi' ? 'बुकिंग कोड द्वारा' : 'By Booking Code'}</span>
              </button>
            </div>

            {/* 2. Search Form */}
            <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
              {searchMode === 'mobile' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {lang === 'hi' ? 'पंजीकृत मोबाइल नंबर (10 अंक)' : 'Registered Mobile Number (10 digits)'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-mono font-bold text-stone-500 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoFocus
                      value={mobileInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMobileInput(val);
                        setErrorMessage(null);
                      }}
                      placeholder={lang === 'hi' ? '98XXXXXXXX' : 'Enter 10-digit mobile number'}
                      className="w-full min-h-[48px] pl-13 pr-4 rounded-xl border border-stone-300 text-sm font-mono tracking-wider text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-rose-800 bg-stone-50/50"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {lang === 'hi'
                      ? 'यज्ञकर्ता द्वारा पंजीकरण के समय दर्ज किया गया मोबाइल नंबर।'
                      : 'The primary or secondary mobile number entered during registration.'}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {lang === 'hi' ? 'बुकिंग कोड / आईडी' : 'Booking Code / ID'}
                  </label>
                  <div className="relative flex items-center">
                    <Ticket className="w-4 h-4 absolute left-3.5 text-stone-400 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={bookingCodeInput}
                      onChange={(e) => {
                        setBookingCodeInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="MY-2026-XXXX"
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-stone-300 text-sm font-mono uppercase tracking-wider text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:border-rose-800 bg-stone-50/50"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {lang === 'hi'
                      ? 'एसएमएस अथवा पुष्टि स्क्रीन पर प्राप्त 11 अंकों का कोड (उदा. MY-2026-1042)।'
                      : 'The booking code received on confirmation (e.g., MY-2026-1042).'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>{lang === 'hi' ? 'खोज रहे हैं...' : 'Retrieving Pass...'}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>{lang === 'hi' ? 'प्रवेश पत्र खोजें' : 'Find Your Pass'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Error / Not Found Announcement */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-950 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-bold">
                    {lang === 'hi' ? 'कोई प्रवेश पत्र नहीं मिला' : 'No Pass Found'}
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {lang === 'hi' ? 'नया पंजीकरण करें' : 'Register Family Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Test Chips */}
            <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <span className="font-semibold text-stone-700">
                {lang === 'hi' ? 'त्वरित परीक्षण:' : 'Demo test:'}
              </span>
              {demoLookups.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    if (searchMode === 'mobile') {
                      setMobileInput(item.mobile);
                      handleSearch(undefined, item.mobile, 'mobile');
                    } else {
                      setBookingCodeInput(item.code);
                      handleSearch(undefined, item.code, 'bookingCode');
                    }
                  }}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-200 transition-colors text-[11px] font-mono cursor-pointer"
                >
                  {searchMode === 'mobile' ? item.mobile : item.code}
                </button>
              ))}
            </div>

          </div>

        </div>
      ) : (
        /* Result View: Full Digital Pass */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar with New Search Affordance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900">
                  {lang === 'hi' ? 'प्रवेश पत्र सफलतापूर्वक प्राप्त हुआ' : 'Pass Retrieved Successfully'}
                </div>
                <div className="text-xs text-stone-500 font-mono">
                  {activeBooking.id} · {activeBooking.yagyakarta.fullName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetSearch}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'अन्य पास खोजें' : 'Search Another Pass'}</span>
            </button>
          </div>

          {/* Multiple Bookings Found Selector */}
          {allMatchedBookings.length > 1 && (
            <div className="p-4 bg-amber-50/80 rounded-3xl border border-amber-300 space-y-2">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-700" />
                <span>
                  {lang === 'hi'
                    ? `इस मोबाइल नंबर से ${allMatchedBookings.length} पंजीकरण मिले हैं:`
                    : `${allMatchedBookings.length} bookings found for this mobile:`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allMatchedBookings.map((b) => {
                  const isCur = b.id === activeBooking.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBooking(b)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCur
                          ? 'bg-rose-900 text-white border-rose-950 shadow-sm'
                          : 'bg-white hover:bg-amber-100 text-stone-800 border-stone-200'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs flex items-center justify-between">
                        <span>{b.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isCur ? 'bg-amber-400 text-stone-900 font-extrabold' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {b.participants.length} {lang === 'hi' ? 'सदस्य' : 'members'}
                        </span>
                      </div>
                      <div className="text-xs font-medium mt-1 truncate">
                        {b.yagyakarta.fullName} · {b.allocations.map((a) => `Kund ${a.kundNumber}`).join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render Digital Pass with Download / Share / Print */}
          <PassCard
            booking={activeBooking}
            onBackToHome={onBackToHome}
            lang={lang}
          />

        </div>
      )}

    </div>
  );
};
