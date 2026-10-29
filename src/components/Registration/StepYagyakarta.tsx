import React from 'react';
import { User, Phone, MapPin, Mail, Home, AlertCircle, ChevronRight } from 'lucide-react';
import { YagyakartaDetails } from '../../types';

interface StepYagyakartaProps {
  details: YagyakartaDetails;
  onChange: (details: YagyakartaDetails) => void;
  onNext: () => void;
  lang: 'en' | 'hi';
}

export const StepYagyakarta: React.FC<StepYagyakartaProps> = ({
  details,
  onChange,
  onNext,
  lang,
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!details.fullName.trim()) {
      newErrors.fullName = lang === 'hi' ? 'कृपया मुख्य यज्ञकर्ता का नाम भरें' : 'Yagyakarta full name is required';
    }
    const cleanPhone = details.primaryMobile.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.primaryMobile = lang === 'hi' ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें' : 'Valid 10-digit mobile number required';
    }
    if (!details.address || !details.address.trim()) {
      newErrors.address = lang === 'hi' ? 'पूरा आवासीय पता अनिवार्य है' : 'Full residential address is required';
    }
    if (!details.city.trim()) {
      newErrors.city = lang === 'hi' ? 'शहर का नाम अनिवार्य है' : 'City is required';
    }
    if (!details.state.trim()) {
      newErrors.state = lang === 'hi' ? 'राज्य का नाम अनिवार्य है' : 'State is required';
    }
    if (details.email && !/\S+@\S+\.\S+/.test(details.email)) {
      newErrors.email = lang === 'hi' ? 'अमान्य ईमेल प्रारूप' : 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24 sm:pb-4">
      
      {/* Honeypot field for bot prevention: invisible to users, hidden with CSS, inaccessible to keyboard */}
      <div
        aria-hidden="true"
        style={{
          display: 'none',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        className="hidden"
      >
        <input
          type="text"
          name="website"
          id="website"
          value={details.website || ''}
          onChange={(e) => onChange({ ...details, website: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Editorial Step Intro */}
      <div className="border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
          <span>{lang === 'hi' ? 'चरण 1 / 4' : 'Step 1 of 4'}</span>
          <span>·</span>
          <span>{lang === 'hi' ? 'यज्ञ समन्वयक विवरण' : 'Group Coordinator Details'}</span>
        </div>
        <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
          {lang === 'hi' ? 'मुख्य यज्ञकर्ता (समन्वयक) की जानकारी' : 'Primary Yagyakarta (Coordinator) Information'}
        </h2>
        <p className="text-xs text-stone-600 mt-0.5">
          {lang === 'hi'
            ? 'पंजीकरण इसी एक फॉर्म द्वारा होगा। अन्य सदस्यों को अलग खाता बनाने की आवश्यकता नहीं है।'
            : 'One consolidated registration for your group. Accompanying members do not create accounts.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'मुख्य यज्ञकर्ता का पूरा नाम *' : 'Coordinator Full Name *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={details.fullName}
              onChange={(e) => onChange({ ...details, fullName: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा. पंडित रामेश्वर शर्मा' : 'e.g. Rameshwar Sharma'}
              className={`w-full min-h-[46px] pl-10 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                errors.fullName ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
              }`}
            />
          </div>
          {errors.fullName && <p className="text-xs text-rose-600 mt-1">{errors.fullName}</p>}
        </div>

        {/* Primary Mobile */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'प्राथमिक मोबाइल नंबर (10 अंक) *' : 'Primary Mobile (10 Digits) *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 font-semibold text-xs">
              +91
            </div>
            <input
              type="tel"
              maxLength={10}
              required
              value={details.primaryMobile}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                onChange({ ...details, primaryMobile: val });
              }}
              placeholder="9876543210"
              className={`w-full min-h-[46px] pl-12 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none transition-colors font-mono tabular-nums ${
                errors.primaryMobile ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
              }`}
            />
          </div>
          {errors.primaryMobile ? (
            <p className="text-xs text-rose-600 mt-1">{errors.primaryMobile}</p>
          ) : (
            <p className="text-[11px] text-stone-500 mt-1">
              {lang === 'hi' ? 'प्रवेश पत्र डाउनलोड व सत्यापन हेतु' : 'Used for pass retrieval & gate SMS verification'}
            </p>
          )}
        </div>

        {/* Secondary Mobile (Optional here) */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'वैकल्पिक / द्वितीय मोबाइल नंबर' : 'Secondary Mobile (Optional here)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              maxLength={10}
              value={details.secondaryMobile || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                onChange({ ...details, secondaryMobile: val });
              }}
              placeholder={lang === 'hi' ? 'उदा. 9811002233' : 'Optional secondary phone'}
              className="w-full min-h-[46px] pl-10 pr-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600 font-mono tabular-nums"
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {lang === 'hi' ? '3 या अधिक सदस्यों पर अनिवार्य होगा' : 'Mandatory if booking for 3 or more members'}
          </p>
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={details.email || ''}
              onChange={(e) => onChange({ ...details, email: e.target.value })}
              placeholder="name@example.com"
              className={`w-full min-h-[46px] pl-10 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300 focus:border-amber-600'
              }`}
            />
          </div>
        </div>

        {/* Full Residential Address (Mandatory) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'स्थायी / आवासीय पता (अनिवार्य) *' : 'Residential Address (Mandatory) *'}
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-stone-400">
              <Home className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              required
              value={details.address || ''}
              onChange={(e) => onChange({ ...details, address: e.target.value })}
              placeholder={
                lang === 'hi'
                  ? 'मकान / भवन संख्या, गली / मार्ग, मोहल्ला / क्षेत्र (उदा. 42-बी, कमला नगर)'
                  : 'House / Flat No., Street, Landmark, Area (e.g. 42-B, Kamla Nagar)'
              }
              className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                errors.address ? 'border-rose-500 bg-rose-50/20' : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
              }`}
            />
          </div>
          {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'निवास का शहर / नगर *' : 'City / Town *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={details.city}
              onChange={(e) => onChange({ ...details, city: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा. आगरा / मथुरा / दिल्ली' : 'e.g. Agra, Delhi, Jaipur'}
              className={`w-full min-h-[46px] pl-10 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none transition-colors ${
                errors.city ? 'border-rose-500' : 'border-stone-300 focus:border-amber-600'
              }`}
            />
          </div>
          {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'राज्य *' : 'State *'}
          </label>
          <input
            type="text"
            required
            value={details.state}
            onChange={(e) => onChange({ ...details, state: e.target.value })}
            placeholder={lang === 'hi' ? 'उदा. उत्तर प्रदेश' : 'e.g. Uttar Pradesh'}
            className="w-full min-h-[46px] px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'पिनकोड' : 'Pincode'}
          </label>
          <input
            type="text"
            maxLength={6}
            value={details.pincode}
            onChange={(e) => onChange({ ...details, pincode: e.target.value.replace(/\D/g, '') })}
            placeholder="282007"
            className="w-full min-h-[46px] px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600 font-mono tabular-nums"
          />
        </div>

        {/* Gotra (Optional) */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'गोत्र (संकल्प हेतु, यदि ज्ञात हो)' : 'Gotra (Optional, for Sankalp recitation)'}
          </label>
          <input
            type="text"
            value={details.gotra || ''}
            onChange={(e) => onChange({ ...details, gotra: e.target.value })}
            placeholder={lang === 'hi' ? 'उदा. भारद्वाज, कश्यप' : 'e.g. Bharadwaj, Kashyap'}
            className="w-full min-h-[46px] px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Sankalp Purpose */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            {lang === 'hi' ? 'संकल्प उद्देश्य' : 'Sankalp Purpose (Devotional Intent)'}
          </label>
          <input
            type="text"
            value={details.sankalpPurpose || ''}
            onChange={(e) => onChange({ ...details, sankalpPurpose: e.target.value })}
            placeholder={lang === 'hi' ? 'उदा. पारिवारिक सुख-शांति व स्वास्थ्य' : 'e.g. Family Wellbeing, Health'}
            className="w-full min-h-[46px] px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600"
          />
        </div>

      </div>

      {/* Desktop Submit Button */}
      <div className="hidden sm:flex justify-end pt-2">
        <button
          type="submit"
          className="min-h-[46px] px-7 py-2.5 rounded-xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{lang === 'hi' ? 'आगे बढ़ें: सदस्य जोड़ें (चरण 2)' : 'Continue: Add Members (Step 2)'}</span>
          <span>→</span>
        </button>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg">
        <button
          type="submit"
          className="w-full min-h-[48px] rounded-xl font-bold text-sm bg-rose-900 text-amber-100 shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <span>{lang === 'hi' ? 'सदस्य जोड़ें (चरण 2)' : 'Next: Add Members (Step 2)'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </form>
  );
};
