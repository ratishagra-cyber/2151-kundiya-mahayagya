import React from 'react';
import { Calendar, MapPin, Users, Ticket, Sparkles, ChevronDown } from 'lucide-react';
import { EVENT_DETAILS } from '../data/eventConfig';

interface BannerHeroProps {
  onStartRegistration: () => void;
  onOpenRetrieve: () => void;
  lang: 'en' | 'hi';
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  onStartRegistration,
  onOpenRetrieve,
  lang,
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [showGuidelines, setShowGuidelines] = React.useState(false);

  return (
    <div className="bg-white border-b border-stone-200">
      
      {/* 1. Clean Unobstructed Banner Container - NO OVERLAYS, NO TEXT ON IMAGE, NO DARKENING */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-2">
        <div className="rounded-2xl overflow-hidden shadow-xs border border-stone-200 bg-stone-50">
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[360px] bg-stone-100 flex items-center justify-center">
            <img
              src={EVENT_DETAILS.bannerPath}
              alt="2151 Kundiya Mrityunjay Maa Pitambara Mahayagya Banner"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 2. Venue & Date Information Cleanly BELOW the Banner with Icons (Separate readable metadata) */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-1 text-xs text-stone-600 border-b border-stone-100">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{EVENT_DETAILS.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-stone-800">{EVENT_DETAILS.datesLabel}</span>
          </div>
        </div>
      </div>

      {/* 3. Simplified Landing Section: Clean Banner → Short Purpose Line → Primary CTA */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center space-y-4">
        
        {/* Short Purpose Line */}
        <p className="text-base sm:text-lg text-stone-800 font-serif leading-relaxed max-w-2xl mx-auto">
          {lang === 'hi'
            ? '14 से 21 दिसंबर 2026 तक आगरा में आयोजित 2151 कुंडीय महायज्ञ में अपने परिवार (1 से 8 सदस्य) का एकमुश्त पंजीकरण करें।'
            : 'Register your family (1 to 8 members) for the 2151 Kundiya Mahayagya in Agra, 14–21 December 2026.'}
        </p>

        {/* Primary CTA Button & Secondary Retrieve Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            onClick={onStartRegistration}
            className="w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-2xl font-bold text-base bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-md shadow-rose-950/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5 text-amber-300" />
            <span>{lang === 'hi' ? 'परिवार का पंजीकरण करें' : 'Register Family (1–8 Members)'}</span>
          </button>

          <button
            onClick={onOpenRetrieve}
            className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-rose-950 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Ticket className="w-4 h-4 text-rose-900" />
            <span>{lang === 'hi' ? 'प्रवेश पत्र देखें' : 'Find Your Pass'}</span>
          </button>
        </div>

        {/* Single Short Reassurance Line Under CTA */}
        <p className="text-xs text-stone-500 font-medium">
          {lang === 'hi'
            ? '✓ अखंड परिवार गारंटी: परिवार के सभी सदस्य एक ही कुंड पर एक साथ बैठेंगे।'
            : '✓ Family Integrity Guarantee: All attending members seated together at one physical Kund.'}
        </p>

        {/* Collapsible Secondary Context (Kept outside main registration flow) */}
        <div className="pt-2">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer font-medium py-1"
          >
            <span>{lang === 'hi' ? 'यज्ञ समय सारिणी एवं नियम देखें' : 'View Timings & Seating Guidelines'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGuidelines ? 'rotate-180' : ''}`} />
          </button>

          {showGuidelines && (
            <div className="mt-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-left text-xs text-stone-700 space-y-2 animate-in fade-in duration-200">
              <div className="font-bold text-stone-900">
                {lang === 'hi' ? 'सत्र समय सारिणी एवं क्षमता' : 'Daily Sessions & Capacity:'}
              </div>
              <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                <li><strong>{lang === 'hi' ? 'प्रातः सत्र:' : 'Morning Session:'}</strong> 8:00 AM – 11:00 AM</li>
                <li><strong>{lang === 'hi' ? 'दोपहर सत्र:' : 'Afternoon Session:'}</strong> 1:00 PM – 4:00 PM</li>
                <li><strong>{lang === 'hi' ? 'भौतिक कुंड:' : 'Physical Kunds:'}</strong> 2,151 Kunds (Max 8 participants per session)</li>
                <li><strong>{lang === 'hi' ? 'समन्वयक:' : 'Coordinator:'}</strong> Only Yagyakarta needs to submit; accompanying members do not need accounts.</li>
              </ul>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
