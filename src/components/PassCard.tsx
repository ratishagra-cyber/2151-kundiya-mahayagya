import React from 'react';
import QRCode from 'qrcode';
import { Booking } from '../types';
import { EVENT_DETAILS } from '../data/eventConfig';
import { findSectorByKund } from '../data/zoneConfig';
import { HavanKundIcon } from './Common/HavanKundIcon';
import { Printer, Download, Share2, CheckCircle2, ArrowLeft, ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';

interface PassCardProps {
  booking: Booking;
  onBackToHome: () => void;
  lang: 'en' | 'hi';
}

export const PassCard: React.FC<PassCardProps> = ({
  booking,
  onBackToHome,
  lang,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');

  // Collect unique allocated kund numbers, strictly parsed as numbers
  const uniqueKunds = React.useMemo(() => {
    const numbers = (booking.allocations || [])
      .map((a) => Number(a.kundNumber))
      .filter((n) => !isNaN(n) && n > 0);
    return Array.from(new Set(numbers));
  }, [booking.allocations]);

  // Generate authentic QR code encoding the exact booking code for Gate Admission
  React.useEffect(() => {
    const bookingCode = booking.id || 'MY-2026-0000';
    QRCode.toDataURL(bookingCode, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [booking.id]);

  // Format zone and sector description for pass
  const getZoneSectorDisplay = (kNum: number) => {
    const match = findSectorByKund(kNum);
    if (!match) return '';
    return lang === 'hi'
      ? `${match.zone.shortName} (${match.sector.nameHi})`
      : `${match.zone.shortName} (${match.sector.name})`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 300);
  };

  const handleShare = () => {
    const kundsText = uniqueKunds.map((k) => `Kund ${k}${getZoneSectorDisplay(k) ? ` [${getZoneSectorDisplay(k)}]` : ''}`).join(', ');
    const text = `*2151 Kundiya Mahayagya Agra - Yagya Pravesh Patra*\nBooking Code: ${booking.id}\nYagyakarta: ${booking.yagyakarta.fullName}\nAllocated: ${kundsText}\nDevotees: ${booking.participants.length}\nAddress: ${booking.yagyakarta.address || ''}, ${booking.yagyakarta.city}\nVenue: ${EVENT_DETAILS.venue}\nDates: 14–21 Dec 2026`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      
      {/* 1. Core Success Announcement */}
      <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 shadow-xs print:hidden">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-sm">
            {lang === 'hi' ? 'पंजीकरण एवं कुंड आवंटन सफलतापूर्वक पूर्ण हुआ!' : 'Registration & Kund Allocation Confirmed!'}
          </div>
          <p className="text-emerald-900 leading-relaxed text-[11px]">
            {lang === 'hi'
              ? `आपके परिवार (${booking.participants.length} सदस्य) को ${uniqueKunds.map((k) => `कुण्ड ${k}`).join(', ')} पर एक साथ स्थान आवंटित किया गया है। पुष्टि एसएमएस +91 ${booking.yagyakarta.primaryMobile} पर प्रेषित हो चुका है।`
              : `Your group of ${booking.participants.length} devotees is allocated together at ${uniqueKunds.map((k) => `Kund ${k}`).join(', ')}. SMS confirmation dispatched to +91 ${booking.yagyakarta.primaryMobile}.`}
          </p>
        </div>
      </div>

      {/* 2. Prominent Action Bar (Print, Download PDF, Share) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs print:hidden">
        <button
          onClick={onBackToHome}
          className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (lang === 'hi' ? 'शेयर करें' : 'Share')}</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Preparing...' : (lang === 'hi' ? 'PDF डाउनलोड' : 'Download PDF')}</span>
          </button>

          {/* Print E-Pass Button */}
          <button
            onClick={handlePrint}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'प्रवेश पत्र प्रिंट करें' : 'Print E-Pass'}</span>
          </button>
        </div>
      </div>

      {/* 3. The Digital Yagya Pravesh Patra */}
      <div className="bg-white rounded-3xl border-2 border-stone-300 shadow-xl overflow-hidden print:border-black print:shadow-none">
        
        {/* Pass Header */}
        <div className="bg-rose-900 text-amber-50 px-6 py-5 border-b-2 border-amber-400">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <HavanKundIcon status="selected" size={30} />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest">
                  {lang === 'hi' ? '।। ॐ नमः शिवाय ।।' : 'Devotional E-Pass · Yagya Pravesh Patra'}
                </div>
                <h1 className="text-lg font-bold font-serif text-white">
                  {EVENT_DETAILS.titleHindi}
                </h1>
                <p className="text-xs text-amber-200">
                  {EVENT_DETAILS.venue}
                </p>
              </div>
            </div>

            {/* Booking Code Badge */}
            <div className="self-start sm:self-auto bg-black/30 px-3.5 py-1.5 rounded-xl border border-amber-400/30 text-right">
              <div className="text-[9px] text-amber-300 uppercase font-semibold">Booking Code</div>
              <div className="text-sm font-extrabold font-mono text-white tracking-wider">{booking.id}</div>
            </div>
          </div>
        </div>

        {/* Primary Highlight: Allocated Physical Kund & Zone/Sector (No Divya Sanctum prefix, No #) */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                {lang === 'hi' ? 'आवंटित भौतिक कुण्ड' : 'Allocated Physical Kund'}
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-rose-950 font-serif">
                  {uniqueKunds.length > 0
                    ? uniqueKunds.map((k) => (lang === 'hi' ? `कुण्ड ${k}` : `Kund ${k}`)).join(', ')
                    : (lang === 'hi' ? 'कुण्ड आवंटित' : 'Kund Allocated')}
                </span>

                {/* Optional Zone & Sector badge if available */}
                {uniqueKunds.length > 0 && uniqueKunds[0] && getZoneSectorDisplay(uniqueKunds[0]) && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-900 text-amber-100">
                    {uniqueKunds.map((k) => getZoneSectorDisplay(k)).filter(Boolean).join(' / ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {lang === 'hi'
                  ? 'परिवार के सभी सदस्य इसी कुण्ड पर एक साथ बैठेंगे। कृपया सत्र से 45 मिनट पूर्व पहुंचें।'
                  : 'All family members seated together at this Kund. Arrive 45 mins prior.'}
              </p>
            </div>

            <div className="sm:border-l sm:border-amber-200 sm:pl-5 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                {lang === 'hi' ? 'कुल साधक' : 'Devotee Group'}
              </div>
              <div className="text-2xl font-extrabold text-stone-900 font-mono">
                {booking.participants.length}{' '}
                <span className="text-xs font-sans text-stone-500 font-normal">
                  / 8 max per kund
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Left: Coordinator & Members */}
            <div className="md:col-span-2 space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {lang === 'hi' ? 'मुख्य समन्वयक (यज्ञकर्ता)' : 'Yagyakarta / Coordinator'}
                </div>
                <div className="text-sm font-bold text-stone-900">{booking.yagyakarta.fullName}</div>
                <div className="text-stone-600 font-mono">
                  +91 {booking.yagyakarta.primaryMobile}
                  {booking.yagyakarta.secondaryMobile ? ` · Alt: +91 ${booking.yagyakarta.secondaryMobile}` : ''}
                </div>
                
                {/* MANDATORY ADDRESS FIELD ON PASS */}
                <div className="text-stone-700 bg-white p-2 rounded-xl border border-stone-200/90 text-[11px] leading-snug">
                  <span className="font-bold text-stone-900">{lang === 'hi' ? 'आवासीय पता: ' : 'Address: '}</span>
                  <span>{booking.yagyakarta.address || (lang === 'hi' ? 'पंजीकृत पता' : 'Registered Address')}</span>
                </div>

                <div className="text-stone-600">
                  {booking.yagyakarta.city}, {booking.yagyakarta.state} {booking.yagyakarta.pincode ? `- ${booking.yagyakarta.pincode}` : ''}
                  {booking.yagyakarta.gotra ? ` · Gotra: ${booking.yagyakarta.gotra}` : ''}
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  {lang === 'hi' ? 'उपस्थित साधक सदस्य' : 'Devotees Seated Together'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {booking.participants.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-white border border-stone-200 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-stone-900">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-500">
                        {p.relationship.split('(')[0].trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Authentic Scannable QR Code for Gate Attendance */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2.5">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-stone-200">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`Admission QR Code for ${booking.id}`}
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-stone-100 text-stone-400 font-mono text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Gate Entry Pass</div>
                <div className="text-[11px] text-stone-900 font-bold font-mono">{booking.id}</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Gate Scannable</span>
                </div>
              </div>
            </div>

          </div>

          {/* Session Timetable (Plain numbers, no #) */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider">
              <span>{lang === 'hi' ? 'परिवार सत्र समय सारिणी' : 'Family Session Timetable'}</span>
              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-semibold normal-case">
                {lang === 'hi' ? `सभी ${booking.participants.length} सदस्य एक साथ` : `All ${booking.participants.length} members together`}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {booking.allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900">{alloc.date}</span>
                    <span className="text-stone-600 ml-1.5 font-medium">
                      ({alloc.session === 'morning' ? '☀️ Morning 8-11 AM' : '🌅 Afternoon 1-4 PM'})
                    </span>
                  </div>
                  <div className="text-right font-mono font-bold text-rose-900">
                    {lang === 'hi' ? 'कुण्ड ' : 'Kund '}{alloc.kundNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-stone-700 space-y-1">
            <div className="font-bold text-amber-950">
              {lang === 'hi' ? 'प्रवेश एवं यज्ञशाला निर्देश:' : 'Entry Guidelines:'}
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[11px]">
              <li>सत्र प्रारंभ से 45 मिनट पूर्व अपने निर्धारित कुंड पर स्थान ग्रहण करें।</li>
              <li>पारंपरिक परिधान (धोती-कुर्ता / पीला-लाल वस्त्र / साड़ी) अनिवार्य है।</li>
              <li>हवन सामग्री एवं समिधा प्रत्येक कुंड पर समिति द्वारा निःशुल्क उपलब्ध रहेगी।</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-2.5 text-center text-[10px] text-stone-500">
          Shri Pitambara Mahayagya Samiti, Agra · Helpline: +91 94120 12151
        </div>
      </div>

    </div>
  );
};
