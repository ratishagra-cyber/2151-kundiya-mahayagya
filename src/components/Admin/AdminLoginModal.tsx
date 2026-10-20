import React from 'react';
import { Shield, KeyRound, X, AlertCircle, Phone, Mail, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { AdminUser } from '../../types';
import { authenticateAdmin, getAdminUsers } from '../../services/adminService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
  lang: 'en' | 'hi';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
}) => {
  const [loginMethod, setLoginMethod] = React.useState<'credentials' | 'otp'>('credentials');
  
  // Credentials state
  const [emailOrMobile, setEmailOrMobile] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  // OTP state
  const [otpMobile, setOtpMobile] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [enteredOtp, setEnteredOtp] = React.useState('');
  const [simulatedOtp, setSimulatedOtp] = React.useState('122151');
  
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = authenticateAdmin(emailOrMobile, password);
    if (result.success && result.admin) {
      onLoginSuccess(result.admin);
      onClose();
    } else {
      setError(result.error || (lang === 'hi' ? 'अमान्य लॉगिन विवरण। पुनः प्रयास करें।' : 'Invalid credentials.'));
    }
  };

  const handleSendOtp = () => {
    const cleaned = otpMobile.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError(lang === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const admins = getAdminUsers();
    const found = admins.find((a) => a.mobile.replace(/\D/g, '') === cleaned);
    if (!found) {
      setError(lang === 'hi' ? 'यह मोबाइल नंबर किसी पंजीकृत व्यवस्थापक से सम्बद्ध नहीं है।' : 'No admin found with this registered mobile number.');
      return;
    }

    setError(null);
    setOtpSent(true);
    setSimulatedOtp('122151'); // Standard demo OTP
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enteredOtp.trim() !== simulatedOtp) {
      setError(lang === 'hi' ? 'अमान्य ओटीपी कोड। कृपया सही कोड दर्ज करें।' : 'Invalid OTP code. For demo, use 122151.');
      return;
    }

    const admins = getAdminUsers();
    const cleaned = otpMobile.replace(/\D/g, '');
    const found = admins.find((a) => a.mobile.replace(/\D/g, '') === cleaned);

    if (found) {
      onLoginSuccess(found);
      onClose();
    } else {
      setError('Admin verification failed.');
    }
  };

  const fillQuickDemo = (role: 'super_admin' | 'operator') => {
    if (role === 'super_admin') {
      setEmailOrMobile('superadmin@mahayagya.org');
      setPassword('superadmin2026');
      setOtpMobile('9820012345');
    } else {
      setEmailOrMobile('operator@mahayagya.org');
      setPassword('operator2026');
      setOtpMobile('9412054321');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-900 flex items-center justify-center text-amber-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-serif">
                {lang === 'hi' ? 'व्यवस्थापक एवं प्रचालक लॉगिन' : 'Authorized Admin & Operator Login'}
              </h3>
              <p className="text-[10px] text-stone-400">2,151 Kund Mahayagya Operations Console</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 bg-stone-100 border-b border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('credentials');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMethod === 'credentials'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-stone-600" />
            <span>Email + Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMethod('otp');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMethod === 'otp'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-stone-600" />
            <span>Mobile + OTP</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Quick Demo Pre-Fill Chips */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <div className="text-[10px] font-bold text-amber-950 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>1-Tap Demo Role Login:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('super_admin')}
                className="px-2.5 py-1 rounded-lg bg-rose-900 text-amber-100 font-semibold text-[11px] shadow-2xs hover:bg-rose-950 transition-colors cursor-pointer"
              >
                Super Admin (Acharya Somnath)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('operator')}
                className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-100 font-semibold text-[11px] shadow-2xs hover:bg-stone-900 transition-colors cursor-pointer"
              >
                Operator (Vipul Verma)
              </button>
            </div>
          </div>

          {/* METHOD 1: EMAIL + PASSWORD */}
          {loginMethod === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'hi' ? 'ईमेल अथवा अधिकृत मोबाइल:' : 'Admin Email or Registered Mobile:'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={emailOrMobile}
                  onChange={(e) => {
                    setEmailOrMobile(e.target.value);
                    setError(null);
                  }}
                  placeholder="superadmin@mahayagya.org"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'hi' ? 'पासवर्ड:' : 'Password:'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
                  className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'hi' ? 'प्रवेश करें' : 'Sign In'}</span>
                </button>
              </div>
            </form>
          )}

          {/* METHOD 2: MOBILE + OTP */}
          {loginMethod === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'hi' ? 'अधिकृत मोबाइल नंबर:' : 'Registered Admin Mobile Number:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={otpMobile}
                    onChange={(e) => {
                      setOtpMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError(null);
                    }}
                    placeholder="9820012345"
                    className="flex-1 px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-[11px] flex items-center justify-between">
                    <span>Demo OTP sent to +91 {otpMobile}</span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-400">
                      Code: {simulatedOtp}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'hi' ? '6-अंकीय ओटीपी दर्ज करें:' : 'Enter 6-Digit OTP:'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={enteredOtp}
                      onChange={(e) => {
                        setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setError(null);
                      }}
                      placeholder="122151"
                      className="w-full px-3 py-2 text-base font-mono font-bold tracking-widest text-center rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
                  disabled={!otpSent}
                  className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'hi' ? 'ओटीपी सत्यापित करें' : 'Verify & Enter'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
