import React from 'react';
import { X, Flame, Users, Phone, MapPin, ShieldCheck, Lock, Unlock, AlertCircle } from 'lucide-react';
import { KundSessionOccupancy, AdminUser } from '../../types';
import { getZoneForKund } from '../../data/eventConfig';
import { unblockKund } from '../../services/adminService';

interface KundInspectorDrawerProps {
  kundData: KundSessionOccupancy | null;
  currentAdmin?: AdminUser | null;
  onClose: () => void;
  onBlockSingle?: (kundNumber: number) => void;
  onKundStateChanged?: () => void;
  lang: 'en' | 'hi';
}

export const KundInspectorDrawer: React.FC<KundInspectorDrawerProps> = ({
  kundData,
  currentAdmin,
  onClose,
  onBlockSingle,
  onKundStateChanged,
  lang,
}) => {
  if (!kundData) return null;

  const { name: zoneName } = getZoneForKund(kundData.kundNumber);
  const remainingSeats = kundData.isBlocked ? 0 : kundData.capacity - kundData.occupiedSeats;

  const handleUnblock = () => {
    if (!currentAdmin) return;
    if (window.confirm(`Unblock Kund #${kundData.kundNumber} and restore it to the online Best-Fit pool?`)) {
      unblockKund(currentAdmin, kundData.kundNumber, kundData.date, kundData.session);
      if (onKundStateChanged) onKundStateChanged();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              kundData.isBlocked
                ? 'bg-purple-900/60 border border-purple-500/40 text-purple-200'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            }`}>
              {kundData.isBlocked ? <Lock className="w-4 h-4" /> : <Flame className="w-5 h-5 fill-amber-300/30" />}
            </div>
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {kundData.isBlocked ? 'Blocked Kund Details' : 'Physical Kund Inspector'}
              </div>
              <h3 className="text-lg font-bold font-serif text-white">
                Kund {kundData.kundNumber} · {kundData.zone}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-500">Enclosure: </span>
            <span className="font-semibold text-stone-900">{zoneName}</span>
          </div>
          <div>
            <span
              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                kundData.isBlocked
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : kundData.occupiedSeats === 8
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : kundData.occupiedSeats > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-700 border border-stone-300'
              }`}
            >
              {kundData.isBlocked ? '🔒 Blocked (Offline)' : `${kundData.occupiedSeats}/8 Occupied`}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* BLOCKED STATE INSPECTION */}
          {kundData.isBlocked && kundData.blockRecord ? (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                <Lock className="w-4 h-4 text-purple-700" />
                <span>Offline / VIP Reservation Active</span>
              </div>

              <div className="space-y-1.5 text-stone-700">
                <div>
                  <span className="text-stone-500">Reason / Note: </span>
                  <span className="font-semibold text-stone-900">{kundData.blockRecord.reason || 'Offline Block'}</span>
                </div>
                <div>
                  <span className="text-stone-500">Blocked By: </span>
                  <span className="font-semibold text-stone-900">{kundData.blockRecord.blockedByAdminName}</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Timestamp: {new Date(kundData.blockRecord.blockedAt).toLocaleString()}
                </div>

                {kundData.blockRecord.offlineFamilyDetails && (
                  <div className="pt-2 border-t border-purple-200 mt-2">
                    <div className="text-[10px] font-bold text-purple-900 uppercase">Assigned Offline Dignitary:</div>
                    <div className="font-bold text-stone-900">{kundData.blockRecord.offlineFamilyDetails.groupName}</div>
                    {kundData.blockRecord.offlineFamilyDetails.contactPhone && (
                      <div className="text-stone-600 font-mono">+91 {kundData.blockRecord.offlineFamilyDetails.contactPhone}</div>
                    )}
                  </div>
                )}
              </div>

              {currentAdmin && (
                <div className="pt-2">
                  <button
                    onClick={handleUnblock}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unblock &amp; Restore to Online Pool</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span>Kund Seating Capacity</span>
                  <span className="font-mono">{remainingSeats} seats available</span>
                </div>
                <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all ${
                      kundData.occupiedSeats === 8
                        ? 'bg-rose-700'
                        : kundData.occupiedSeats > 0
                        ? 'bg-amber-500'
                        : 'bg-stone-300'
                    }`}
                    style={{ width: `${(kundData.occupiedSeats / 8) * 100}%` }}
                  />
                </div>
              </div>

              {/* Seated Devotee Groups */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Seated Devotee Groups</span>
                  <span className="text-[11px] text-stone-500 font-normal">
                    {kundData.bookings.length} family group(s)
                  </span>
                </div>

                {kundData.bookings.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-stone-300 text-center space-y-3 text-stone-500 text-xs">
                    <Users className="w-6 h-6 mx-auto text-stone-400" />
                    <div>
                      <p className="font-semibold text-stone-700">Kund is Currently Pristine Empty (0/8)</p>
                      <p className="text-[11px]">Ready for automated best-fit allocation or offline blocking.</p>
                    </div>

                    {currentAdmin && onBlockSingle && (
                      <button
                        onClick={() => {
                          onBlockSingle(kundData.kundNumber);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold border border-purple-300 text-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Block Kund {kundData.kundNumber} for Offline/VIP</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kundData.bookings.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{b.yagyakartaName}</div>
                            <div className="text-stone-500 text-[11px] font-mono">
                              Booking ID: {b.bookingId} · {b.city}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 font-mono font-bold text-stone-800 text-[11px]">
                            {b.participantCount} Devotees
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-stone-600 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>+91 {b.contactNumber}</span>
                        </div>

                        <div className="pt-2 border-t border-stone-100">
                          <div className="text-[10px] text-stone-400 uppercase font-semibold mb-1">
                            Seated Members:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {b.participantNames.map((name, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-700 text-[11px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Allocation Invariant Note */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Family Integrity Invariant</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Devotees seated in this Kund will never be split across sessions. All actions are attributed to administrator <strong>{currentAdmin?.name || 'Administrator'}</strong>.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
