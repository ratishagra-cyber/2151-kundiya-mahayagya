import React from 'react';
import confetti from 'canvas-confetti';
import { StepYagyakarta } from './StepYagyakarta';
import { StepParticipants } from './StepParticipants';
import { StepSessions } from './StepSessions';
import { StepReview } from './StepReview';
import { YagyakartaDetails, Participant, Booking, SessionType, DaySchedule } from '../../types';
import { createDefaultSchedule, EVENT_DAYS } from '../../data/eventConfig';
import { allocateBestFitKunds } from '../../services/allocationEngine';
import { getStoredBookings } from '../../services/storageService';
import { saveRegistration } from '../../services/registration';
import { Check, User, Users, Calendar, ShieldCheck } from 'lucide-react';

interface RegistrationWizardProps {
  onBookingComplete: (booking: Booking) => void;
  lang: 'en' | 'hi';
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onBookingComplete,
  lang,
}) => {
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [yagyakarta, setYagyakarta] = React.useState<YagyakartaDetails>({
    fullName: '',
    primaryMobile: '',
    secondaryMobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
    gotra: '',
    sankalpPurpose: '',
  });

  const [participants, setParticipants] = React.useState<Participant[]>([
    {
      id: 'p-coordinator',
      name: '',
      age: '',
      gender: 'male',
      relationship: 'Self / Yagyakarta',
      mobile: '',
      isYagyakarta: true,
      schedule: createDefaultSchedule(),
    },
  ]);

  // Family-level unified schedule across 8 days
  const [familySchedule, setFamilySchedule] = React.useState<DaySchedule[]>(createDefaultSchedule());

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [allocationError, setAllocationError] = React.useState<string | null>(null);

  const steps = [
    { num: 1, labelEn: 'Coordinator', labelHi: 'समन्वयक', icon: User },
    { num: 2, labelEn: 'Members', labelHi: 'सदस्य (1-8)', icon: Users },
    { num: 3, labelEn: 'Family Sessions', labelHi: 'सत्र चयन', icon: Calendar },
    { num: 4, labelEn: 'Confirm & Kund', labelHi: 'समीक्षा व आवंटन', icon: ShieldCheck },
  ];

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    setAllocationError(null);

    try {
      // Validate mandatory coordinator address
      if (!yagyakarta.address || !yagyakarta.address.trim()) {
        setAllocationError(
          lang === 'hi'
            ? 'कृपया मुख्य समन्वयक का आवासीय पता भरें (चरण 1)।'
            : 'Coordinator residential address is required (Step 1).'
        );
        setIsSubmitting(false);
        return;
      }

      // 1. Build family-level session allocation requests
      // All registered participants attend each selected session together
      const familyMemberIds = participants.map((p) => p.id);
      const allocationRequests: { date: string; session: SessionType; participantIds: string[] }[] = [];

      for (const day of EVENT_DAYS) {
        const daySched = familySchedule.find((s) => s.date === day.date);

        if (daySched?.morning) {
          allocationRequests.push({
            date: day.date,
            session: 'morning',
            participantIds: familyMemberIds,
          });
        }

        if (daySched?.afternoon) {
          allocationRequests.push({
            date: day.date,
            session: 'afternoon',
            participantIds: familyMemberIds,
          });
        }
      }

      if (allocationRequests.length === 0) {
        setAllocationError(
          lang === 'hi'
            ? 'कृपया परिवार के लिए कम से कम एक सत्र का चयन करें।'
            : 'Please select at least one session for the family.'
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Fetch existing bookings from storage to check current Kund occupancies
      const existingBookings = getStoredBookings();

      // 3. Run Best-Fit deterministic allocation engine with strict family integrity
      const result = allocateBestFitKunds(allocationRequests, existingBookings);

      if (!result.success) {
        setAllocationError(result.error || 'Allocation failed due to capacity constraints.');
        setIsSubmitting(false);
        return;
      }

      // 4. Generate unique Booking ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newBookingId = `MY-2026-${randomSuffix}`;

      // Update all participants' schedules to match the unified family schedule
      const participantsWithSchedule = participants.map((p) => ({
        ...p,
        schedule: familySchedule,
      }));

      const newBooking: Booking = {
        id: newBookingId,
        createdAt: new Date().toISOString(),
        yagyakarta,
        participants: participantsWithSchedule,
        familySchedule,
        allocations: result.allocations,
        status: 'confirmed',
      };

      // 5. Persist booking record via saveRegistration (calls POST /api/register with localStorage fallback)
      const saveResult = await saveRegistration(newBooking);

      if (!saveResult.success) {
        setAllocationError(
          saveResult.error ||
            (lang === 'hi'
              ? 'पंजीकरण सहेजने में विफल। कृपया पुनः प्रयास करें।'
              : 'Failed to save registration. Please try again.')
        );
        setIsSubmitting(false);
        return;
      }

      // 6. Use confirmed booking code & server returned data
      const confirmedBookingData: Booking = {
        ...newBooking,
        ...(saveResult.data || {}),
        id: saveResult.bookingCode || saveResult.data?.id || newBookingId,
        yagyakarta: {
          ...newBooking.yagyakarta,
          ...(saveResult.data?.yagyakarta || {}),
        },
      };

      // 7. Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#dc2626', '#e11d48', '#fbbf24', '#10b981'],
        });
      } catch (err) {
        // ignore confetti failures
      }

      // 8. Route to Confirmation View
      onBookingComplete(confirmedBookingData);
    } catch (e: any) {
      setAllocationError(e.message || 'An unexpected error occurred during allocation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      
      {/* 4-Step Progress Indicator (Mobile Touch Ergonomic) */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <div
                key={st.num}
                className="flex flex-col items-center text-center group cursor-default"
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-rose-900 text-amber-200 ring-2 ring-amber-400 shadow-md'
                      : 'bg-stone-100 text-stone-400 border border-stone-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="mt-1.5">
                  <div
                    className={`text-[11px] font-bold leading-tight ${
                      isCurrent
                        ? 'text-rose-950 font-semibold'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-stone-400'
                    }`}
                  >
                    {lang === 'hi' ? st.labelHi : st.labelEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Horizontal Connector Line */}
        <div className="relative mt-2.5 h-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-700 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-lg p-5 sm:p-8">
        {currentStep === 1 && (
          <StepYagyakarta
            details={yagyakarta}
            onChange={setYagyakarta}
            onNext={() => setCurrentStep(2)}
            lang={lang}
          />
        )}

        {currentStep === 2 && (
          <StepParticipants
            participants={participants}
            setParticipants={setParticipants}
            yagyakarta={yagyakarta}
            setYagyakarta={setYagyakarta}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
            lang={lang}
          />
        )}

        {currentStep === 3 && (
          <StepSessions
            familySchedule={familySchedule}
            setFamilySchedule={setFamilySchedule}
            participants={participants}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
            lang={lang}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            yagyakarta={yagyakarta}
            participants={participants}
            familySchedule={familySchedule}
            onConfirm={handleFinalConfirm}
            onPrev={() => setCurrentStep(3)}
            isSubmitting={isSubmitting}
            allocationError={allocationError}
            lang={lang}
          />
        )}
      </div>

    </div>
  );
};
