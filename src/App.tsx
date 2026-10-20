import React from 'react';
import { Header } from './components/Header';
import { BannerHero } from './components/BannerHero';
import { RegistrationWizard } from './components/Registration/RegistrationWizard';
import { PassCard } from './components/PassCard';
import { BookingRetrieval } from './components/BookingRetrieval';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { DesignSpecModal } from './components/DesignSpecModal';
import { Booking, AdminUser } from './types';
import { getStoredBookings } from './services/storageService';
import { getCurrentAdminSession, setCurrentAdminSession } from './services/adminService';
import { EVENT_DETAILS } from './data/eventConfig';
import { Shield, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'register' | 'retrieve' | 'admin'>('register');
  const [lang, setLang] = React.useState<'en' | 'hi'>('hi');
  const [confirmedBooking, setConfirmedBooking] = React.useState<Booking | null>(null);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isSpecModalOpen, setIsSpecModalOpen] = React.useState(false);
  
  // Individual Admin Session state
  const [currentAdmin, setCurrentAdmin] = React.useState<AdminUser | null>(getCurrentAdminSession());
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = React.useState(false);

  const isAdminLoggedIn = Boolean(currentAdmin);

  // Track if user has entered the multi-step registration flow (Step 1-4)
  const [isActivelyRegistering, setIsActivelyRegistering] = React.useState(false);

  // Load bookings from storage
  React.useEffect(() => {
    setBookings(getStoredBookings());
  }, []);

  const handleBookingComplete = (newBooking: Booking) => {
    setConfirmedBooking(newBooking);
    setIsActivelyRegistering(false);
    setBookings(getStoredBookings());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartRegistration = () => {
    setConfirmedBooking(null);
    setActiveTab('register');
    setIsActivelyRegistering(true);
    const wizardEl = document.getElementById('registration-wizard-card');
    if (wizardEl) {
      wizardEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setCurrentAdminSession(admin);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    setCurrentAdminSession(null);
    setActiveTab('register');
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      
      {/* 3-Zone Header (Strictly Public unless admin is logged in) */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'register') {
            setConfirmedBooking(null);
            setIsActivelyRegistering(false);
          }
          setActiveTab(tab);
        }}
        lang={lang}
        setLang={setLang}
        isAdminLoggedIn={isAdminLoggedIn}
        currentAdmin={currentAdmin}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* PUBLIC REGISTRATION TAB */}
        {activeTab === 'register' && (
          <div>
            {confirmedBooking ? (
              <PassCard
                booking={confirmedBooking}
                onBackToHome={() => {
                  setConfirmedBooking(null);
                  setIsActivelyRegistering(false);
                  setActiveTab('register');
                }}
                lang={lang}
              />
            ) : (
              <div>
                {/* Clean Unobstructed Banner & Simplified Landing Hero */}
                <BannerHero
                  onStartRegistration={handleStartRegistration}
                  onOpenRetrieve={() => {
                    setIsActivelyRegistering(false);
                    setActiveTab('retrieve');
                  }}
                  lang={lang}
                />

                {/* Registration Wizard Section */}
                <div id="registration-wizard-card">
                  <RegistrationWizard
                    onBookingComplete={handleBookingComplete}
                    lang={lang}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOOKING RETRIEVAL & E-PASS TAB */}
        {activeTab === 'retrieve' && (
          <BookingRetrieval
            onBackToHome={() => {
              setConfirmedBooking(null);
              setIsActivelyRegistering(false);
              setActiveTab('register');
            }}
            lang={lang}
          />
        )}

        {/* ADMIN OCCUPANCY MONITOR & OPERATIONS TAB (Strictly gated by login) */}
        {activeTab === 'admin' && currentAdmin && (
          <AdminDashboard
            bookings={bookings}
            currentAdmin={currentAdmin}
            onBookingsUpdated={(updated) => setBookings(updated)}
            onLogout={handleAdminLogout}
            lang={lang}
          />
        )}

      </main>

      {/* Admin Login Modal (Triggered unobtrusively) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
      />

      {/* Full Product Design Blueprint Modal */}
      <DesignSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        lang={lang}
      />

      {/* MINIMAL FOOTER: NEVER SHOWN DURING FORM REGISTRATION OR ON PASS (Ends cleanly after primary action) */}
      {(!confirmedBooking && activeTab !== 'admin' && !isActivelyRegistering) && (
        <footer className="bg-stone-900 text-stone-400 py-6 border-t border-stone-800 text-xs print:hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-semibold text-stone-300">
                2151 Kundiya Mrityunjay Maa Pitambara Mahayagya, Agra (14–21 Dec 2026)
              </span>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Helpline: +91 94120 12151 · JCB Tiraha, Shastripuram, Agra
              </div>
            </div>

            {/* Unobtrusive secondary links (Admin Login + Design Spec) */}
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsSpecModalOpen(true)}
                className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Design Spec</span>
              </button>

              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setActiveTab('admin');
                  } else {
                    setIsAdminLoginModalOpen(true);
                  }
                }}
                className="hover:text-stone-200 text-stone-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isAdminLoggedIn ? `Admin (${currentAdmin?.name?.split(' ')[0]})` : 'Organizer Login'}</span>
              </button>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
