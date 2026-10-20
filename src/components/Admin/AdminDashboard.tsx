import React from 'react';
import { Calendar, Clock, Flame, Users, Grid, RefreshCw, ShieldCheck, ListOrdered, UserPlus, History, Download, Lock, Smartphone, Laptop, LogOut } from 'lucide-react';
import { Booking, SessionType, AdminUser } from '../../types';
import { EVENT_DAYS, EVENT_DETAILS } from '../../data/eventConfig';
import { KundOccupancyMonitor } from './KundOccupancyMonitor';
import { BookingsTable } from './BookingsTable';
import { AdminManagementTab } from './AdminManagementTab';
import { AuditLogsTab } from './AuditLogsTab';
import { BulkBlockModal } from './BulkBlockModal';
import { ExcelExportModal } from './ExcelExportModal';
import { resetDemoData, getStoredBookings } from '../../services/storageService';
import { getBlockedKunds } from '../../services/adminService';

interface AdminDashboardProps {
  bookings: Booking[];
  currentAdmin: AdminUser;
  onBookingsUpdated: (bookings: Booking[]) => void;
  onLogout: () => void;
  lang: 'en' | 'hi';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  currentAdmin,
  onBookingsUpdated,
  onLogout,
  lang,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<string>(EVENT_DAYS[0].date);
  const [selectedSession, setSelectedSession] = React.useState<SessionType>('morning');
  const [subTab, setSubTab] = React.useState<'map' | 'directory' | 'admins' | 'audit'>('map');

  // Modals state
  const [isBulkBlockModalOpen, setIsBulkBlockModalOpen] = React.useState(false);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = React.useState(false);

  const handleReset = () => {
    if (window.confirm('Reset all bookings back to the original realistic seed data?')) {
      resetDemoData();
      onBookingsUpdated(getStoredBookings());
    }
  };

  const handleRefreshData = () => {
    onBookingsUpdated(getStoredBookings());
  };

  const isSuperAdmin = currentAdmin.role === 'super_admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. Admin Top Command Bar with Attributable Session Profile */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
              <span>Operations Command</span>
            </span>

            {/* Admin Attribution Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-950 text-xs font-bold border border-amber-300">
              <span>Admin: {currentAdmin.name}</span>
              <span className="text-[10px] uppercase bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">
                {isSuperAdmin ? 'Super Admin' : 'Operator'}
              </span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold font-serif text-stone-900">
            {lang === 'hi' ? '2,151 कुंड ऑक्यूपेंसी एवं प्रबंधन कंसोल' : '2,151 Kund Occupancy & Operations Monitor'}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Live Best-Fit allocation tracking, capacity protection, offline seat blocking, and export center.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Excel Export Button */}
          <button
            onClick={() => setIsExcelExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Download Excel reports"
          >
            <Download className="w-3.5 h-3.5 text-emerald-800" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Bulk Seat Blocking Button */}
          <button
            onClick={() => setIsBulkBlockModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-900 hover:bg-purple-950 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Block range or zone for offline/VIP"
          >
            <Lock className="w-3.5 h-3.5 text-purple-200" />
            <span>Bulk Block / Offline</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            title="Reset data to initial sample bookings"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Exit / Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            title="Exit admin mode"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* 2. Device Strategy Notice Banner for Mobile Devices */}
      <div className="md:hidden p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
        <Smartphone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">📱 Mobile Operator Mode Active</div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            Fast occupancy check, single kund inspection & block/unblock, and attendee search are enabled for mobile. For 2,151 high-density interactive grid and multi-sheet Excel (.xlsx) downloads, please open on laptop/desktop.
          </p>
        </div>
      </div>

      {/* 3. Date & Session Controller Bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Horizontal 8-Day Scroller */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Select Active Yagya Day (14–21 Dec 2026):
            </label>
            <span className="text-[11px] text-stone-400 font-mono">8 Days · 16 Total Sessions</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {EVENT_DAYS.map((day) => {
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-rose-900 text-amber-100 border-rose-950 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="font-bold">{day.shortLabel}</div>
                  <div className="text-[10px] opacity-80 max-w-[120px] truncate">{day.tithi}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Switcher & Subtab Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
          
          {/* Morning / Afternoon Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl w-fit">
            <button
              onClick={() => setSelectedSession('morning')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSession === 'morning'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ☀️ Morning (8:00 – 11:00 AM)
            </button>
            <button
              onClick={() => setSelectedSession('afternoon')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSession === 'afternoon'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🌅 Afternoon (1:00 – 4:00 PM)
            </button>
          </div>

          {/* 4 Navigation Subtabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSubTab('map')}
              className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                subTab === 'map'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2,151 Kund Map</span>
            </button>

            <button
              onClick={() => setSubTab('directory')}
              className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                subTab === 'directory'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Devotee Directory</span>
            </button>

            <button
              onClick={() => setSubTab('admins')}
              className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                subTab === 'admins'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Staff &amp; RBAC</span>
            </button>

            <button
              onClick={() => setSubTab('audit')}
              className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                subTab === 'audit'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. Subtab Content Area */}
      {subTab === 'map' && (
        <KundOccupancyMonitor
          bookings={bookings}
          selectedDate={selectedDate}
          selectedSession={selectedSession}
          currentAdmin={currentAdmin}
          onDataRefresh={handleRefreshData}
          lang={lang}
        />
      )}

      {subTab === 'directory' && (
        <BookingsTable
          bookings={bookings}
          onBookingsUpdated={onBookingsUpdated}
          lang={lang}
        />
      )}

      {subTab === 'admins' && (
        <AdminManagementTab
          currentAdmin={currentAdmin}
          onAdminsUpdated={() => {}}
          lang={lang}
        />
      )}

      {subTab === 'audit' && (
        <AuditLogsTab
          lang={lang}
        />
      )}

      {/* Global Bulk Block Modal */}
      <BulkBlockModal
        isOpen={isBulkBlockModalOpen}
        onClose={() => setIsBulkBlockModalOpen(false)}
        currentAdmin={currentAdmin}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        allBookings={bookings}
        onSuccess={handleRefreshData}
        lang={lang}
      />

      {/* Global Excel (.xlsx) Export Modal */}
      <ExcelExportModal
        isOpen={isExcelExportModalOpen}
        onClose={() => setIsExcelExportModalOpen(false)}
        currentAdmin={currentAdmin}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        allBookings={bookings}
        allBlockedKunds={getBlockedKunds()}
        lang={lang}
      />

    </div>
  );
};
