import React from 'react';
import { 
  X, 
  Check, 
  Flame, 
  MapPin, 
  Search, 
  Layers, 
  Users, 
  Sparkles, 
  ChevronRight,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { ZONES, ZoneConfig, SectorConfig, findSectorByKund } from '../../data/zoneConfig';

interface ManualKundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKund: (kundNumber: number, zoneName: string) => void;
  currentSelectedKund: number | null;
  familySize: number;
  lang?: 'en' | 'hi';
}

export const ManualKundPickerModal: React.FC<ManualKundPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectKund,
  currentSelectedKund,
  familySize,
  lang = 'hi',
}) => {
  const [selectedZoneId, setSelectedZoneId] = React.useState<number>(1);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string>('z1-sec-a');
  const [tempChosenKund, setTempChosenKund] = React.useState<number | null>(currentSelectedKund);
  const [searchKundText, setSearchKundText] = React.useState<string>('');
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Sync tempChosenKund when modal opens or currentSelectedKund changes
  React.useEffect(() => {
    if (isOpen) {
      setTempChosenKund(currentSelectedKund);
      if (currentSelectedKund) {
        const match = findSectorByKund(currentSelectedKund);
        if (match) {
          setSelectedZoneId(match.zone.id);
          setSelectedSectorId(match.sector.id);
        }
      }
    }
  }, [isOpen, currentSelectedKund]);

  if (!isOpen) return null;

  const currentZone = ZONES.find((z) => z.id === selectedZoneId) || ZONES[0];
  const currentSector = currentZone.sectors.find((s) => s.id === selectedSectorId) || currentZone.sectors[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const num = parseInt(searchKundText.trim(), 10);
    if (isNaN(num) || num < 1 || num > 2151) {
      setSearchError(lang === 'hi' ? 'कृपया 1 से 2151 के बीच कुण्ड संख्या डालें' : 'Enter a number between 1 and 2151');
      return;
    }
    const match = findSectorByKund(num);
    if (match) {
      setSelectedZoneId(match.zone.id);
      setSelectedSectorId(match.sector.id);
      setTempChosenKund(num);
      setSearchKundText('');
    }
  };

  const handleConfirmSelection = () => {
    if (tempChosenKund) {
      const match = findSectorByKund(tempChosenKund);
      const zoneName = match ? (lang === 'hi' ? match.zone.nameHi : match.zone.name) : `Zone ${selectedZoneId}`;
      onSelectKund(tempChosenKund, zoneName);
      onClose();
    }
  };

  // Kund numbers in this sector
  const kundsInSector: number[] = [];
  for (let k = currentSector.startKund; k <= currentSector.endKund; k++) {
    kundsInSector.push(k);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                  {lang === 'hi' ? 'मैनुअल कुण्ड चयन' : 'Manual Kund Selection'}
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-semibold">
                  {familySize} {lang === 'hi' ? 'श्रद्धालु एक साथ' : 'Devotees Together'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif leading-tight">
                {lang === 'hi' ? 'पवित्र 2151 कुण्ड मानचित्र से चयन करें' : 'Pick Your Sacred Kund from Visual Map'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Instructions Bar */}
        <div className="px-5 sm:px-6 py-3 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {lang === 'hi'
                ? `आपके परिवार के सभी ${familySize} सदस्य आपके द्वारा चुने गए कुण्ड पर एक साथ आहुति देंगे।`
                : `All ${familySize} members of your family will sit together at your chosen Kund.`}
            </span>
          </div>

          {/* Quick Kund Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={1}
              max={2151}
              value={searchKundText}
              onChange={(e) => {
                setSearchKundText(e.target.value);
                setSearchError(null);
              }}
              placeholder={lang === 'hi' ? 'कुण्ड सं. (उदा. 108)' : 'Kund # (e.g. 108)'}
              className="min-h-[38px] w-36 px-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="min-h-[38px] px-3 rounded-xl bg-stone-900 text-amber-300 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {lang === 'hi' ? 'खोजें' : 'Go'}
            </button>
          </form>
        </div>

        {searchError && (
          <div className="px-5 py-2 bg-rose-50 text-rose-800 text-xs font-medium border-b border-rose-200">
            {searchError}
          </div>
        )}

        {/* Modal Body: Zones Ribbon, Sector Tabs, & Kund Seat Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Zone Selector Horizontal Carousel / Ribbon */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
              {lang === 'hi' ? '1. मण्डलीय जोन चुनें:' : '1. Select Sacred Zone:'}
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {ZONES.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setSelectedSectorId(zone.sectors[0].id);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer text-left ${
                      isSelected
                        ? 'bg-stone-900 text-amber-300 border-stone-950 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-bold">{zone.shortName}</div>
                    <div className="text-[10px] opacity-75">{zone.startKund}–{zone.endKund}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sector Tabs (A, B, C, D) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {lang === 'hi' ? '2. सेक्टर चुनें:' : '2. Select Sector:'}
              </label>
              <span className="text-xs font-serif font-bold text-stone-800">
                {lang === 'hi' ? currentZone.nameHi : currentZone.name}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {currentZone.sectors.map((sec) => {
                const isSelected = sec.id === selectedSectorId;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectorId(sec.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs font-bold'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{lang === 'hi' ? sec.nameHi : sec.name}</span>
                    <span className="ml-1.5 font-mono text-[10px] opacity-80">
                      (#{sec.startKund}–#{sec.endKund})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bus Seat Kund Grid for Selected Sector */}
          <div className="bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-3 pb-2 border-b border-stone-200">
              <span className="font-semibold">
                {lang === 'hi' ? '3. अपनी पसंद के कुण्ड पर क्लिक करें:' : '3. Tap any available Kund below:'}
              </span>
              {tempChosenKund && (
                <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                  {lang === 'hi' ? 'वर्तमान चयन: कुण्ड #' : 'Selected: Kund #'}{tempChosenKund}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {kundsInSector.map((kNum) => {
                const isSelected = tempChosenKund === kNum;

                return (
                  <button
                    key={kNum}
                    type="button"
                    onClick={() => setTempChosenKund(kNum)}
                    className={`min-h-[48px] p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-stone-900 text-amber-300 border-stone-950 ring-2 ring-amber-400 ring-offset-2 scale-105 shadow-md font-bold'
                        : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 leading-none">
                      KUND
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold tabular-nums mt-0.5">
                      #{kNum}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-amber-400 mt-0.5 stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 text-center sm:text-left">
            {tempChosenKund ? (
              <span className="flex items-center gap-1.5 text-stone-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'hi' ? 'कुण्ड #' : 'Kund #'}{tempChosenKund} ({lang === 'hi' ? currentZone.nameHi : currentZone.name})
                </span>
              </span>
            ) : (
              <span>{lang === 'hi' ? 'कृपया सूची में से एक कुण्ड चुनें' : 'Please click a kund above to select'}</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!tempChosenKund}
              className="min-h-[44px] flex-1 sm:flex-initial px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{lang === 'hi' ? 'इस कुण्ड की पुष्टि करें' : 'Confirm Kund'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
