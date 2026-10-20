import React from 'react';
import { History, Shield, Lock, Unlock, ArrowRightLeft, UserPlus, Trash2, Download } from 'lucide-react';
import { AdminAuditLog } from '../../types';
import { getAuditLogs } from '../../services/adminService';

interface AuditLogsTabProps {
  lang: 'en' | 'hi';
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ lang }) => {
  const [logs, setLogs] = React.useState<AdminAuditLog[]>(getAuditLogs());

  const getActionIcon = (action: AdminAuditLog['action']) => {
    switch (action) {
      case 'BLOCK_KUND':
      case 'BULK_BLOCK':
        return <Lock className="w-3.5 h-3.5 text-purple-600" />;
      case 'UNBLOCK_KUND':
        return <Unlock className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REASSIGN_KUND':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />;
      case 'ADD_ADMIN':
        return <UserPlus className="w-3.5 h-3.5 text-rose-600" />;
      case 'REMOVE_ADMIN':
        return <Trash2 className="w-3.5 h-3.5 text-stone-500" />;
      case 'EXPORT_DATA':
        return <Download className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-rose-800" />
          <h3 className="font-bold text-sm text-stone-900">
            {lang === 'hi' ? 'प्रणाली ऑडिट ट्रेल (सभी क्रियाएं अभिलिखित)' : 'System Audit Trail (Permanent Action Log)'}
          </h3>
        </div>
        <span className="text-stone-500 font-mono text-[11px]">{logs.length} logged events</span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs divide-y divide-stone-100">
        {logs.map((log) => (
          <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-stone-100 mt-0.5 shrink-0">
                {getActionIcon(log.action)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">{log.action.replace('_', ' ')}</span>
                  <span className="text-stone-500">by</span>
                  <span className="font-semibold text-rose-950">{log.adminName}</span>
                  <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[10px] uppercase font-mono font-bold">
                    {log.adminRole}
                  </span>
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">{log.details}</p>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 font-mono whitespace-nowrap self-end sm:self-auto">
              {new Date(log.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
