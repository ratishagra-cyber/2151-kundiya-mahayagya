import React from 'react';
import { Search, ArrowRightLeft, Trash2, Download, Phone, MapPin, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Booking, AllocatedSession } from '../../types';
import { ReassignModal } from './ReassignModal';
import { cancelBooking, cancelSession } from '../../services/storageService';

interface BookingsTableProps {
  bookings: Booking[];
  onBookingsUpdated: (updatedList: Booking[]) => void;
  lang: 'en' | 'hi';
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  onBookingsUpdated,
  lang,
}) => {
  const [search, setSearch] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = React.useState<{ booking: Booking; alloc: AllocatedSession } | null>(null);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      b.id.toLowerCase().includes(q) ||
      b.yagyakarta.fullName.toLowerCase().includes(q) ||
      b.yagyakarta.primaryMobile.includes(q) ||
      b.yagyakarta.city.toLowerCase().includes(q) ||
      b.participants.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCancelEntireBooking = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this entire booking? All seats will be released.')) {
      cancelBooking(id);
      const updated = bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const, allocations: [] } : b
      );
      onBookingsUpdated(updated);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Booking ID', 'Yagyakarta', 'Phone', 'City', 'Members Count', 'Status', 'Allocated Kunds'],
    ];

    bookings.forEach((b) => {
      const kunds = Array.from(new Set(b.allocations.map((a) => a.kundNumber))).join('; ');
      rows.push([
        b.id,
        b.yagyakarta.fullName,
        b.yagyakarta.primaryMobile,
        b.yagyakarta.city,
        b.participants.length.toString(),
        b.status,
        kunds,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'mahayagya_2151_registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs text-xs">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Coordinator, Member, Mobile, City, or ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <span className="text-stone-500 font-medium">
            {filtered.length} Bookings
          </span>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-2.5">
        {filtered.map((b) => {
          const isExpanded = expandedId === b.id;
          const uniqueKunds = Array.from(new Set(b.allocations.map((a) => a.kundNumber)));

          return (
            <div
              key={b.id}
              className={`rounded-2xl border transition-all ${
                b.status === 'cancelled'
                  ? 'bg-stone-50 border-stone-200 opacity-60'
                  : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
              }`}
            >
              {/* Row Summary */}
              <div
                onClick={() => toggleExpand(b.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 font-bold text-xs font-mono">
                    {b.participants.length}p
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{b.yagyakarta.fullName}</span>
                      <span className="text-stone-400 font-mono text-xs">({b.id})</span>
                    </div>
                    <div className="text-xs text-stone-500 flex items-center gap-3 mt-0.5">
                      <span className="font-mono">+91 {b.yagyakarta.primaryMobile}</span>
                      <span>·</span>
                      <span>{b.yagyakarta.city}, {b.yagyakarta.state}</span>
                      {b.yagyakarta.address && <span className="truncate max-w-xs text-stone-500">· {b.yagyakarta.address}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-xs font-bold text-rose-950 font-mono">
                      {uniqueKunds.length > 0 ? uniqueKunds.map((k) => `Kund #${k}`).join(', ') : 'No Active Kund'}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {b.allocations.length} Session(s)
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'partially_cancelled'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {b.status}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/60 rounded-b-2xl space-y-4 text-xs">
                  
                  {/* Participants Grid */}
                  <div>
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Devotees in this Booking ({b.participants.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {b.participants.map((p, idx) => (
                        <div
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 flex items-center gap-1.5"
                        >
                          <span className="font-mono text-[10px] text-stone-400">{idx + 1}.</span>
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[10px] text-stone-500">({p.relationship.split('(')[0].trim()})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sessions & Reassign Actions */}
                  <div>
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Session Allocations & Admin Actions:
                    </div>
                    <div className="space-y-2">
                      {b.allocations.map((alloc, aIdx) => (
                        <div
                          key={aIdx}
                          className="p-2.5 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-stone-900">{alloc.date}</span>
                            <span className="text-stone-500 ml-1.5">
                              ({alloc.session === 'morning' ? 'Morning 8-11 AM' : 'Afternoon 1-4 PM'})
                            </span>
                            <span className="ml-2 font-mono font-bold text-rose-900">
                              Kund {alloc.kundNumber} ({alloc.zone})
                            </span>
                            <span className="ml-2 text-stone-500 font-mono">
                              [{alloc.participantCount} seated together]
                            </span>
                          </div>

                          <button
                            onClick={() => setReassignTarget({ booking: b, alloc })}
                            className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-amber-700" />
                            <span>Reassign Kund</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Management Footer */}
                  {b.status !== 'cancelled' && (
                    <div className="pt-2 border-t border-stone-200 flex justify-end">
                      <button
                        onClick={() => handleCancelEntireBooking(b.id)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Entire Booking & Free All Seats</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reassign Modal */}
      {reassignTarget && (
        <ReassignModal
          booking={reassignTarget.booking}
          alloc={reassignTarget.alloc}
          allBookings={bookings}
          onSuccess={(updated) => {
            onBookingsUpdated(updated);
            setReassignTarget(null);
          }}
          onClose={() => setReassignTarget(null)}
          lang={lang}
        />
      )}

    </div>
  );
};
