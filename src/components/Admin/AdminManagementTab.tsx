import React from 'react';
import { UserCheck, UserPlus, Trash2, Shield, ShieldAlert, Key, Phone, Mail, Clock } from 'lucide-react';
import { AdminUser, AdminRole } from '../../types';
import { getAdminUsers, addAdminUser, removeAdminUser } from '../../services/adminService';

interface AdminManagementTabProps {
  currentAdmin: AdminUser;
  onAdminsUpdated: (admins: AdminUser[]) => void;
  lang: 'en' | 'hi';
}

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({
  currentAdmin,
  onAdminsUpdated,
  lang,
}) => {
  const [admins, setAdmins] = React.useState<AdminUser[]>(getAdminUsers());
  const [isAdding, setIsAdding] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    mobile: '',
    role: 'operator' as AdminRole,
    password: '',
  });
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = currentAdmin.role === 'super_admin';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setStatusMessage({ type: 'error', text: 'All required fields must be filled.' });
      return;
    }

    const res = addAdminUser(currentAdmin, formData);
    if (res.success && res.admins) {
      setAdmins(res.admins);
      onAdminsUpdated(res.admins);
      setIsAdding(false);
      setFormData({ name: '', email: '', mobile: '', role: 'operator', password: '' });
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleRemove = (adminId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove administrator "${name}"?`)) return;

    const res = removeAdminUser(currentAdmin, adminId);
    if (res.success && res.admins) {
      setAdmins(res.admins);
      onAdminsUpdated(res.admins);
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Role Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-800" />
            <h2 className="text-base font-bold text-stone-900">
              {lang === 'hi' ? 'व्यवस्थापक एवं प्रचालक नियंत्रण' : 'Admin & Operator Access Control'}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Role-Based Access Control (RBAC): Super Admins can add/remove staff; Operators handle daily seating operations.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold bg-rose-900 hover:bg-rose-950 text-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAdding ? 'Cancel' : '+ Add New Admin / Operator'}</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Operator Mode: Read-Only User List</span>
          </div>
        )}
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Add New Admin Form (Super Admin Only) */}
      {isAdding && isSuperAdmin && (
        <form onSubmit={handleAddSubmit} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 text-xs animate-in fade-in duration-150">
          <div className="font-bold text-sm text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-rose-800" />
            <span>Create New Event Administrator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Radheshyam Tiwari"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tiwari@mahayagya.org"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Mobile Number (10 digits) *</label>
              <input
                type="tel"
                maxLength={10}
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="9412012345"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:border-amber-600"
              >
                <option value="operator">Operator (Seat Blocking & Booking Operations)</option>
                <option value="super_admin">Super Admin (Full Access & User Management)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 font-bold shadow-xs cursor-pointer"
            >
              Save Administrator
            </button>
          </div>
        </form>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-100 text-xs font-bold text-stone-800 flex items-center justify-between">
          <span>Active System Administrators ({admins.length})</span>
          <span className="text-[11px] text-stone-500 font-normal">All administrative operations are permanently logged</span>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {admins.map((admin) => {
            const isSelf = admin.id === currentAdmin.id;
            return (
              <div key={admin.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    admin.role === 'super_admin' ? 'bg-rose-900 text-amber-200' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {admin.role === 'super_admin' ? 'SA' : 'OP'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{admin.name}</span>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-stone-500 text-[11px] flex flex-wrap items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{admin.email}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>+91 {admin.mobile}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    admin.role === 'super_admin'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-stone-100 text-stone-800 border border-stone-200'
                  }`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Operator'}
                  </span>

                  {isSuperAdmin && !isSelf && (
                    <button
                      onClick={() => handleRemove(admin.id, admin.name)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Administrator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
