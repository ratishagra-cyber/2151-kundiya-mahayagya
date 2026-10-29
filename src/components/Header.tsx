import React from 'react';
import { Flame, Ticket, Users, Menu, X, Shield, LogOut } from 'lucide-react';
import { AdminUser } from '../types';

interface HeaderProps {
  activeTab: 'register' | 'retrieve' | 'admin';
  setActiveTab: (tab: 'register' | 'retrieve' | 'admin') => void;
  lang: 'en' | 'hi';
  setLang: (lang: 'en' | 'hi') => void;
  isAdminLoggedIn: boolean;
  currentAdmin?: AdminUser | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isAdminLoggedIn,
  currentAdmin,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Pure public tabs visible to regular devotees
  const publicNavItems = [
    {
      id: 'register' as const,
      labelEn: 'Family Registration',
      labelHi: 'यज्ञ पंजीकरण',
      icon: Users,
    },
    {
      id: 'retrieve' as const,
      labelEn: 'Find Your Pass',
      labelHi: 'प्रवेश पत्र देखें',
      icon: Ticket,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Zone 1: Clean Brand Wordmark */}
          <div
            onClick={() => setActiveTab('register')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-900 flex items-center justify-center text-white shadow-xs group-hover:bg-rose-950 transition-colors">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300/40" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-stone-900 tracking-tight font-serif">
                  {lang === 'hi' ? '2151 कुंडीय महायज्ञ' : '2151 Kundiya Mahayagya'}
                </span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Agra
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Strictly Public) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-rose-900 text-amber-50 shadow-2xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                  <span>{lang === 'hi' ? item.labelHi : item.labelEn}</span>
                </button>
              );
            })}

            {/* ONLY show Admin Console tab if Admin is actively logged in */}
            {isAdminLoggedIn && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-stone-900 text-amber-200 shadow-2xs'
                    : 'text-rose-900 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-700" />
                <span>{lang === 'hi' ? 'प्रबंधन कंसोल' : 'Admin Console'}</span>
                {currentAdmin && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400 text-stone-950 font-bold uppercase">
                    {currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Operator'}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: Language Toggle & Admin State */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-900 transition-colors bg-stone-50 cursor-pointer"
              title="Toggle Hindi / English"
            >
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>

            {/* If Admin is logged in, show logout affordance */}
            {isAdminLoggedIn && (
              <button
                onClick={onAdminLogout}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 transition-colors"
                title="Log out of Admin"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit Admin</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-rose-900 text-amber-50'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                <span>{lang === 'hi' ? item.labelHi : item.labelEn}</span>
              </button>
            );
          })}

          {isAdminLoggedIn ? (
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-900 bg-rose-50"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Operations Console</span>
              </button>
              <button
                onClick={() => {
                  onAdminLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-stone-500 hover:text-rose-700"
              >
                Exit Admin Mode
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  onOpenAdminLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-stone-400" />
                <span>Organizer / Admin Access</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
