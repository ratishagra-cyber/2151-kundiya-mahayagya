import React from 'react';
import { X, User, Phone, MapPin, Calendar, Clock, Flame, Users, Copy, Check, ShieldCheck, HeartHandshake } from 'lucide-react';

interface BookingDetailModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

interface BookingDetailData {
  id: string;
  bookingCode: string;
  status: string;
  createdAt: string;
  yagyakarta: {
    name: string;
    fullName: string;
    primaryMobile: string;
    secondaryMobile?: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    gotra: string;
  };
  participants: Array<{
    id: string;
    name: string;
    age: number | null;
    gender: string;
    relationship: string;
    mobile?: string;
    isYagyakarta?: boolean;
  }>;
  allocations: Array<{
    id: string;
    date: string;
    session: string;
    kundNumber: number;
    sector: string;
    kundName: string;
    participantCount: number;
  }>;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  lang = 'hi',
}) => {
  const [data, setData] = React.useState<BookingDetailData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen || !bookingId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/booking-detail?bookingId=${encodeURIComponent(bookingId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          if (json.success && json.booking) {
            setData(json.booking);
          } else {
            setError(json.error || 'Booking details not found');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load booking details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (data?.bookingCode) {
      navigator.clipboard.writeText(data.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-stone-900 text-stone-100 px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-amber-400/90 font-medium">
                {lang === 'hi' ? 'यजमान पंजीकरण विवरण' : 'Booking Details'}
              </div>
              <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <span>{bookingId}</span>
                {data?.bookingCode && (
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                    title="Copy Booking Code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-stone-800">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-stone-500 text-xs font-medium">
                {lang === 'hi' ? 'पंजीकरण डेटा लोड हो रहा है...' : 'Loading booking details...'}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <div className="font-bold mb-1">
                {lang === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error Loading Details'}
              </div>
              <div>{error}</div>
            </div>
          )}

          {!loading && data && (
            <>
              {/* 1. Yagyakarta Details Card */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'hi' ? 'यज्ञकर्ता (परिवार समन्वयक)' : 'Yagyakarta (Coordinator)'}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                    {data.status || 'Confirmed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 block">{lang === 'hi' ? 'पूरा नाम:' : 'Full Name:'}</span>
                    <span className="font-semibold text-stone-900 text-sm">{data.yagyakarta.name}</span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">{lang === 'hi' ? 'प्राथमिक मोबाइल:' : 'Primary Mobile:'}</span>
                    <a 
                      href={`tel:${data.yagyakarta.primaryMobile}`}
                      className="font-mono font-semibold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{data.yagyakarta.primaryMobile}</span>
                    </a>
                  </div>

                  {data.yagyakarta.secondaryMobile && (
                    <div>
                      <span className="text-stone-500 block">{lang === 'hi' ? 'वैकल्पिक मोबाइल:' : 'Secondary Mobile:'}</span>
                      <a 
                        href={`tel:${data.yagyakarta.secondaryMobile}`}
                        className="font-mono text-stone-700 hover:underline"
                      >
                        {data.yagyakarta.secondaryMobile}
                      </a>
                    </div>
                  )}

                  {data.yagyakarta.email && (
                    <div>
                      <span className="text-stone-500 block">{lang === 'hi' ? 'ईमेल:' : 'Email:'}</span>
                      <span className="font-mono text-stone-800">{data.yagyakarta.email}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-stone-500 block">{lang === 'hi' ? 'शहर / राज्य:' : 'City / State:'}</span>
                    <span className="font-medium text-stone-900">
                      {data.yagyakarta.city}, {data.yagyakarta.state}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">{lang === 'hi' ? 'गोत्र:' : 'Gotra:'}</span>
                    <span className="font-medium text-stone-800">{data.yagyakarta.gotra || 'उपलब्ध नहीं'}</span>
                  </div>
                </div>

                {/* Mandatory Address Highlight */}
                <div className="pt-2 border-t border-stone-200/80 text-xs">
                  <div className="flex items-start gap-1.5 text-stone-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-stone-500 block">{lang === 'hi' ? 'स्थाई / निवास का पता:' : 'Residential Address:'}</span>
                      <span className="font-medium text-stone-900">{data.yagyakarta.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. List of Participants */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'hi' ? 'पंजीकृत परिवार के सदस्य' : 'Registered Family Members'}</span>
                  </div>
                  <span className="text-xs font-mono text-stone-500">
                    {data.participants.length} {lang === 'hi' ? 'श्रद्धालु' : 'Devotees'}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                  {data.participants.map((p, idx) => (
                    <div key={p.id || idx} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 font-mono flex items-center justify-center text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isYagyakarta && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                                {lang === 'hi' ? 'मुख्य यजमान' : 'Lead'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {p.relationship}
                            {p.age ? ` · ${p.age} वर्ष` : ''}
                            {p.gender ? ` · ${p.gender === 'female' ? 'महिला' : 'पुरुष'}` : ''}
                          </div>
                        </div>
                      </div>

                      {p.mobile && (
                        <div className="font-mono text-[11px] text-stone-600">
                          {p.mobile}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Allocated Sessions with Kund Numbers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>{lang === 'hi' ? 'आवंटित सत्र एवं कुण्ड विवरण' : 'Allocated Sessions & Kunds'}</span>
                  </div>
                  <span className="text-xs font-mono text-stone-500">
                    {data.allocations.length} {lang === 'hi' ? 'सत्र' : 'Sessions'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.allocations.map((alloc, idx) => (
                    <div 
                      key={alloc.id || idx} 
                      className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          <span>{formatDate(alloc.date)}</span>
                        </div>
                        <span className="font-mono px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] uppercase font-semibold">
                          {alloc.session === 'morning' ? '☀️ प्रातः (8–11)' : '🌅 सायं (1–4)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-600" />
                          <span className="font-extrabold text-stone-900 text-sm font-mono">
                            कुण्ड #{alloc.kundNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-600">
                          {alloc.participantCount || data.participants.length} {lang === 'hi' ? 'स्थान आवंटित' : 'devotees'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata footnote */}
              <div className="text-[11px] text-stone-400 font-mono flex items-center justify-between pt-2 border-t border-stone-200">
                <span>पंजीकरण समय: {data.createdAt ? new Date(data.createdAt).toLocaleString('hi-IN') : 'N/A'}</span>
                <span>पारिवारिक अखंडता: सुरक्षित</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-5 sm:px-6 py-3 border-t border-stone-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
