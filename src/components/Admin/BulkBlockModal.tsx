import React from 'react';
import { Lock, X, AlertCircle, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';
import { SessionType, AdminUser, Booking } from '../../types';
import { EVENT_DETAILS, KUND_ZONES } from '../../data/eventConfig';
import { blockKunds } from '../../services/adminService';

interface BulkBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: AdminUser;
  selectedDate: string;
  selectedSession: SessionType;
  allBookings: Booking[];
  preSelectedKunds?: number[];
  onSuccess: () => void;
  lang: 'en' | 'hi';
}

export const BulkBlockModal: React.FC<BulkBlockModalProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  selectedDate,
  selectedSession,
  allBookings,
  preSelectedKunds = [],
  onSuccess,
  lang,
}) => {
  const [mode, setMode] = React.useState<'range' | 'zone' | 'custom'>('range');
  const [rangeStart, setRangeStart] = React.useState<number>(100);
  const [rangeEnd, setRangeEnd] = React.useState<number>(110);
  const [selectedZone, setSelectedZone] = React.useState<string>('Zone G');
  const [reason, setReason] = React.useState('');
  const [assignOfflineFamily, setAssignOfflineFamily] = React.useState(false);
  const [offlineDetails, setOfflineDetails] = React.useState({
    groupName: '',
    contactPhone: '',
    devoteeCount: 8,
  });
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let kundNumbersToBlock: number[] = [];

    if (preSelectedKunds.length > 0 && mode === 'custom') {
      kundNumbersToBlock = [...preSelectedKunds];
    } else if (mode === 'range') {
      const start = Math.min(rangeStart, rangeEnd);
      const end = Math.max(rangeStart, rangeEnd);

      if (start < 1 || end > EVENT_DETAILS.totalKunds) {
        setErrorMsg(`Range must be between 1 and ${EVENT_DETAILS.totalKunds}`);
        return;
      }
      if (end - start + 1 > 500) {
        setErrorMsg('To prevent accidental bulk lockouts, maximum range limit per action is 500 Kunds.');
        return;
      }

      for (let i = start; i <= end; i++) {
        kundNumbersToBlock.push(i);
      }
    } else if (mode === 'zone') {
      const zoneObj = KUND_ZONES.find((z) => z.id === selectedZone);
      if (zoneObj) {
        for (let i = zoneObj.range[0]; i <= zoneObj.range[1]; i++) {
          kundNumbersToBlock.push(i);
        }
      }
    }

    if (kundNumbersToBlock.length === 0) {
      setErrorMsg('No valid kund numbers selected for blocking.');
      return;
    }

    const res = blockKunds(currentAdmin, {
      kundNumbers: kundNumbersToBlock,
      date: selectedDate,
      session: selectedSession,
      reason: reason.trim() || 'Offline/VIP Reservation',
      offlineFamilyDetails: assignOfflineFamily && offlineDetails.groupName
        ? offlineDetails
        : undefined,
      allBookings,
    });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-200 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-serif">
                {lang === 'hi' ? 'थोक कुंड ब्लॉकिंग एवं ऑफलाइन आरक्षण' : 'Bulk Kund Blocking / Offline Reservation'}
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">
                {selectedDate} · {selectedSession === 'morning' ? 'Morning (8-11 AM)' : 'Afternoon (1-4 PM)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Mode Selector */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Selection Method:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                  mode === 'range' ? 'bg-rose-900 text-white border-rose-950 shadow-2xs' : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                Range (#Start – #End)
              </button>

              <button
                type="button"
                onClick={() => setMode('zone')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                  mode === 'zone' ? 'bg-rose-900 text-white border-rose-950 shadow-2xs' : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                By Zone Enclosure
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                disabled={preSelectedKunds.length === 0}
                className={`py-2 px-3 rounded-xl border text-center font-semibold ${
                  mode === 'custom'
                    ? 'bg-rose-900 text-white border-rose-950 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 disabled:opacity-40'
                }`}
              >
                Selected ({preSelectedKunds.length})
              </button>
            </div>
          </div>

          {/* Range Inputs */}
          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">From Kund #</label>
                <input
                  type="number"
                  min={1}
                  max={EVENT_DETAILS.totalKunds}
                  required
                  value={rangeStart}
                  onChange={(e) => setRangeStart(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">To Kund #</label>
                <input
                  type="number"
                  min={1}
                  max={EVENT_DETAILS.totalKunds}
                  required
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold bg-white"
                />
              </div>
            </div>
          )}

          {/* Zone Selector */}
          {mode === 'zone' && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="block font-semibold text-stone-700 mb-1">Select Zone to Block entirely:</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium"
              >
                {KUND_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id}: {z.name} (#{z.range[0]} – #{z.range[1]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason / Note */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Reservation Reason / Note (Recorded in Audit Trail) *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reserved for VIP Guests / Mathura Ashram Sadhus"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
            />
          </div>

          {/* Optional Assign to Offline Family */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
            <label className="flex items-center gap-2 font-bold text-purple-950 cursor-pointer">
              <input
                type="checkbox"
                checked={assignOfflineFamily}
                onChange={(e) => setAssignOfflineFamily(e.target.checked)}
                className="rounded text-purple-700"
              />
              <span>Attach Offline Group / Dignitary Details (Optional)</span>
            </label>

            {assignOfflineFamily && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Offline Group / Person Name</label>
                  <input
                    type="text"
                    value={offlineDetails.groupName}
                    onChange={(e) => setOfflineDetails({ ...offlineDetails, groupName: e.target.value })}
                    placeholder="e.g. Mahant Ji Seva Mandal"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Contact Phone</label>
                  <input
                    type="tel"
                    value={offlineDetails.contactPhone}
                    onChange={(e) => setOfflineDetails({ ...offlineDetails, contactPhone: e.target.value })}
                    placeholder="9412000000"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Safety Notice */}
          <div className="p-3 rounded-xl bg-amber-50 text-amber-950 border border-amber-200 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Capacity Invariant:</strong> Blocked Kunds are immediately excluded from the online Best-Fit pool. Any Kund with an existing confirmed online devotee will be automatically skipped to protect online bookings.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-purple-300" />
              <span>Execute Seat Blocking</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
