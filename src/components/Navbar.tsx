import React, { useState } from 'react';
import { Shield, BookOpen, Compass, Calendar, MapPin, Users, Award, Bell, Sun, Moon, Menu, X, ChevronDown, Globe } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  unreadCount: number;
  onOpenNotif: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  onOpenLogin,
  unreadCount,
  onOpenNotif,
  theme,
  onToggleTheme
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const visibleTabs = [
    { id: 'home', label: 'Beranda', icon: Compass },
    { id: 'profil', label: 'Profil', icon: BookOpen },
    { id: 'berita', label: 'Berita', icon: Shield },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'kampung_pramuka', label: 'Sebaran KP', icon: Globe },
  ];

  const dropdownTabs = [
    { id: 'kwarran', label: 'Kwarran', icon: MapPin },
    { id: 'saka', label: 'Saka', icon: Award },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'kampung_pramuka') {
      setCurrentTab('home');
      setTimeout(() => {
        const element = document.getElementById('peta-sebaran');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setCurrentTab(tabId);
    }
    setIsDropdownOpen(false);
  };

  const isDropdownActive = dropdownTabs.some(tab => tab.id === currentTab);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setCurrentTab('home')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-purple-500/30 overflow-hidden shadow-lg p-1 hover:border-[#D4AF37]/50 transition-colors duration-300">
              <img 
                src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
                alt="Logo Kwarcab Kab. Tasikmalaya" 
                className="w-full h-full object-contain rounded-full transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase font-heading whitespace-nowrap">
                Kwartir Cabang <span className="text-[#D4AF37]">Kab. Tasikmalaya</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-purple-300 font-medium tracking-wide whitespace-nowrap">
                Gerakan Pramuka Indonesia
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Public) - Hidden on smaller screens to prevent wrapping */}
          <div className="hidden lg:flex items-center space-x-1">
            {currentTab === 'admin' ? null : (
              <>
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/30 text-white border-b-2 border-[#D4AF37] shadow-lg shadow-purple-500/10'
                          : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-purple-300'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                {/* Dropdown Menu "Lainnya" for Kwarran & Saka */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isDropdownActive
                        ? 'bg-purple-600/30 text-white border-b-2 border-[#D4AF37] shadow-lg shadow-purple-500/10'
                        : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>Lainnya</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#D4AF37]' : 'text-purple-300'}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Transparent Click-away overlay */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      
                      {/* Dropdown menu list */}
                      <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-white/20 bg-[#0F0A1A]/95 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        {dropdownTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = currentTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleTabClick(tab.id)}
                              className={`flex items-center space-x-2.5 w-full px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-purple-600/20 text-[#D4AF37]'
                                  : 'text-purple-200 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-purple-300'}`} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Action / Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-purple-200 hover:text-white"
              title={theme === 'dark' ? 'Mode Terang (Putih)' : 'Mode Gelap (Malam)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[#D4AF37]" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600" />
              )}
            </button>

            {/* Desktop Auth Section */}
            {user ? (
              <div className="hidden lg:flex items-center space-x-3">
                {/* Notification Bell */}
                <button 
                  onClick={onOpenNotif}
                  className="relative p-2 rounded-lg text-purple-200 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>

                <div className="text-right hidden xl:block">
                  <div className="text-xs font-semibold text-white whitespace-nowrap">{user.nama}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-semibold whitespace-nowrap">{user.role}</div>
                </div>

                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 whitespace-nowrap ${
                    currentTab === 'admin'
                      ? 'bg-[#D4AF37] text-[#0F0A1A] border-[#D4AF37] hover:bg-[#D4AF37]/90'
                      : 'bg-purple-900/40 text-purple-200 border-purple-500/30 hover:bg-purple-900/60'
                  }`}
                >
                  Portal Dashboard
                </button>

                <button
                  onClick={onLogout}
                  className="text-xs font-medium text-purple-300 hover:text-red-400 px-2 py-1 bg-white/5 rounded hover:bg-red-500/10 transition-all duration-200 whitespace-nowrap"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="hidden lg:block">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-purple-950 hover:from-purple-600 hover:to-purple-900 text-white font-semibold text-xs tracking-wider uppercase border border-purple-500/40 hover:border-purple-400/60 shadow-lg shadow-purple-900/30 active:scale-95 transition-all duration-200 whitespace-nowrap"
                >
                  <span>Masuk Portal</span>
                </button>
              </div>
            )}

            {/* Mobile Actions: Notification bell if logged in */}
            {user && (
              <div className="lg:hidden flex items-center">
                <button 
                  onClick={onOpenNotif}
                  className="relative p-2 rounded-lg text-purple-200 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Hamburger Button (Strip 3) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-purple-200 hover:text-white"
              title="Menu Utama"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0F0A1A]/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          <div className="px-4 pt-3 pb-5 space-y-1">
            {/* Nav Links in Mobile */}
            {currentTab === 'admin' ? null : (
              [
                { id: 'home', label: 'Beranda', icon: Compass },
                { id: 'profil', label: 'Profil', icon: BookOpen },
                { id: 'berita', label: 'Berita', icon: Shield },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'kampung_pramuka', label: 'Sebaran KP', icon: Globe },
                { id: 'kwarran', label: 'Kwarran', icon: MapPin },
                { id: 'saka', label: 'Saka', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabClick(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-600/30 text-white border-l-4 border-[#D4AF37] font-semibold'
                        : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'text-purple-300'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })
            )}

            <div className="border-t border-white/10 my-3 pt-3"></div>

            {/* Auth / Profile Actions in Mobile */}
            {user ? (
              <div className="space-y-3 px-2">
                <div className="py-1">
                  <div className="text-sm font-semibold text-white">{user.nama}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">{user.role}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCurrentTab('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all duration-200 ${
                      currentTab === 'admin'
                        ? 'bg-[#D4AF37] text-[#0F0A1A] border-[#D4AF37]'
                        : 'bg-purple-900/40 text-purple-200 border-purple-500/30 hover:bg-purple-900/60'
                    }`}
                  >
                    Portal Dashboard
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 text-xs font-medium text-center text-red-200 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 rounded-xl transition-all duration-200"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-2 pt-1">
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-purple-950 hover:from-purple-600 hover:to-purple-900 text-white font-semibold text-xs tracking-wider uppercase border border-purple-500/40 shadow-lg transition-all duration-200"
                >
                  <span>Masuk Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
