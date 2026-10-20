import React from 'react';
import { UserPlus, Trash2, ShieldCheck, AlertCircle, Phone, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Participant, YagyakartaDetails } from '../../types';
import { createDefaultSchedule } from '../../data/eventConfig';

interface StepParticipantsProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  yagyakarta: YagyakartaDetails;
  setYagyakarta: (details: YagyakartaDetails) => void;
  onNext: () => void;
  onPrev: () => void;
  lang: 'en' | 'hi';
}

const RELATIONSHIPS = [
  'Self / Yagyakarta',
  'Spouse (धर्मपत्नी / पति)',
  'Parent (माता / पिता)',
  'Child (पुत्र / पुत्री)',
  'Sibling (भाई / बहन)',
  'Relative (सम्बन्धी)',
  'Guru-bhai / Friend (मित्र / साधक)',
];

export const StepParticipants: React.FC<StepParticipantsProps> = ({
  participants,
  setParticipants,
  yagyakarta,
  setYagyakarta,
  onNext,
  onPrev,
  lang,
}) => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync participant[0] with Yagyakarta details automatically
  React.useEffect(() => {
    if (participants.length > 0 && participants[0].isYagyakarta) {
      if (participants[0].name !== yagyakarta.fullName || participants[0].mobile !== yagyakarta.primaryMobile) {
        setParticipants((prev) => [
          {
            ...prev[0],
            name: yagyakarta.fullName,
            mobile: yagyakarta.primaryMobile,
          },
          ...prev.slice(1),
        ]);
      }
    }
  }, [yagyakarta.fullName, yagyakarta.primaryMobile, setParticipants]);

  const addParticipant = () => {
    if (participants.length >= 8) {
      setErrorMsg(
        lang === 'hi'
          ? 'अधिकतम 8 सदस्य प्रति बुकिंग। 8 से अधिक सदस्यों के लिए कृपया दूसरा समूह पंजीकृत करें।'
          : 'Maximum 8 participants per booking. Groups > 8 should register as two separate groups.'
      );
      return;
    }
    setErrorMsg(null);
    const newId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newParticipant: Participant = {
      id: newId,
      name: '',
      age: '',
      gender: 'female',
      relationship: 'Spouse (धर्मपत्नी / पति)',
      mobile: '',
      isYagyakarta: false,
      schedule: createDefaultSchedule(),
    };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (index: number) => {
    if (index === 0) return; // Cannot delete coordinator
    setParticipants(participants.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const updateParticipant = (index: number, updates: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  // Mobile Rule: If >= 3 participants, must have at least 2 distinct valid mobile numbers
  const checkMobileRule = (): { valid: boolean; reason?: string } => {
    if (participants.length < 3) return { valid: true };

    const primary = yagyakarta.primaryMobile.replace(/\D/g, '');
    const secondaryCoordinator = (yagyakarta.secondaryMobile || '').replace(/\D/g, '');

    const participantMobiles = participants
      .slice(1)
      .map((p) => (p.mobile || '').replace(/\D/g, ''))
      .filter((m) => m.length === 10);

    const allValidSecondary = [
      secondaryCoordinator.length === 10 ? secondaryCoordinator : null,
      ...participantMobiles,
    ].filter((m): m is string => Boolean(m) && m !== primary);

    if (allValidSecondary.length === 0) {
      return {
        valid: false,
        reason:
          lang === 'hi'
            ? 'नियम: 3 या अधिक सदस्यों वाले समूह के लिए कम से कम 2 अलग-अलग मोबाइल नंबर अनिवार्य हैं।'
            : 'Rule: Groups of 3 or more participants MUST provide at least two distinct mobile numbers.',
      };
    }

    return { valid: true };
  };

  const handleNext = () => {
    // Validate all names
    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].name.trim()) {
        setErrorMsg(
          lang === 'hi'
            ? `सदस्य #${i + 1} का नाम दर्ज करना अनिवार्य है।`
            : `Please enter the name for Participant #${i + 1}`
        );
        return;
      }
    }

    // Validate mobile rule
    const mobileCheck = checkMobileRule();
    if (!mobileCheck.valid) {
      setErrorMsg(mobileCheck.reason || 'Two distinct mobile numbers required.');
      return;
    }

    setErrorMsg(null);
    onNext();
  };

  const mobileRuleStatus = checkMobileRule();

  return (
    <div className="space-y-5 pb-24 sm:pb-6">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
          <span>{lang === 'hi' ? 'चरण 2 / 4' : 'Step 2 of 4'}</span>
          <span>·</span>
          <span>{lang === 'hi' ? 'परिवार / समूह सदस्य' : 'Family / Group Members'}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              {lang === 'hi' ? 'सदस्यों के नाम जोड़ें' : 'Add Accompanying Devotees'}
            </h2>
            <p className="text-xs text-stone-600">
              {lang === 'hi'
                ? 'न्यूनतम 1, अधिकतम 8 सदस्य। सभी सदस्य एक साथ एक ही कुंड पर बैठेंगे।'
                : '1 to 8 members. All members will be allocated together in one Kund.'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 tabular-nums shrink-0">
            {participants.length} / 8 {lang === 'hi' ? 'सदस्य' : 'Members'}
          </span>
        </div>
      </div>

      {/* PROACTIVE PROGRESSIVE DISCLOSURE: Secondary Mobile Requirement as soon as 3rd participant is added */}
      {participants.length >= 3 && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            mobileRuleStatus.valid
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {mobileRuleStatus.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="text-xs space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-bold">
                  {lang === 'hi' ? 'द्वितीयक मोबाइल नंबर नियम (3+ सदस्य)' : 'Secondary Mobile Requirement (3+ members)'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  mobileRuleStatus.valid ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {mobileRuleStatus.valid ? 'Verified ✓' : 'Action Required'}
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {lang === 'hi'
                  ? 'सुरक्षा एवं प्रवेश द्वार सूचना हेतु 3 या अधिक सदस्यों के परिवार के लिए कम से कम 2 भिन्न मोबाइल नंबर आवश्यक हैं।'
                  : 'For event safety and gate communication, groups of 3+ members require at least two distinct mobile numbers.'}
              </p>

              {/* Inline Secondary Phone Input */}
              <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="font-semibold text-stone-800 text-xs">
                  {lang === 'hi' ? 'द्वितीयक मोबाइल नंबर (10 अंक):' : 'Secondary Mobile Number:'}
                </label>
                <div className="relative w-full sm:w-56">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={yagyakarta.secondaryMobile || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setYagyakarta({ ...yagyakarta, secondaryMobile: val });
                    }}
                    placeholder="9811002233"
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600 tabular-nums font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Cards List */}
      <div className="space-y-3.5">
        {participants.map((p, idx) => (
          <div
            key={p.id}
            className={`p-4 rounded-2xl border transition-all ${
              p.isYagyakarta
                ? 'bg-amber-50/30 border-amber-300/70 shadow-2xs'
                : 'bg-white border-stone-200 shadow-2xs'
            }`}
          >
            {/* Participant Card Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-stone-100 text-[11px] font-bold flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm text-stone-900">
                  {p.isYagyakarta
                    ? (lang === 'hi' ? 'मुख्य यज्ञकर्ता (समन्वयक)' : 'Primary Yagyakarta (Coordinator)')
                    : (lang === 'hi' ? `सहभागी सदस्य #${idx + 1}` : `Participant #${idx + 1}`)}
                </span>
                {p.isYagyakarta && (
                  <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Coordinator
                  </span>
                )}
              </div>

              {!p.isYagyakarta && (
                <button
                  type="button"
                  onClick={() => removeParticipant(idx)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove participant"
                  aria-label="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Input Fields with Comfortable Touch Targets (>= 44px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={p.name}
                  disabled={p.isYagyakarta}
                  onChange={(e) => updateParticipant(idx, { name: e.target.value })}
                  placeholder={lang === 'hi' ? 'उदा. सुनीता शर्मा' : 'e.g. Sunita Sharma'}
                  className={`w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-none ${
                    p.isYagyakarta ? 'bg-stone-50 text-stone-800 font-medium border-stone-200' : 'border-stone-300 focus:border-amber-600'
                  }`}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {lang === 'hi' ? 'आयु (वर्ष)' : 'Age'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={p.age}
                  onChange={(e) =>
                    updateParticipant(idx, {
                      age: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="45"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600 font-mono tabular-nums"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {lang === 'hi' ? 'लिंग' : 'Gender'}
                </label>
                <select
                  value={p.gender}
                  onChange={(e) => updateParticipant(idx, { gender: e.target.value as any })}
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600"
                >
                  <option value="male">{lang === 'hi' ? 'पुरुष' : 'Male'}</option>
                  <option value="female">{lang === 'hi' ? 'महिला' : 'Female'}</option>
                  <option value="other">{lang === 'hi' ? 'अन्य' : 'Other'}</option>
                </select>
              </div>

              {/* Relationship */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {lang === 'hi' ? 'संबंध' : 'Relation'}
                </label>
                {p.isYagyakarta ? (
                  <input
                    type="text"
                    disabled
                    value={lang === 'hi' ? 'स्वयं (मुख्य समन्वयक)' : 'Self (Coordinator)'}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-medium"
                  />
                ) : (
                  <select
                    value={p.relationship}
                    onChange={(e) => updateParticipant(idx, { relationship: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-600"
                  >
                    {RELATIONSHIPS.filter((r) => !r.includes('Self')).map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mobile if needed */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>{lang === 'hi' ? 'मोबाइल (वैकल्पिक)' : 'Mobile (Optional)'}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={p.isYagyakarta}
                    value={p.mobile || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateParticipant(idx, { mobile: val });
                    }}
                    placeholder={p.isYagyakarta ? yagyakarta.primaryMobile : '9876543210'}
                    className={`w-full min-h-[44px] pl-9 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-none font-mono tabular-nums ${
                      p.isYagyakarta ? 'bg-stone-50 border-stone-200 text-stone-700' : 'border-stone-300 focus:border-amber-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Participant Button */}
      {participants.length < 8 ? (
        <button
          type="button"
          onClick={addParticipant}
          className="w-full min-h-[50px] py-3 px-4 rounded-2xl border-2 border-dashed border-amber-400 hover:border-amber-600 bg-amber-50/50 hover:bg-amber-50 text-amber-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-amber-800" />
          <span>
            {lang === 'hi'
              ? `+ अन्य सदस्य जोड़ें (${participants.length}/8)`
              : `+ Add Accompanying Member (${participants.length} of 8)`}
          </span>
        </button>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {lang === 'hi'
              ? 'पूर्ण क्षमता (8 सदस्य)। सभी 8 सदस्य एक ही कुंड पर बैठेंगे।'
              : 'Maximum group capacity reached (8 members). All 8 will occupy one complete Kund.'}
          </span>
        </div>
      )}

      {/* Inline Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Desktop Navigation Footer */}
      <div className="hidden sm:flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
        >
          ← {lang === 'hi' ? 'पूर्व चरण' : 'Previous Step'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="min-h-[46px] px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-900 hover:bg-rose-950 text-amber-100 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{lang === 'hi' ? 'सत्र व तिथियां चुनें (चरण 3)' : 'Select Dates & Sessions (Step 3)'}</span>
          <span>→</span>
        </button>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Touch Ergonomic) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[46px] px-4 rounded-xl font-semibold text-xs text-stone-700 bg-stone-100 border border-stone-300"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 min-h-[46px] rounded-xl font-bold text-sm bg-rose-900 text-amber-100 shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <span>{lang === 'hi' ? 'सत्र चुनें (चरण 3)' : 'Next: Sessions (Step 3)'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
