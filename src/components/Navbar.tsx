import React, { useState } from 'react';
import { Shield, BookOpen, Compass, Calendar, MapPin, Users, Award, Bell, Menu, X, ChevronDown, Globe, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  unreadCount: number;
  onOpenNotif: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  onOpenLogin,
  unreadCount,
  onOpenNotif
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
    <div className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <nav className="max-w-7xl mx-auto bg-white rounded-full shadow-lg border border-gray-100 pointer-events-auto">
        <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-6 gap-1 sm:gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setCurrentTab('home')}>
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 overflow-hidden shadow-sm shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
                alt="Logo Kwarcab" 
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] sm:text-sm font-black tracking-wide text-gray-900 uppercase font-heading whitespace-nowrap">
                Kwartir Cabang
              </div>
              <div className="text-[8px] sm:text-[10px] text-green-700 font-bold tracking-wide whitespace-nowrap leading-none mt-0.5">
                KAB. TASIKMALAYA
              </div>
              <div className="hidden sm:block text-[8px] text-gray-500 font-medium tracking-wide whitespace-nowrap leading-tight mt-0.5">
                Gerakan Pramuka Indonesia
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Public) */}
          <div className="hidden lg:flex items-center space-x-2">
            {currentTab === 'admin' ? null : (
              <>
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-green-700 text-white shadow-md'
                          : 'text-gray-600 hover:text-green-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                {/* Dropdown Menu "Lainnya" */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isDropdownActive
                        ? 'bg-green-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-green-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Lainnya</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50">
                        {dropdownTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = currentTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleTabClick(tab.id)}
                              className={`flex items-center space-x-2.5 w-full px-5 py-2.5 text-left text-xs font-bold transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
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
          <div className="flex items-center space-x-3 shrink-0">
            {/* Desktop Auth Section */}
            {user ? (
              <div className="hidden lg:flex items-center space-x-3">
                <button 
                  onClick={onOpenNotif}
                  className="relative p-2 rounded-full text-gray-500 hover:text-green-700 hover:bg-gray-100 transition-all duration-200"
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
                  <div className="text-xs font-bold text-gray-900">{user.nama}</div>
                  <div className="text-[9px] uppercase tracking-wider text-green-600 font-bold">{user.role}</div>
                </div>

                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    currentTab === 'admin'
                      ? 'bg-green-700 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  onClick={onLogout}
                  className="text-xs font-bold text-gray-500 hover:text-red-600 px-3 py-2 rounded-full hover:bg-red-50 transition-all duration-200"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-6 py-1.5 sm:py-2.5 rounded-full bg-green-700 hover:bg-green-800 text-white font-bold text-[8px] sm:text-xs tracking-wide uppercase shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
                >
                  <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Masuk Portal</span>
                </button>
              </div>
            )}

            {/* Mobile Actions */}
            {user && (
              <div className="lg:hidden flex items-center">
                <button 
                  onClick={onOpenNotif}
                  className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 rounded-2xl bg-white shadow-xl border border-gray-100 pointer-events-auto overflow-hidden animate-in slide-in-from-top-2 duration-150 mx-auto max-w-md">
          <div className="px-4 py-3 space-y-1">
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
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })
            )}

            <div className="border-t border-gray-100 my-2"></div>

            {user ? (
              <div className="space-y-2 p-2">
                <div className="mb-2">
                  <div className="text-sm font-bold text-gray-900">{user.nama}</div>
                  <div className="text-[10px] uppercase text-green-600 font-bold">{user.role}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCurrentTab('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-green-50 text-green-700"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 bg-red-50"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-green-700 text-white font-bold text-sm tracking-wide uppercase shadow-md"
                >
                  Masuk Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
