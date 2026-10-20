import React from 'react';
import { X, ArrowRightLeft, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Booking, AllocatedSession } from '../../types';
import { EVENT_DETAILS, getZoneForKund } from '../../data/eventConfig';
import { reassignSessionKund } from '../../services/allocationEngine';

interface ReassignModalProps {
  booking: Booking;
  alloc: AllocatedSession;
  allBookings: Booking[];
  onSuccess: (updatedBookings: Booking[]) => void;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  booking,
  alloc,
  allBookings,
  onSuccess,
  onClose,
  lang,
}) => {
  const [targetKund, setTargetKund] = React.useState<number>(alloc.kundNumber);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetKund === alloc.kundNumber) {
      setErrorMsg('Target Kund is the same as current Kund.');
      return;
    }

    const res = reassignSessionKund(
      booking.id,
      alloc.date,
      alloc.session,
      targetKund,
      allBookings
    );

    if (res.success && res.updatedBookings) {
      onSuccess(res.updatedBookings);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const targetZone = getZoneForKund(targetKund);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-serif">
              {lang === 'hi' ? 'कुंड पुनः आवंटन (Reassign Kund)' : 'Reassign Kund for Family'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleReassign} className="p-6 space-y-4 text-xs">
          
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <div className="text-[10px] text-stone-500 uppercase font-bold">Group Details</div>
            <div className="font-bold text-stone-900 text-sm">{booking.yagyakarta.fullName}</div>
            <div className="text-stone-600">
              {alloc.date} · {alloc.session === 'morning' ? 'Morning 8-11 AM' : 'Afternoon 1-4 PM'}
            </div>
            <div className="text-rose-900 font-bold">
              Current: Kund #{alloc.kundNumber} ({alloc.zone}) · {alloc.participantCount} Devotees
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              {lang === 'hi' ? 'नया लक्षित कुंड नंबर दर्ज करें (1–2151):' : 'Enter Target Kund Number (1 to 2151):'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={EVENT_DETAILS.totalKunds}
                required
                value={targetKund}
                onChange={(e) => {
                  setTargetKund(parseInt(e.target.value, 10) || 1);
                  setErrorMsg(null);
                }}
                className="w-32 px-3 py-2 text-sm font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
              />
              <span className="text-stone-600 font-semibold">
                → {targetZone.id} ({targetZone.name})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              System safety check will verify that target Kund has at least {alloc.participantCount} remaining seats so the family is NEVER split.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{errorMsg}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 font-bold shadow-xs cursor-pointer"
            >
              Verify & Reassign
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
