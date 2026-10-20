import React from 'react';
import confetti from 'canvas-confetti';
import { StepYagyakarta } from './StepYagyakarta';
import { StepParticipants } from './StepParticipants';
import { StepSessions } from './StepSessions';
import { StepReview } from './StepReview';
import { YagyakartaDetails, Participant, Booking, SessionType } from '../../types';
import { createDefaultSchedule, EVENT_DAYS } from '../../data/eventConfig';
import { allocateBestFitKunds } from '../../services/allocationEngine';
import { getStoredBookings, addBooking } from '../../services/storageService';
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

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [allocationError, setAllocationError] = React.useState<string | null>(null);

  const steps = [
    { num: 1, labelEn: 'Coordinator', labelHi: 'समन्वयक', icon: User },
    { num: 2, labelEn: 'Members', labelHi: 'सदस्य (1-8)', icon: Users },
    { num: 3, labelEn: 'Sessions', labelHi: 'सत्र चयन', icon: Calendar },
    { num: 4, labelEn: 'Confirm & Kund', labelHi: 'कुंड आवंटन', icon: ShieldCheck },
  ];

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    setAllocationError(null);

    try {
      // 1. Build session allocation requests
      const allocationRequests: { date: string; session: SessionType; participantIds: string[] }[] = [];

      for (const day of EVENT_DAYS) {
        const morningIds = participants
          .filter((p) => p.schedule.find((s) => s.date === day.date)?.morning)
          .map((p) => p.id);
        if (morningIds.length > 0) {
          allocationRequests.push({ date: day.date, session: 'morning', participantIds: morningIds });
        }

        const afternoonIds = participants
          .filter((p) => p.schedule.find((s) => s.date === day.date)?.afternoon)
          .map((p) => p.id);
        if (afternoonIds.length > 0) {
          allocationRequests.push({ date: day.date, session: 'afternoon', participantIds: afternoonIds });
        }
      }

      // 2. Fetch existing bookings from storage to check current Kund occupancies
      const existingBookings = getStoredBookings();

      // 3. Run Best-Fit deterministic allocation engine
      const result = allocateBestFitKunds(allocationRequests, existingBookings);

      if (!result.success) {
        setAllocationError(result.error || 'Allocation failed due to capacity constraints.');
        setIsSubmitting(false);
        return;
      }

      // 4. Generate unique Booking ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newBookingId = `MY-2026-${randomSuffix}`;

      const newBooking: Booking = {
        id: newBookingId,
        createdAt: new Date().toISOString(),
        yagyakarta,
        participants,
        allocations: result.allocations,
        status: 'confirmed',
      };

      // 5. Save to storage
      addBooking(newBooking);

      // 6. Confetti celebration
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

      // 7. Route to Confirmation View
      onBookingComplete(newBooking);
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
            participants={participants}
            setParticipants={setParticipants}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
            lang={lang}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            yagyakarta={yagyakarta}
            participants={participants}
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
