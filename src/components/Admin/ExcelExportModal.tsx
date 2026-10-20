import React from 'react';
import { Download, FileSpreadsheet, X, Check, Calendar, Filter } from 'lucide-react';
import { Booking, SessionType, AdminUser, BlockedKundRecord } from '../../types';
import { exportExcelReport, logAdminAction } from '../../services/adminService';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: AdminUser;
  selectedDate: string;
  selectedSession: SessionType;
  allBookings: Booking[];
  allBlockedKunds: BlockedKundRecord[];
  lang: 'en' | 'hi';
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  selectedDate,
  selectedSession,
  allBookings,
  allBlockedKunds,
  lang,
}) => {
  const [reportType, setReportType] = React.useState<'bookings' | 'participants' | 'kund_allocations' | 'occupancy_summary'>('bookings');
  const [filterScope, setFilterScope] = React.useState<'active' | 'all'>('active');
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    exportExcelReport(reportType, {
      dateFilter: filterScope === 'active' ? selectedDate : 'all',
      sessionFilter: filterScope === 'active' ? selectedSession : 'all',
      bookings: allBookings,
      blockedKunds: allBlockedKunds,
    });

    logAdminAction(
      currentAdmin,
      'EXPORT_DATA',
      `Exported Excel (.xlsx) report: [${reportType.toUpperCase()}] for scope: [${filterScope.toUpperCase()}]`
    );

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  const reports = [
    {
      id: 'bookings' as const,
      title: 'Full Bookings Master Report',
      desc: 'Booking IDs, coordinators, primary/alt mobiles, city, gotra, sankalp, total attendees, and allocated kunds.',
      icon: FileSpreadsheet,
    },
    {
      id: 'participants' as const,
      title: 'Individual Devotees Directory',
      desc: 'Line-item attendee list with name, age, gender, relation, personal phone, and attended sessions.',
      icon: FileSpreadsheet,
    },
    {
      id: 'kund_allocations' as const,
      title: 'Kund-Wise Seating & Block List',
      desc: 'Exact physical kund-by-kund breakdown (#1 to #2151) detailing assigned online families & offline blocks.',
      icon: FileSpreadsheet,
    },
    {
      id: 'occupancy_summary' as const,
      title: 'Event Occupancy & Utilization Matrix',
      desc: '16 sessions (8 days × 2 sessions) KPI summary of total capacity (17,208), booked, blocked, and available seats.',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-serif">
                {lang === 'hi' ? 'एक्सेल डेटा निर्यात केंद्र (.xlsx)' : 'Excel Operations Data Export (.xlsx)'}
              </h3>
              <p className="text-[10px] text-emerald-300 font-mono">Official Mahayagya Seating Registers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Filter Scope Switcher */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Export Scope:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterScope('active')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  filterScope === 'active'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="font-semibold text-xs">Current Session Only</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  {selectedDate} ({selectedSession})
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  filterScope === 'all'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="font-semibold text-xs">Entire Event (All 8 Days)</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  14–21 Dec (All 16 Sessions)
                </div>
              </button>
            </div>
          </div>

          {/* Report Type Selector */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Select Report Type:</label>
            <div className="space-y-2">
              {reports.map((r) => {
                const isSelected = reportType === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setReportType(r.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-400'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-stone-900 text-xs">{r.title}</div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Attribution Notice */}
          <div className="p-3 rounded-xl bg-stone-100 text-stone-600 text-[11px] flex items-center justify-between">
            <span>Attributed to: <strong>{currentAdmin.name}</strong></span>
            <span className="font-mono text-[10px] uppercase">{currentAdmin.role}</span>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={downloadSuccess}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download .xlsx Spreadsheet'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
