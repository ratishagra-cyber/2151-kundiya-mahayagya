import React from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Users, 
  MapPin, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Flame,
  ArrowRight,
  QrCode,
  XCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { HavanKundIcon } from '../Common/HavanKundIcon';
import { EVENT_DAYS } from '../../data/eventConfig';

interface AttendanceScannerProps {
  currentDate?: string;
  currentSession?: string;
  operatorName?: string;
  lang?: 'en' | 'hi';
}

interface ScanResult {
  yagyakartaName: string;
  bookingCode: string;
  kundNumber: number | null;
  attendeeCount: number;
  city?: string;
  address?: string;
  primaryMobile?: string;
  status: 'admitted' | 'already_admitted';
  scannedAt: string;
  date: string;
  session: string;
}

interface ScanRejection {
  type: 'already_marked' | 'not_found' | 'error';
  title: string;
  message: string;
  bookingCode: string;
  attendee?: ScanResult;
}

interface RecentScanItem {
  id: string;
  bookingCode: string;
  yagyakartaName: string;
  primaryMobile: string;
  city: string;
  kundNumber: number | null;
  attendeeCount: number;
  scannedAt: string;
  scannedBy: string;
  status: string;
}

export const AttendanceScanner: React.FC<AttendanceScannerProps> = ({
  currentDate = '2026-12-14',
  currentSession = 'morning',
  operatorName = 'Gate Operator',
  lang = 'hi',
}) => {
  const [selectedDate, setSelectedDate] = React.useState<string>(currentDate);
  const [selectedSession, setSelectedSession] = React.useState<string>(currentSession);
  const [manualCode, setManualCode] = React.useState<string>('');
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  
  // Feedback states
  const [lastScanSuccess, setLastScanSuccess] = React.useState<ScanResult | null>(null);
  const [lastScanRejection, setLastScanRejection] = React.useState<ScanRejection | null>(null);

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = React.useState<boolean>(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = React.useRef<number | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const manualInputRef = React.useRef<HTMLInputElement | null>(null);
  const isCooldownRef = React.useRef<boolean>(false);

  // Recent attendance logs
  const [recentScans, setRecentScans] = React.useState<RecentScanItem[]>([]);
  const [summary, setSummary] = React.useState<{ total_groups: number; total_devotees: number }>({
    total_groups: 0,
    total_devotees: 0,
  });
  const [loadingList, setLoadingList] = React.useState<boolean>(false);

  // Fetch recent attendance logs
  const fetchAttendanceLogs = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}&session=${selectedSession}`);
      const data = await res.json();
      if (data && data.success) {
        setRecentScans(data.recentScans || []);
        if (data.summary) {
          setSummary({
            total_groups: Number(data.summary.total_groups) || 0,
            total_devotees: Number(data.summary.total_devotees) || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching attendance logs:', err);
    } finally {
      setLoadingList(false);
    }
  }, [selectedDate, selectedSession]);

  React.useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  // Reset to scan next pass immediately
  const handleReadyForNextPass = () => {
    setLastScanSuccess(null);
    setLastScanRejection(null);
    setManualCode('');
    isCooldownRef.current = false;
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 50);
  };

  // Submit booking code for admittance verification
  const handleVerifyAdmission = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    setIsVerifying(true);
    setLastScanSuccess(null);
    setLastScanRejection(null);

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode: cleanCode,
          date: selectedDate,
          session: selectedSession,
          scannedBy: operatorName,
        }),
      });

      const data = await res.json();

      if (res.ok && data && data.success && data.attendee) {
        // SUCCESS: Mark admitted
        setLastScanSuccess({
          ...data.attendee,
          status: 'admitted',
        });
        setLastScanRejection(null);
        setManualCode('');
        fetchAttendanceLogs();
      } else if (res.status === 409 || data?.alreadyMarked) {
        // REJECTED: Already marked for this session
        setLastScanRejection({
          type: 'already_marked',
          title: lang === 'hi' ? 'अस्वीकृत: उपस्थिति पहले ही दर्ज हो चुकी है' : 'Rejected: Already Marked For This Session',
          message: data?.error || (lang === 'hi'
            ? `बुकिंग "${cleanCode}" की उपस्थिति इस सत्र के लिए पहले ही दर्ज की जा चुकी है।`
            : `Booking "${cleanCode}" has already been marked attended for this session.`),
          bookingCode: cleanCode,
          attendee: data?.attendee || null,
        });
        setLastScanSuccess(null);
        setManualCode('');
      } else if (res.status === 404) {
        // REJECTED: Booking not found
        setLastScanRejection({
          type: 'not_found',
          title: lang === 'hi' ? 'अस्वीकृत: बुकिंग नहीं मिली' : 'Rejected: Booking Not Found',
          message: data?.error || (lang === 'hi'
            ? `बुकिंग कोड "${cleanCode}" का कोई रिकॉर्ड नहीं मिला। कृपया कोड पुनः जांचें।`
            : `No booking record found for code "${cleanCode}". Please verify code.`),
          bookingCode: cleanCode,
        });
        setLastScanSuccess(null);
      } else {
        // REJECTED: Other error
        setLastScanRejection({
          type: 'error',
          title: lang === 'hi' ? 'अस्वीकृत: सत्यापन विफल' : 'Rejected: Verification Error',
          message: data?.error || (lang === 'hi' ? 'सत्यापन के दौरान त्रुटि हुई।' : 'Error verifying booking.'),
          bookingCode: cleanCode,
        });
        setLastScanSuccess(null);
      }
    } catch (err: any) {
      setLastScanRejection({
        type: 'error',
        title: lang === 'hi' ? 'नेटवर्क त्रुटि' : 'Network Error',
        message: err?.message || 'Server communication error. Check network connection.',
        bookingCode: cleanCode,
      });
      setLastScanSuccess(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Camera Scanning Loop
  const tickCamera = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const video = videoRef.current;
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data && !isCooldownRef.current) {
            const scannedText = qrCode.data.trim();
            if (scannedText) {
              isCooldownRef.current = true;
              handleVerifyAdmission(scannedText);
              // Cooldown timer to prevent repeated scanning of the same frame
              setTimeout(() => {
                isCooldownRef.current = false;
              }, 2000);
            }
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tickCamera);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(tickCamera);
      }
    } catch (err: any) {
      setCameraError(
        lang === 'hi'
          ? 'कैमरा शुरू नहीं हो सका (अनुमति अस्वीकृत या कैमरा अनुपलब्ध)। कृपया मैन्युअल कोड दर्ज करें।'
          : 'Could not access camera. Please enter the booking code manually.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Session Controls & Live Stats */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <QrCode className="w-5 h-5 text-rose-900" />
                <span>{lang === 'hi' ? 'उपस्थिति दर्ज करें (गेट अटेंडेंस स्कैनर)' : 'Mark Attendance (Gate Scanner)'}</span>
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'hi'
                ? 'श्रद्धालु के डिजिटल प्रवेश पत्र का QR कोड स्कैन करें या बुकिंग कोड दर्ज करके उपस्थिति तुरंत दर्ज करें।'
                : 'Scan devotee digital pass QR code with device camera or enter booking code to log attendance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Session Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedSession('morning')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSession === 'morning'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ☀️ {lang === 'hi' ? 'प्रातः सत्र (8-11)' : 'Morning (8-11)'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSession('afternoon')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSession === 'afternoon'
                    ? 'bg-rose-900 text-amber-100 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌅 {lang === 'hi' ? 'सायं सत्र (1-4)' : 'Afternoon (1-4)'}
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAttendanceLogs}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer transition-colors"
              title="Refresh Attendance Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Selector Row for 8 Days */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सक्रिय महायज्ञ दिवस चुनें:' : 'Select Active Yagya Date:'}</span>
            </span>
            <span className="font-mono text-[11px] text-stone-500">
              {selectedDate} · {selectedSession === 'morning' ? 'Morning Session' : 'Afternoon Session'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {EVENT_DAYS.map((day) => {
              const isSelected = day.date === selectedDate;
              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold">{day.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {lang === 'hi' ? 'प्रवेशित परिवार / समूह' : 'Admitted Groups'}
            </div>
            <div className="text-2xl font-extrabold text-emerald-950 font-mono mt-0.5">
              {summary.total_groups}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              {lang === 'hi' ? 'कुल प्रविष्ट श्रद्धालु' : 'Devotees Admitted'}
            </div>
            <div className="text-2xl font-extrabold text-amber-950 font-mono mt-0.5">
              {summary.total_devotees}
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {lang === 'hi' ? 'सक्रिय सत्र' : 'Session'}
            </div>
            <div className="text-xs font-bold text-stone-900 font-mono mt-1">
              {selectedDate} · {selectedSession === 'morning' ? '8-11 AM' : '1-4 PM'}
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {lang === 'hi' ? 'द्वार ऑपरेटर' : 'Gate Operator'}
            </div>
            <div className="text-xs font-bold text-stone-900 truncate mt-1">
              {operatorName}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scanner & Manual Fallback Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Camera QR Scanner */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-900" />
                <h3 className="font-bold text-stone-900 text-sm">
                  {lang === 'hi' ? 'डिवाइस कैमरा QR स्कैनर' : 'Device Camera QR Scanner'}
                </h3>
              </div>
              
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCameraActive
                    ? 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                    : 'bg-rose-900 text-amber-100 shadow-xs hover:bg-rose-950'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कैमरा बंद करें' : 'Stop Camera'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कैमरा चालू करें' : 'Start Camera'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Viewport / Viewfinder */}
            <div className="relative mt-4 aspect-4/3 w-full bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="text-center p-6 space-y-2 text-stone-400">
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 mx-auto flex items-center justify-center text-stone-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold">
                    {lang === 'hi' ? 'कैमरा वर्तमान में बंद है' : 'Camera is currently paused'}
                  </div>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    {lang === 'hi'
                      ? 'श्रद्धालु के डिजिटल पास का QR कोड स्कैन करने के लिए ऊपर "कैमरा चालू करें" दबाएं।'
                      : 'Click "Start Camera" above to scan devotee QR pass.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-2 min-h-[38px] px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'hi' ? 'कैमरा प्रारंभ करें' : 'Start Camera Now'}
                  </button>
                </div>
              )}

              {/* Viewfinder Target Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-amber-400 rounded-3xl relative animate-pulse shadow-lg">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300" />
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-amber-400/80 shadow-xs" />
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-900 text-xs rounded-xl border border-rose-200">
                {cameraError}
              </div>
            )}
          </div>
        </div>

        {/* Right: Manual Entry Fallback & Immediate Result Card */}
        <div className="space-y-4">
          
          {/* Manual Entry Fallback Form */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-stone-600" />
                <h3 className="font-bold text-stone-900 text-sm">
                  {lang === 'hi' ? 'मैन्युअल कोड प्रवेश / बारकोड गन' : 'Manual Code / Barcode Gun Entry'}
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">Press Enter to Admit</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyAdmission(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setLastScanRejection(null);
                }}
                placeholder={lang === 'hi' ? 'बुकिंग कोड डालें (उदा. MY-2026-1042)...' : 'Enter booking code (e.g. MY-2026-1042)...'}
                className="flex-1 min-h-[46px] px-3.5 rounded-xl border border-stone-300 font-mono text-sm uppercase placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="min-h-[46px] px-5 rounded-xl bg-rose-900 hover:bg-rose-950 text-amber-100 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{lang === 'hi' ? 'प्रवेश दर्ज करें' : 'Admit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* SUCCESS CONFIRMATION CARD */}
          {lastScanSuccess && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-md space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                      {lang === 'hi' ? 'सफलतापूर्वक प्रवेशित ✓' : 'ADMITTED & LOGGED ✓'}
                    </span>
                    <h4 className="text-lg font-bold text-stone-900 font-serif mt-0.5">
                      {lastScanSuccess.yagyakartaName}
                    </h4>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-extrabold text-stone-900">{lastScanSuccess.bookingCode}</div>
                  <div className="text-[10px] text-stone-500">
                    {new Date(lastScanSuccess.scannedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Devotee Allocation Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    {lang === 'hi' ? 'आवंटित कुण्ड' : 'Allocated Kund'}
                  </span>
                  <div className="text-xl font-black font-serif text-rose-950 flex items-center gap-1.5 mt-0.5">
                    <HavanKundIcon status="selected" size={22} />
                    <span>
                      {lastScanSuccess.kundNumber 
                        ? `${lang === 'hi' ? 'कुण्ड ' : 'Kund '}${lastScanSuccess.kundNumber}` 
                        : (lang === 'hi' ? 'सामान्य कक्ष' : 'General Pool')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    {lang === 'hi' ? 'श्रद्धालु संख्या' : 'Attendee Count'}
                  </span>
                  <div className="text-xl font-black font-mono text-stone-900 mt-0.5 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-stone-600" />
                    <span>{lastScanSuccess.attendeeCount} {lang === 'hi' ? 'श्रद्धालु' : 'Devotees'}</span>
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600">
                  <div>
                    <span className="font-semibold text-stone-800">{lang === 'hi' ? 'स्थान: ' : 'City: '}</span>
                    <span>{lastScanSuccess.city || 'Agra'}{lastScanSuccess.address ? `, ${lastScanSuccess.address}` : ''}</span>
                  </div>
                  <div className="font-mono text-stone-500">
                    {selectedDate} · {selectedSession === 'morning' ? 'Morning' : 'Afternoon'}
                  </div>
                </div>
              </div>

              {/* Action Button: Allow Immediate Scanning of Next Pass */}
              <button
                type="button"
                onClick={handleReadyForNextPass}
                className="w-full min-h-[46px] py-2 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{lang === 'hi' ? 'अगला पास स्कैन करें (तत्काल अगला प्रवेश)' : 'Scan Next Pass (Immediate Next)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* REJECTION CARD: Already Marked or Booking Not Found */}
          {lastScanRejection && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-rose-500 bg-rose-50/95 text-rose-950 shadow-md space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <XCircle className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-200 text-rose-900">
                      {lastScanRejection.type === 'already_marked'
                        ? (lang === 'hi' ? 'अस्वीकृत: पूर्व प्रविष्ट ⚠️' : 'REJECTED: ALREADY MARKED ⚠️')
                        : (lang === 'hi' ? 'अस्वीकृत: अमान्य कोड ❌' : 'REJECTED: NOT FOUND ❌')}
                    </span>
                    <h4 className="text-base font-bold text-rose-950 font-serif mt-0.5">
                      {lastScanRejection.title}
                    </h4>
                  </div>
                </div>

                <div className="font-mono text-xs font-extrabold text-stone-900 bg-rose-100/80 px-2 py-1 rounded-lg">
                  {lastScanRejection.bookingCode}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-200 text-xs text-rose-900 leading-relaxed space-y-2">
                <p className="font-medium">{lastScanRejection.message}</p>

                {lastScanRejection.attendee && (
                  <div className="pt-2 border-t border-rose-100 grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                    <div>
                      <span className="text-stone-500 font-semibold block">{lang === 'hi' ? 'यजमान नाम:' : 'Devotee:'}</span>
                      <span className="font-bold text-stone-900">{lastScanRejection.attendee.yagyakartaName}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-semibold block">{lang === 'hi' ? 'आवंटित कुण्ड:' : 'Kund:'}</span>
                      <span className="font-bold text-rose-950">
                        {lastScanRejection.attendee.kundNumber
                          ? `${lang === 'hi' ? 'कुण्ड ' : 'Kund '}${lastScanRejection.attendee.kundNumber}`
                          : 'General'}
                      </span>
                    </div>
                    {lastScanRejection.attendee.scannedAt && (
                      <div className="col-span-2 text-stone-500">
                        <span>{lang === 'hi' ? 'प्रथम प्रवेश समय: ' : 'First Admitted At: '}</span>
                        <span className="font-mono font-bold text-stone-800">
                          {new Date(lastScanRejection.attendee.scannedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Allow Immediate Scanning of Next Pass */}
              <button
                type="button"
                onClick={handleReadyForNextPass}
                className="w-full min-h-[46px] py-2 px-4 rounded-2xl bg-stone-900 hover:bg-black text-amber-200 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{lang === 'hi' ? 'अगला पास स्कैन करें (क्लियर करें)' : 'Scan Next Pass (Clear Notice)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Idle Placeholder */}
          {!lastScanSuccess && !lastScanRejection && (
            <div className="bg-stone-50 rounded-3xl border border-stone-200 p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-500 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-stone-800">
                {lang === 'hi' ? 'पास स्कैन हेतु तैयार' : 'Ready for Devotee Pass Scan'}
              </div>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                {lang === 'hi'
                  ? 'कैमरे के सम्मुख डिजिटल पास का QR लाएं अथवा ऊपर कोड डालकर "प्रवेश दर्ज करें" दबाएं।'
                  : 'Point camera at devotee pass QR or type booking code above to admit.'}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* 3. Recent Attendance Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              {lang === 'hi' ? 'सत्र उपस्थिति लॉग' : 'Recent Session Attendance Logs'}
            </h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold">
              {recentScans.length}
            </span>
          </div>

          <span className="text-xs text-stone-500 font-mono">
            {selectedDate} · {selectedSession === 'morning' ? 'Morning' : 'Afternoon'}
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            {lang === 'hi'
              ? 'इस सत्र में अभी तक कोई प्रवेश दर्ज नहीं हुआ है।'
              : 'No gate admission records logged yet for this session.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 text-stone-500 text-[10px] uppercase font-bold tracking-wider border-b border-stone-200">
                  <th className="py-3 px-4">Booking Code</th>
                  <th className="py-3 px-4">Yagyakarta Name</th>
                  <th className="py-3 px-4">Allocated Kund</th>
                  <th className="py-3 px-4">Devotees</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {scan.bookingCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">
                      {scan.yagyakartaName}
                      {scan.city && <span className="text-stone-400 text-[11px] ml-1.5 font-normal">({scan.city})</span>}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-rose-950">
                      {scan.kundNumber ? `${lang === 'hi' ? 'कुण्ड ' : 'Kund '}${scan.kundNumber}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-800">
                      {scan.attendeeCount}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {new Date(scan.scannedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                        {scan.status || 'Admitted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
