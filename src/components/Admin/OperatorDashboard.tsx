import React from 'react';
import { 
  Search, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Flame, 
  Users, 
  MapPin, 
  Phone, 
  ExternalLink, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';
import { EVENT_DAYS } from '../../data/eventConfig';
import { SessionType, AdminUser } from '../../types';
import { BookingDetailModal } from './BookingDetailModal';
import { ZoneOverviewGrid, ZoneSummaryItem } from './ZoneOverviewGrid';
import { KundDetailInfo } from './KundSeatGrid';

interface OperatorDashboardProps {
  currentAdmin: AdminUser;
  lang?: 'en' | 'hi';
}

interface AdminBookingRow {
  id: string;
  bookingCode: string;
  yagyakartaName: string;
  primaryMobile: string;
  secondaryMobile?: string;
  city: string;
  address: string;
  state?: string;
  gotra?: string;
  participantCount: number;
  status: string;
  createdAt: string;
}

interface OccupancySummaryData {
  date: string;
  session: string;
  totalKunds: number;
  emptyKunds: number;
  partialKunds: number;
  fullKunds: number;
  blockedKunds: number;
  seatsPerKund: number;
  totalSeatsCapacity: number;
  totalSeatsOccupied: number;
  availableSeats: number;
  occupancyPercentage: number;
  zoneSummaries?: ZoneSummaryItem[];
  kundDetails?: Record<number, KundDetailInfo>;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  currentAdmin,
  lang = 'hi',
}) => {
  // Occupancy filter state
  const [selectedDate, setSelectedDate] = React.useState<string>(EVENT_DAYS[0].date);
  const [selectedSession, setSelectedSession] = React.useState<SessionType>('morning');
  const [occupancy, setOccupancy] = React.useState<OccupancySummaryData | null>(null);
  const [loadingOccupancy, setLoadingOccupancy] = React.useState<boolean>(false);

  // Active view tab: 'zones' (Zone Overview + Bus Seat Kund Grid) vs 'bookings' (Bookings list)
  const [activeTab, setActiveTab] = React.useState<'zones' | 'bookings'>('zones');

  // Bookings list state
  const [bookings, setBookings] = React.useState<AdminBookingRow[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>('');
  const [loadingBookings, setLoadingBookings] = React.useState<boolean>(false);
  const [bookingsError, setBookingsError] = React.useState<string | null>(null);

  // Selected booking for detail modal
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);

  // Debounce search input by 300ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Occupancy Summary & Zone/Kund Data whenever selectedDate or selectedSession changes
  const fetchOccupancy = React.useCallback(async () => {
    setLoadingOccupancy(true);
    try {
      const res = await fetch(`/api/admin/occupancy?date=${selectedDate}&session=${selectedSession}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setOccupancy(data);
      }
    } catch (err) {
      console.warn('Failed to fetch occupancy summary:', err);
    } finally {
      setLoadingOccupancy(false);
    }
  }, [selectedDate, selectedSession]);

  React.useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  // Fetch Bookings list whenever debouncedSearch changes
  const fetchBookings = React.useCallback(async (searchQuery: string) => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const url = searchQuery 
        ? `/api/admin/bookings?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/bookings';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin bookings:', err);
      setBookingsError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBookings(debouncedSearch);
  }, [debouncedSearch, fetchBookings]);

  const handleRefreshAll = () => {
    fetchOccupancy();
    fetchBookings(debouncedSearch);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SIMPLE OCCUPANCY SUMMARY & CONTROLS */}
      <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-5">
        
        {/* Section Header with Date and Session controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                {lang === 'hi' ? 'दैनिक कुण्ड ऑक्यूपेंसी सारांश' : 'Daily Kund Occupancy Summary'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'hi'
                ? 'तिथि एवं सत्र चुनें और कुल रिक्त, आंशिक, पूर्ण तथा ब्लॉक कुण्डों की संख्या देखें।'
                : 'Select date & session to view summary metrics across 2,151 consecrated kunds.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Session Switcher Pill */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl w-fit self-start md:self-auto">
              <button
                onClick={() => setSelectedSession('morning')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSession === 'morning'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ☀️ {lang === 'hi' ? 'प्रातः (8:00 – 11:00 AM)' : 'Morning (8:00 – 11:00 AM)'}
              </button>
              <button
                onClick={() => setSelectedSession('afternoon')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSession === 'afternoon'
                    ? 'bg-rose-900 text-amber-100 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌅 {lang === 'hi' ? 'सायं (1:00 – 4:00 PM)' : 'Afternoon (1:00 – 4:00 PM)'}
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshAll}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOccupancy || loadingBookings ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 8-Day Date Selector Ribbon */}
        <div>
          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
            {lang === 'hi' ? 'महायज्ञ दिवस चुनें (14–21 दिसम्बर 2026):' : 'Select Event Day (14–21 Dec 2026):'}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {EVENT_DAYS.map((day) => {
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-amber-300 border-stone-950 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200/90 hover:bg-stone-100'
                  }`}
                >
                  <div className="font-bold">{day.shortLabel}</div>
                  <div className="text-[10px] opacity-75 max-w-[130px] truncate">{day.tithi}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Occupancy KPI Summary Cards (Total Empty, Partial, Full, Blocked) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Total Empty Kunds */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-900">
                {lang === 'hi' ? 'रिक्त कुण्ड' : 'Empty Kunds'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-950">
              {loadingOccupancy ? '...' : (occupancy?.emptyKunds?.toLocaleString() ?? '2,151')}
            </div>
            <div className="text-[11px] text-emerald-700/90 mt-1">
              {lang === 'hi' ? 'आवंटन हेतु पूर्णतः उपलब्ध' : '100% capacity available'}
            </div>
          </div>

          {/* 2. Partial Kunds */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-amber-900">
                {lang === 'hi' ? 'आंशिक कुण्ड' : 'Partial Kunds'}
              </span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-950">
              {loadingOccupancy ? '...' : (occupancy?.partialKunds?.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-amber-700/90 mt-1">
              {lang === 'hi' ? '1 से 7 श्रद्धालु आवंटित' : '1 to 7 devotees seated'}
            </div>
          </div>

          {/* 3. Full Kunds */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-rose-900">
                {lang === 'hi' ? 'पूर्ण कुण्ड' : 'Full Kunds'}
              </span>
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-950">
              {loadingOccupancy ? '...' : (occupancy?.fullKunds?.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-rose-700/90 mt-1">
              {lang === 'hi' ? '8/8 क्षमता भरी हुई' : '8/8 capacity filled'}
            </div>
          </div>

          {/* 4. Blocked Kunds */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-purple-900">
                {lang === 'hi' ? 'ब्लॉक / आरक्षित' : 'Blocked / Reserved'}
              </span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-purple-950">
              {loadingOccupancy ? '...' : (occupancy?.blockedKunds?.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-purple-700/90 mt-1">
              {lang === 'hi' ? 'ऑफलाइन / VIP हेतु आरक्षित' : 'Offline ashram / VIP pool'}
            </div>
          </div>

        </div>

        {/* Quiet Sub-metrics Bar */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-500">{lang === 'hi' ? 'सत्र स्थिति:' : 'Session Info:'}</span>
            <span className="font-semibold text-stone-900">
              {formatDateDisplay(selectedDate)} · {selectedSession === 'morning' ? 'प्रातः सत्र (8–11)' : 'सायं सत्र (1–4)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-stone-500 font-mono tabular-nums text-[11px]">
            <span>कुल कुण्ड: <strong className="text-stone-800">2,151</strong></span>
            <span>कुल क्षमता: <strong className="text-stone-800">17,208 स्थान</strong></span>
            <span>आवंटित श्रद्धालु: <strong className="text-amber-800">{occupancy?.totalSeatsOccupied ?? 0}</strong></span>
            <span>उपलब्ध स्थान: <strong className="text-emerald-800">{occupancy?.availableSeats ?? 17208}</strong></span>
          </div>
        </div>

      </section>

      {/* DASHBOARD VIEW SWITCHER TABS: [ 🗺️ 11 Zones & Kund Grid ] vs [ 📋 All Devotee Bookings ] */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('zones')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'zones'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{lang === 'hi' ? '11 जोन एवं बस-सीट कुण्ड ग्रिड' : '11 Zones & Bus-Seat Kund Map'}</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'hi' ? 'श्रद्धालु बुकिंग सूची' : 'Devotee Bookings List'}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-stone-700 text-white">
              {bookings.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-stone-500 font-mono">
          Operator: <strong className="text-stone-800">{currentAdmin.name}</strong>
        </div>
      </div>

      {/* VIEW TAB 1: 11 ZONES & BUS-SEAT KUND GRID */}
      {activeTab === 'zones' && (
        <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4">
          <ZoneOverviewGrid
            zoneSummaries={occupancy?.zoneSummaries}
            kundDetailsMap={occupancy?.kundDetails || {}}
            onSelectBooking={(code) => setSelectedBookingId(code)}
            lang={lang}
          />
        </section>
      )}

      {/* VIEW TAB 2: ADMIN BOOKINGS LIST WITH SEARCH & MOBILE/DESKTOP RESPONSIVE TABLE */}
      {activeTab === 'bookings' && (
        <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
          
          {/* Section Header with Search Bar */}
          <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                  {lang === 'hi' ? 'महायज्ञ बुकिंग्स रजिस्टर' : 'Devotee Bookings Register'}
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {lang === 'hi'
                  ? 'किसी भी पंक्ति पर क्लिक करके सम्पूर्ण विवरण, श्रद्धालु सूची व आवंटित सत्र देखें।'
                  : 'Click on any booking row to view full Yagyakarta profile, participants, and allocated sessions.'}
              </p>
            </div>

            {/* Live Search Input Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'hi'
                    ? 'खोजें: कोड, नाम, मोबाइल, शहर या पता...'
                    : 'Search: code, name, mobile, city, address...'
                }
                className="w-full min-h-[44px] pl-10 pr-9 rounded-2xl border border-stone-300 bg-stone-50 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bookings Error state */}
          {bookingsError && (
            <div className="m-4 sm:m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bookingsError}</span>
            </div>
          )}

          {/* DESKTOP TABLE VIEW (Visible on sm and above) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Booking Code</th>
                  <th className="py-3 px-4">Yagyakarta Name</th>
                  <th className="py-3 px-4">Primary Mobile</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Devotees</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {loadingBookings ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        <span>{lang === 'hi' ? 'बुकिंग्स लोड हो रही हैं...' : 'Loading bookings from database...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <div className="max-w-xs mx-auto space-y-1">
                        <div className="text-sm font-semibold text-stone-800">
                          {lang === 'hi' ? 'कोई बुकिंग नहीं मिली' : 'No bookings found'}
                        </div>
                        <p className="text-xs text-stone-400">
                          {searchTerm 
                            ? (lang === 'hi' ? 'खोज शब्द बदल कर पुनः प्रयास करें।' : 'Try different search keywords.')
                            : (lang === 'hi' ? 'डेटाबेस में अभी कोई पंजीकरण दर्ज नहीं है।' : 'No records yet in the database.')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr
                      key={b.id || b.bookingCode}
                      onClick={() => setSelectedBookingId(b.bookingCode)}
                      className="hover:bg-amber-50/60 transition-colors cursor-pointer group"
                    >
                      {/* 1. Booking Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-900 group-hover:text-amber-950">
                        <span className="bg-stone-100 group-hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-stone-200 group-hover:border-amber-300">
                          {b.bookingCode}
                        </span>
                      </td>

                      {/* 2. Yagyakarta Name */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {b.yagyakartaName}
                        {b.gotra && (
                          <span className="block text-[11px] text-stone-400 font-normal">
                            Gotra: {b.gotra}
                          </span>
                        )}
                      </td>

                      {/* 3. Primary Mobile */}
                      <td className="py-3.5 px-4 font-mono text-stone-700">
                        <a
                          href={`tel:${b.primaryMobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-amber-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>+91 {b.primaryMobile}</span>
                        </a>
                      </td>

                      {/* 4. City */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{b.city}</span>
                        </div>
                      </td>

                      {/* 5. Address */}
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs">
                        <div className="truncate text-xs" title={b.address}>
                          {b.address || '—'}
                        </div>
                      </td>

                      {/* 6. Participant Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                          <Users className="w-3 h-3 mr-1 text-emerald-600" />
                          {b.participantCount}
                        </span>
                      </td>

                      {/* 7. Created At */}
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {formatDateDisplay(b.createdAt)}
                      </td>

                      {/* 8. Action (Open Detail View) */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingId(b.bookingCode);
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer group-hover:bg-stone-900 group-hover:text-amber-200 transition-colors"
                        >
                          <span>{lang === 'hi' ? 'विवरण' : 'Details'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE STACKED CARDS VIEW (Visible only on xs screens) */}
          <div className="sm:hidden divide-y divide-stone-100">
            {loadingBookings ? (
              <div className="py-10 text-center text-xs text-stone-500">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 mx-auto mb-2" />
                <span>{lang === 'hi' ? 'बुकिंग्स लोड हो रही हैं...' : 'Loading bookings...'}</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                {lang === 'hi' ? 'कोई बुकिंग नहीं मिली' : 'No bookings found'}
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id || b.bookingCode}
                  onClick={() => setSelectedBookingId(b.bookingCode)}
                  className="p-4 hover:bg-amber-50/50 transition-colors cursor-pointer space-y-2.5 active:bg-amber-100/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-stone-100 text-amber-950 px-2.5 py-1 rounded-lg border border-stone-200">
                      {b.bookingCode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Users className="w-3 h-3" />
                      {b.participantCount} {lang === 'hi' ? 'सदस्य' : 'members'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{b.yagyakartaName}</h4>
                    {b.gotra && <p className="text-[11px] text-stone-500">Gotra: {b.gotra}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>+91 {b.primaryMobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{b.city}</span>
                    </div>
                  </div>

                  {b.address && (
                    <div className="text-[11px] text-stone-500 line-clamp-1 bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                      <span className="font-semibold">{lang === 'hi' ? 'पता: ' : 'Address: '}</span>
                      {b.address}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px] text-stone-400">
                    <span>{formatDateDisplay(b.createdAt)}</span>
                    <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                      <span>{lang === 'hi' ? 'पूरा विवरण देखें' : 'View full detail'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bookings Count Footer */}
          <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 font-mono">
            <span>
              {lang === 'hi'
                ? `प्रदर्शित: ${bookings.length} बुकिंग्स`
                : `Showing: ${bookings.length} bookings`}
            </span>
            <span className="text-[11px]">
              {lang === 'hi'
                ? 'लाइव नियॉन पोस्टग्रेस डेटाबेस से सिंक'
                : 'Synced with live Neon Postgres database'}
            </span>
          </div>

        </section>
      )}

      {/* DETAIL MODAL: OPENS WHEN CLICKING ANY BOOKING ROW OR BUS SEAT FAMILY */}
      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          isOpen={Boolean(selectedBookingId)}
          onClose={() => setSelectedBookingId(null)}
          lang={lang}
        />
      )}

    </div>
  );
};
