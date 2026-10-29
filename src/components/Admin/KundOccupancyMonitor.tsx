import React from 'react';
import { Search, Filter, Flame, Check, Minus, Lock, Unlock, ShieldCheck, Layers, ChevronDown } from 'lucide-react';
import { Booking, SessionType, KundSessionOccupancy, AdminUser } from '../../types';
import { EVENT_DETAILS, KUND_ZONES, getZoneForKund } from '../../data/eventConfig';
import { calculateKundOccupancyMap } from '../../services/allocationEngine';
import { KundInspectorDrawer } from './KundInspectorDrawer';
import { BulkBlockModal } from './BulkBlockModal';
import { unblockKund } from '../../services/adminService';

interface KundOccupancyMonitorProps {
  bookings: Booking[];
  selectedDate: string;
  selectedSession: SessionType;
  currentAdmin: AdminUser;
  onDataRefresh: () => void;
  lang: 'en' | 'hi';
}

export const KundOccupancyMonitor: React.FC<KundOccupancyMonitorProps> = ({
  bookings,
  selectedDate,
  selectedSession,
  currentAdmin,
  onDataRefresh,
  lang,
}) => {
  const [selectedZone, setSelectedZone] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'empty' | 'partial' | 'full' | 'blocked'>('all');
  const [searchKundNum, setSearchKundNum] = React.useState<string>('');
  const [inspectedKund, setInspectedKund] = React.useState<KundSessionOccupancy | null>(null);

  // Multi-select for Bulk Actions
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedKunds, setSelectedKunds] = React.useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);

  // Compute full occupancy map for the active date and session
  const occupancyMap = React.useMemo(() => {
    return calculateKundOccupancyMap(bookings, selectedDate, selectedSession);
  }, [bookings, selectedDate, selectedSession]);

  // Filter kunds based on controls
  const filteredKunds = React.useMemo(() => {
    const list: KundSessionOccupancy[] = [];
    for (let i = 1; i <= EVENT_DETAILS.totalKunds; i++) {
      const data = occupancyMap.get(i);
      if (!data) continue;

      if (selectedZone !== 'all' && data.zone !== selectedZone) continue;
      if (statusFilter === 'blocked' && !data.isBlocked) continue;
      if (statusFilter === 'empty' && (data.occupiedSeats !== 0 || data.isBlocked)) continue;
      if (statusFilter === 'full' && (data.occupiedSeats !== 8 || data.isBlocked)) continue;
      if (statusFilter === 'partial' && (data.occupiedSeats === 0 || data.occupiedSeats === 8 || data.isBlocked)) continue;

      if (searchKundNum.trim()) {
        const queryNum = parseInt(searchKundNum.replace(/\D/g, ''), 10);
        if (!isNaN(queryNum) && data.kundNumber !== queryNum) continue;
      }

      list.push(data);
    }
    return list;
  }, [occupancyMap, selectedZone, statusFilter, searchKundNum]);

  // Aggregate stats
  const stats = React.useMemo(() => {
    let empty = 0;
    let partial = 0;
    let full = 0;
    let blocked = 0;
    let totalOccupiedSeats = 0;

    for (let i = 1; i <= EVENT_DETAILS.totalKunds; i++) {
      const d = occupancyMap.get(i);
      if (!d) continue;

      if (d.isBlocked) {
        blocked++;
        totalOccupiedSeats += 8;
      } else {
        totalOccupiedSeats += d.occupiedSeats;
        if (d.occupiedSeats === 0) empty++;
        else if (d.occupiedSeats === 8) full++;
        else partial++;
      }
    }

    return {
      empty,
      partial,
      full,
      blocked,
      totalOccupiedSeats,
      totalCapacity: EVENT_DETAILS.seatsPerKund * EVENT_DETAILS.totalKunds,
    };
  }, [occupancyMap]);

  const toggleSelectKund = (num: number, e: React.MouseEvent) => {
    if (!selectionMode) return;
    e.stopPropagation();
    setSelectedKunds((prev) =>
      prev.includes(num) ? prev.filter((k) => k !== num) : [...prev, num]
    );
  };

  const handleBulkUnblockSelected = () => {
    if (selectedKunds.length === 0) return;
    if (window.confirm(`Unblock ${selectedKunds.length} selected Kund(s)?`)) {
      selectedKunds.forEach((num) => {
        unblockKund(currentAdmin, num, selectedDate, selectedSession);
      });
      setSelectedKunds([]);
      onDataRefresh();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 4 State KPI Cards with Icon + Pattern Distinction */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Allocated */}
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
            Total Utilized Seats
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 font-mono mt-0.5">
            {stats.totalOccupiedSeats.toLocaleString()}{' '}
            <span className="text-[11px] font-sans text-stone-500 font-normal">
              / {stats.totalCapacity.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 1. Full 8/8 State (Solid Checkmark + Crimson) */}
        <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-600/60 shadow-2xs">
          <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider flex items-center justify-between">
            <span>8/8 Full Online</span>
            <span className="w-4 h-4 rounded-full bg-rose-800 text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-950 font-mono mt-0.5">
            {stats.full}{' '}
            <span className="text-xs font-sans text-rose-800 font-normal">
              ({((stats.full / EVENT_DETAILS.totalKunds) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 2. Partial 1-7/8 State (Gauge Icon + Dashed Amber) */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-500 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
            <span>1–7/8 Partial</span>
            <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[9px] font-bold">
              ◐
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-950 font-mono mt-0.5">
            {stats.partial}
          </div>
        </div>

        {/* 3. Blocked / Offline State (Lock Icon + Purple Hashed) */}
        <div className="p-3.5 rounded-2xl bg-purple-50 border-2 border-purple-500 shadow-2xs">
          <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
            <span>Blocked / VIP</span>
            <span className="w-4 h-4 rounded-full bg-purple-800 text-white flex items-center justify-center text-[10px]">
              <Lock className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-950 font-mono mt-0.5">
            {stats.blocked}
          </div>
        </div>

        {/* 4. Empty 0/8 State (Ring Icon + Neutral) */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-300 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex items-center justify-between">
            <span>0/8 Pristine Empty</span>
            <span className="w-4 h-4 rounded-full border-2 border-stone-400 flex items-center justify-center text-[10px]">
              <Minus className="w-2 h-2 text-stone-400" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 font-mono mt-0.5">
            {stats.empty}
          </div>
        </div>
      </div>

      {/* Filter and Bulk Operation Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3 text-xs">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-stone-500 font-semibold mr-1">Filter:</span>
            {(['all', 'full', 'partial', 'blocked', 'empty'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === st
                    ? 'bg-rose-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {st === 'all' && <span>All ({EVENT_DETAILS.totalKunds})</span>}
                {st === 'full' && (
                  <>
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Full (8/8)</span>
                  </>
                )}
                {st === 'partial' && (
                  <>
                    <span className="font-mono text-xs">◐</span>
                    <span>Partial (1–7/8)</span>
                  </>
                )}
                {st === 'blocked' && (
                  <>
                    <Lock className="w-3 h-3 text-purple-300" />
                    <span>Blocked ({stats.blocked})</span>
                  </>
                )}
                {st === 'empty' && (
                  <>
                    <Minus className="w-3 h-3" />
                    <span>Empty ({stats.empty})</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Operational Triggers: Multi-Select Toggle & Bulk Block Modal */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedKunds([]);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectionMode
                  ? 'bg-amber-100 border-amber-400 text-amber-950'
                  : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{selectionMode ? 'Exit Multi-Select' : 'Multi-Select Mode'}</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-purple-200" />
              <span>Bulk Block Range / Zone</span>
            </button>
          </div>

        </div>

        {/* Zone Selector and Quick Jump */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-medium text-stone-700 focus:outline-none"
            >
              <option value="all">All Zones (A–G)</option>
              {KUND_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id}: {z.name} ({z.range[0]}–{z.range[1]})
                </option>
              ))}
            </select>

            <div className="relative w-36">
              <input
                type="text"
                value={searchKundNum}
                onChange={(e) => setSearchKundNum(e.target.value)}
                placeholder="Jump to Kund..."
                className="w-full min-h-[36px] pl-3 pr-2 py-1.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="text-[11px] text-stone-500 font-mono">
            Active: {selectedDate} · {selectedSession === 'morning' ? 'Morning (8-11 AM)' : 'Afternoon (1-4 PM)'}
          </div>
        </div>

      </div>

      {/* STICKY BULK ACTION BAR (Appears ONLY when kunds are selected) */}
      {selectedKunds.length > 0 && (
        <div className="sticky top-20 z-30 p-3 bg-stone-900 text-stone-100 rounded-2xl shadow-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center font-mono">
              {selectedKunds.length}
            </span>
            <span className="font-bold">Kund(s) Selected</span>
            <span className="text-stone-400 text-[11px] hidden sm:inline">
              [{selectedKunds.slice(0, 5).join(', ')}{selectedKunds.length > 5 ? '...' : ''}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Block Selected ({selectedKunds.length})</span>
            </button>

            <button
              onClick={handleBulkUnblockSelected}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unblock Selected</span>
            </button>

            <button
              onClick={() => setSelectedKunds([])}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 2,151 Kund Grid (Differentiated by Pattern + Icon + Color) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold text-stone-700">
            Showing {filteredKunds.length} of {EVENT_DETAILS.totalKunds} Physical Kunds
            {selectionMode && ' (Click tiles to toggle multi-selection)'}
          </span>
          <span className="text-[11px] font-mono">
            {selectionMode ? `${selectedKunds.length} selected` : 'Click tile to inspect'}
          </span>
        </div>

        {filteredKunds.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No kunds match current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 max-h-[580px] overflow-y-auto p-1 no-scrollbar">
            {filteredKunds.map((k) => {
              const isBlocked = k.isBlocked;
              const isFull = !isBlocked && k.occupiedSeats === 8;
              const isPartial = !isBlocked && k.occupiedSeats > 0 && k.occupiedSeats < 8;
              const isEmpty = !isBlocked && k.occupiedSeats === 0;
              const isSelected = selectedKunds.includes(k.kundNumber);

              return (
                <button
                  key={k.kundNumber}
                  onClick={(e) => {
                    if (selectionMode) {
                      toggleSelectKund(k.kundNumber, e);
                    } else {
                      setInspectedKund(k);
                    }
                  }}
                  className={`min-h-[46px] p-1.5 rounded-xl text-center transition-all cursor-pointer relative group flex flex-col items-center justify-center select-none ${
                    isSelected
                      ? 'ring-3 ring-amber-500 shadow-md'
                      : ''
                  } ${
                    isBlocked
                      ? 'bg-purple-100 border-2 border-purple-500 text-purple-950 hover:bg-purple-200'
                      : isFull
                      ? 'bg-rose-900 border-2 border-rose-950 text-white shadow-2xs hover:bg-rose-950'
                      : isPartial
                      ? 'bg-amber-100 border-2 border-dashed border-amber-500 text-amber-950 hover:bg-amber-200'
                      : 'bg-stone-50 border border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-100'
                  }`}
                  title={`Kund #${k.kundNumber} (${k.zone}): ${isBlocked ? 'Blocked (Offline)' : `${k.occupiedSeats}/8 seats`}`}
                >
                  <div className="flex items-center gap-0.5 text-[11px] font-bold font-mono leading-tight">
                    {isBlocked && <Lock className="w-2.5 h-2.5 text-purple-700" />}
                    {isFull && <Check className="w-2.5 h-2.5 text-amber-300 stroke-[3]" />}
                    {isPartial && <span className="text-[9px] text-amber-800">◐</span>}
                    {isEmpty && <span className="text-[9px] text-stone-400">○</span>}
                    <span>{k.kundNumber}</span>
                  </div>

                  <div
                    className={`text-[10px] font-mono leading-tight mt-0.5 ${
                      isBlocked
                        ? 'text-purple-800 font-bold'
                        : isFull
                        ? 'text-amber-200 font-bold'
                        : isPartial
                        ? 'text-amber-900 font-bold'
                        : 'text-stone-400'
                    }`}
                  >
                    {isBlocked ? 'BLOCKED' : `${k.occupiedSeats}/8`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kund Inspector Slide-over Drawer */}
      <KundInspectorDrawer
        kundData={inspectedKund}
        currentAdmin={currentAdmin}
        onClose={() => setInspectedKund(null)}
        onBlockSingle={(num) => {
          setSelectedKunds([num]);
          setIsBulkModalOpen(true);
        }}
        onKundStateChanged={() => onDataRefresh()}
        lang={lang}
      />

      {/* Bulk Block Modal */}
      <BulkBlockModal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setSelectedKunds([]);
        }}
        currentAdmin={currentAdmin}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        allBookings={bookings}
        preSelectedKunds={selectedKunds}
        onSuccess={() => onDataRefresh()}
        lang={lang}
      />

    </div>
  );
};
