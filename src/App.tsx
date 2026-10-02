import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Shield, Award, Users, Calendar, BookOpen, MapPin, 
  ChevronRight, ArrowUpRight, Activity, HelpCircle, User, 
  Key, LogOut, CheckCircle2, Lock, Building, AlertCircle, X,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import LandingBeritaStrip from './components/LandingBeritaStrip';
import SosmedButtons from './components/SosmedButtons';
import { sanitizeSosmed } from './utils/sosmed';
import LandingProfil from './components/LandingProfil';
import LandingBerita from './components/LandingBerita';
import LandingKwarranSaka from './components/LandingKwarranSaka';
import LandingAgenda from './components/LandingAgenda';
import LandingMap from './components/LandingMap';
import LandingKampungPramukaDetail from './components/LandingKampungPramukaDetail';
import AdminPortal from './components/AdminPortal';
import ValidasiKTA from './components/ValidasiKTA';
import { ProfilKwarcab, PimpinanKwarcab, Berita, Agenda, KwartirRanting, SatuanKarya, User as UserType, KampungPramuka } from './types';

const readApiJson = async (res: Response) => {
  const text = await res.text();
  if (!text) {
    throw new Error('Server API tidak mengembalikan data. Pastikan aplikasi dibuka dari npm run dev/start di port backend, bukan dari preview/static server.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server API tidak mengembalikan JSON yang valid. Kalau di Vercel, cek Functions Logs dan buka /api/public/runtime untuk diagnosa.');
  }
};

const readPublicJson = async (res: Response, label: string) => {
  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Gagal mengambil data ${label}`);
  }
  return data;
};

const ensureArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value : [];

export default function App() {
  // Public tabs: home, profil, berita, kwarran, saka, agenda, admin, validasi
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [validasiId, setValidasiId] = useState<string>('');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light-mode');
      root.style.colorScheme = 'dark';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Initial Route Check
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/validasi-kta/')) {
      const id = path.split('/validasi-kta/')[1];
      if (id) {
        setValidasiId(id);
        setCurrentTab('validasi');
      }
    }
  }, []);
  
  // Auth state — persisted in localStorage so refresh keeps admin logged in
  const [user, setUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('kwarcab_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('kwarcab_token') || '';
  });
  
  // Data states
  const [profil, setProfil] = useState<ProfilKwarcab | null>(null);
  const [pimpinan, setPimpinan] = useState<PimpinanKwarcab[]>([]);
  const [berita, setBerita] = useState<Berita[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [kwarran, setKwarran] = useState<KwartirRanting[]>([]);
  const [saka, setSaka] = useState<SatuanKarya[]>([]);
  const [selectedBerita, setSelectedBeritaState] = useState<Berita | null>(null);
  const [selectedKp, setSelectedKp] = useState<KampungPramuka | null>(null);
  const [selectedKwarranId, setSelectedKwarranId] = useState<string | null>(null);
  const [selectedSakaId, setSelectedSakaId] = useState<string | null>(null);
  const [kampungPramuka, setKampungPramuka] = useState<KampungPramuka[]>([]);

  // Pilih/batalkan berita + selalu sinkronkan URL (?berita=<id>) supaya link yang
  // dibagikan (WhatsApp/Facebook/Twitter/copy link) mengarah langsung ke berita tsb.
  const setSelectedBerita = (b: Berita | null) => {
    setSelectedBeritaState(b);
    const url = new URL(window.location.href);
    if (b) {
      url.searchParams.set('berita', b.id);
    } else {
      url.searchParams.delete('berita');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Public Verification State
  const [verifiedMember, setVerifiedMember] = useState<any | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Floating selector for quick evaluation

  // Load all public data
  const loadPublicData = async (bypassCache = false) => {
    try {
      const res = await fetch(bypassCache ? `/api/public/all?t=${Date.now()}` : '/api/public/all', { cache: 'no-store' });
      const all = await readPublicJson(res, 'data publik');
      const profilData = all?.profil;
      const pimpinanData = all?.pimpinan;
      const beritaData = all?.berita;
      const agendaData = all?.agenda;
      const kwarranData = all?.kwarran;
      const sakaData = all?.saka;
      const kpData = all?.kampungPramuka;

      setProfil(profilData);
      setPimpinan(ensureArray<PimpinanKwarcab>(pimpinanData));
      setBerita(ensureArray<Berita>(beritaData));
      setAgenda(ensureArray<Agenda>(agendaData));
      setKwarran(ensureArray<KwartirRanting>(kwarranData));
      setSaka(ensureArray<SatuanKarya>(sakaData));
      setKampungPramuka(ensureArray<KampungPramuka>(kpData));
    } catch (err) {
      console.error('Gagal mengambil data publik:', err);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  // Restore admin tab if user is already logged in from localStorage
  useEffect(() => {
    if (user && token) {
      // Verify the token is still valid against the server
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) {
          // Token valid — restore admin view
          setCurrentTab('admin');
        } else {
          // Token expired or invalid — clear session silently
          localStorage.removeItem('kwarcab_token');
          localStorage.removeItem('kwarcab_user');
          setUser(null);
          setToken('');
        }
      }).catch(() => {
        // Server not reachable — keep user logged in optimistically
        setCurrentTab('admin');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buka berita spesifik jika URL membawa ?berita=<id> (mis. dari link yang dibagikan)
  const deepLinkBeritaApplied = useRef(false);
  useEffect(() => {
    if (deepLinkBeritaApplied.current) return;
    if (berita.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const beritaId = params.get('berita');
    if (beritaId) {
      const found = berita.find(b => b.id === beritaId);
      if (found) {
        setSelectedBeritaState(found);
        setCurrentTab('berita');
      }
    }
    deepLinkBeritaApplied.current = true;
  }, [berita]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get('verify');
    if (verifyId) {
      setVerifyLoading(true);
      setShowVerifyModal(true);
      fetch(`/api/public/verify-anggota/${verifyId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Data anggota tidak ditemukan atau belum disetujui di Pusdatin Kwarcab.');
          }
          return res.json();
        })
        .then(data => {
          setVerifiedMember(data);
          setVerifyError(null);
          setVerifyLoading(false);
        })
        .catch(err => {
          setVerifyError(err.message);
          setVerifyLoading(false);
        });
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Autentikasi gagal');

      setUser(data.user);
      setToken(data.token);
      // Persist session so refresh doesn't log out
      localStorage.setItem('kwarcab_token', data.token);
      localStorage.setItem('kwarcab_user', JSON.stringify(data.user));
      setShowLoginModal(false);
      setCurrentTab('admin');
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    // Only called when admin explicitly clicks "Keluar"
    localStorage.removeItem('kwarcab_token');
    localStorage.removeItem('kwarcab_user');
    setUser(null);
    setToken('');
    setCurrentTab('home');
  };

  const featuredNews = berita.filter(b => b.is_featured && b.status === 'approved');
  const approvedNews = berita.filter(b => b.status === 'approved');

  // Kartu kecil di bawah hero: berita lain (bukan yang sedang tampil di slide), maks. 6.
  // Jika hero statis / tidak ada berita sorotan, semua berita terbaru boleh tampil.
  const heroShowsSlides = (profil?.hero_mode || 'dinamis') === 'dinamis' && featuredNews.length > 0;
  const stripNews = approvedNews.filter(b => !heroShowsSlides || !b.is_featured).slice(0, 6);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Background stars / ambient dots */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0"></div>

      {/* Header / Navbar (Hidden in Admin Portal) */}
      {currentTab !== 'admin' && (
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={(tab) => {
            if (tab === 'berita') setSelectedBerita(null);
            if (tab === 'kwarran') setSelectedKwarranId(null);
            if (tab === 'saka') setSelectedSakaId(null);
            setSelectedKp(null);
            setCurrentTab(tab);
          }} 
          user={user} 
          onLogout={handleLogout} 
          onOpenLogin={() => setShowLoginModal(true)}
          unreadCount={0}
          onOpenNotif={() => setCurrentTab('admin')} 
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        />
      )}


      {/* MAIN VIEWPORT */}
      <main className="flex-grow z-10">
        
        {/* --- PORTAL LANDING: HOME --- */}
        {currentTab === 'home' && (
          <div className="animate-fade-in space-y-20">
            {/* Hero + kartu berita kecil di bawahnya */}
            <div>
              <LandingHero 
                profil={profil} 
                featuredNews={featuredNews} 
                onSelectBerita={(b) => {
                  setSelectedBerita(b);
                  setCurrentTab('berita');
                }}
                onNavigateToTab={(tab) => {
                  if (tab === 'berita') {
                    setSelectedBerita(null);
                  }
                  setCurrentTab(tab);
                }}
              />
              <LandingBeritaStrip
                news={stripNews}
                onSelectBerita={(b) => {
                  setSelectedBerita(b);
                  setCurrentTab('berita');
                }}
                onSeeAll={() => {
                  setSelectedBerita(null);
                  setCurrentTab('berita');
                }}
              />
            </div>

            {/* Quick Stats Grid section (No AI template look, pure premium bento design) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Card 1 */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-green-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-105 transition-transform">
                    <Users className="w-24 h-24 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">Sistem Pendataan Terpusat</h3>
                  <p className="text-xs text-gray-500 mt-2 font-light leading-relaxed">
                    Data keanggotaan Pramuka dari ribuan gugus depan dan puluhan kwartir ranting di Kabupaten Tasikmalaya terhimpun secara akurat dalam basis data terintegrasi.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-yellow-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-105 transition-transform">
                    <Award className="w-24 h-24 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">Pembinaan Krida Saka</h3>
                  <p className="text-xs text-gray-500 mt-2 font-light leading-relaxed">
                    Memberikan kesempatan emas bagi Pramuka Penegak &amp; Pandega untuk mengasah keahlian taktis melalui berbagai rumpun Satuan Karya Pramuka khusus.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-105 transition-transform">
                    <Activity className="w-24 h-24 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">Sinergitas Informasi</h3>
                  <p className="text-xs text-gray-500 mt-2 font-light leading-relaxed">
                    Setiap jenjang kwartir diberikan otoritas mandiri untuk mengunggah rilis warta kegiatan kepanduan resmi yang diverifikasi langsung oleh Kwarcab Tasikmalaya.
                  </p>
                </div>

              </div>
            </section>
            {/* All Sections rendered vertically on Home Page */}
            <div className="bg-white">
               <LandingProfil profil={profil} pimpinan={pimpinan} />
            </div>
            
            <div className="bg-gray-50 border-y border-gray-100">
               <LandingBerita 
                 berita={berita} 
                 selectedBerita={selectedBerita} 
                 setSelectedBerita={setSelectedBerita} 
               />
            </div>

            <div className="bg-white">
               <LandingKwarranSaka 
                 type="kwarran" 
                 items={kwarran} 
                 onSelectId={(id) => {
                   setSelectedKwarranId(id);
                   if (id) setCurrentTab('kwarran');
                 }}
               />
            </div>
            
            <div className="bg-gray-50 border-y border-gray-100">
               <LandingKwarranSaka 
                 type="saka" 
                 items={saka} 
                 onSelectId={(id) => {
                   setSelectedSakaId(id);
                   if (id) setCurrentTab('saka');
                 }}
               />
            </div>

            <div className="bg-white">
               <LandingAgenda agenda={agenda} />
            </div>

            {/* Interactive Sebaran Kampung Pramuka Map section */}
            <LandingMap 
              items={kampungPramuka} 
              onSelectKp={(kp) => {
                setSelectedKp(kp);
                setCurrentTab('kampung-pramuka');
              }}
            />
          </div>
        )}

        {/* --- PORTAL LANDING: PROFIL --- */}
        {currentTab === 'profil' && (
          <div className="animate-fade-in">
            <LandingProfil profil={profil} pimpinan={pimpinan} />
          </div>
        )}

        {/* --- PORTAL LANDING: BERITA --- */}
        {currentTab === 'berita' && (
          <div className="animate-fade-in">
            <LandingBerita 
              berita={berita} 
              selectedBerita={selectedBerita} 
              setSelectedBerita={setSelectedBerita} 
            />
          </div>
        )}

        {/* --- PORTAL LANDING: KWARTRAN --- */}
        {currentTab === 'kwarran' && (
          <div className="animate-fade-in">
            <LandingKwarranSaka 
              type="kwarran" 
              items={kwarran} 
              externalSelectedId={selectedKwarranId}
              onSelectId={(id) => {
                setSelectedKwarranId(id);
                if (!id) setCurrentTab('home');
              }}
            />
          </div>
        )}

        {/* --- PORTAL LANDING: SAKA --- */}
        {currentTab === 'saka' && (
          <div className="animate-fade-in">
            <LandingKwarranSaka 
              type="saka" 
              items={saka} 
              externalSelectedId={selectedSakaId}
              onSelectId={(id) => {
                setSelectedSakaId(id);
                if (!id) setCurrentTab('home');
              }}
            />
          </div>
        )}

        {/* --- PORTAL LANDING: AGENDA --- */}
        {currentTab === 'agenda' && (
          <div className="animate-fade-in">
            <LandingAgenda agenda={agenda} />
          </div>
        )}

        {/* --- PORTAL LANDING: KAMPUNG PRAMUKA DETAIL --- */}
        {currentTab === 'kampung-pramuka' && selectedKp && (
          <div className="animate-fade-in">
            <LandingKampungPramukaDetail 
              kp={selectedKp} 
              onBack={() => {
                setSelectedKp(null);
                setCurrentTab('home');
                window.scrollTo(0, 0);
              }}
            />
          </div>
        )}

        {/* --- SECURE PORTAL ADMIN: DASHBOARD (Multi-role workspace) --- */}
        {currentTab === 'admin' && (
          <div className="animate-fade-in">
            {user ? (
              <AdminPortal 
                user={user} 
                token={token} 
                onRefreshData={() => loadPublicData(true)} 
                allKwarran={kwarran} 
                allSaka={saka} 
                onBackToLanding={() => setCurrentTab('home')}
                onLogout={handleLogout}
              />
            ) : (
              <div className="py-24 text-center max-w-md mx-auto px-4">
                <Lock className="w-12 h-12 text-green-700 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-900 font-heading">Akses Portal Admin Terkunci</h3>
                <p className="text-xs text-gray-600 mt-2 font-light leading-relaxed">
                  Halaman ini dikhususkan untuk pengurus Kwartir Cabang, Kwartir Ranting, Gugus Depan, dan Satuan Karya Pramuka untuk mengelola basis data terintegrasi.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-green-500/10 active:scale-95 transition-all flex items-center justify-center mx-auto"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Masuk Portal Admin
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- VALIDASI KTA --- */}
        {currentTab === 'validasi' && (
          <div className="animate-fade-in bg-white text-gray-900 min-h-screen">
            <ValidasiKTA id={validasiId} />
          </div>
        )}

      </main>

      {/* FOOTER */}
      {currentTab !== 'validasi' && (
        <footer className="z-10 border-t border-gray-200 bg-gray-50 py-12 text-xs text-gray-600 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 overflow-hidden shadow-sm p-1">
                <img 
                  src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
                  alt="Logo Kwarcab Kab. Tasikmalaya" 
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm text-green-800 tracking-wider">KWARCAB TASIKMALAYA</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide">Gerakan Pramuka Indonesia</span>
              </div>
            </div>
            <p className="font-light leading-relaxed text-gray-600">
              Sistem Basis Data Terpadu dan Portal Informasi Resmi Gerakan Pramuka Kwartir Cabang Kabupaten Tasikmalaya, Jawa Barat.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm p-1">
                <img 
                  src="https://lh3.googleusercontent.com/d/1lIpW-IUIUljA-sCXEloLp8Q1N3hJeymm" 
                  alt="Logo Pusdatin Kwarcab Kab. Tasikmalaya" 
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm text-green-800 tracking-wider">PUSDATIN KWARCAB</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide">Kab. Tasikmalaya</span>
              </div>
            </div>
            <p className="font-light leading-relaxed text-gray-600">
              Pengembang &amp; Pengelola IT: Pusat Data dan Informasi (Pusdatin) Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-4">Navigasi Portal</h4>
            <div className="space-y-2 font-light">
              <div><button onClick={() => setCurrentTab('home')} className="hover:text-green-700 transition-colors">Beranda Publik</button></div>
              <div><button onClick={() => setCurrentTab('profil')} className="hover:text-green-700 transition-colors">Visi &amp; Misi Kwarcab</button></div>
              <div><button onClick={() => { setSelectedBerita(null); setCurrentTab('berita'); }} className="hover:text-green-700 transition-colors">Warta Pramuka</button></div>
              <div><button onClick={() => setCurrentTab('kwarran')} className="hover:text-green-700 transition-colors">Pusat Kwarran</button></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-4">Informasi Kontak</h4>
            <p className="font-light leading-relaxed text-gray-600">
              Sekretariat Kwarcab Tasikmalaya<br />
              Kabupaten Tasikmalaya, Jawa Barat, Indonesia<br />
              Email: humas@kwarcabtasikmalaya.or.id
            </p>
            {Object.keys(sanitizeSosmed(profil?.sosmed)).length > 0 && (
              <div className="mt-5">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Ikuti Kami</h4>
                <SosmedButtons links={profil?.sosmed} variant="footer" />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-500">
          <span>&copy; {new Date().getFullYear()} Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya. Hak Cipta Dilindungi.</span>
          <div className="flex space-x-4">
            <span className="hover:text-gray-900 cursor-pointer transition-colors">Syarat &amp; Ketentuan</span>
            <span className="hover:text-gray-900 cursor-pointer transition-colors">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
      )}

      {/* --- SECURE AUTH LOGIN MODAL (Glassmorphism modal) --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[95vh] overflow-y-auto border border-gray-200 shadow-xl relative p-6 sm:p-8">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError('');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 flex flex-col items-center">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="relative w-14 h-14 rounded-full bg-white border-2 border-[#D4AF37]/80 p-1 flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
                    alt="Logo Kwarcab Kab. Tasikmalaya" 
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative w-14 h-14 rounded-full bg-white border-2 border-purple-500/80 p-1 flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1lIpW-IUIUljA-sCXEloLp8Q1N3hJeymm" 
                    alt="Logo Pusdatin" 
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <h4 className="text-xs font-black tracking-widest text-green-700 uppercase mb-1">
                PUSDATIN KWARCAB KAB. TASIKMALAYA
              </h4>
              <h3 className="text-lg font-bold text-gray-900 font-heading tracking-wide">Akses Portal Sinergi</h3>
              <p className="text-[11px] text-gray-500 mt-1 font-light">Masuk menggunakan email pengurus resmi Anda</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/20 text-red-300 text-xs flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Email Pengurus *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-gray-50 text-xs text-gray-900 px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none transition-all duration-200"
                  placeholder="pengurus@kwarcabtasik.id"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Kata Sandi (Password) *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-gray-50 text-xs text-gray-900 px-4 py-3 rounded-xl border border-gray-200 focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none transition-all duration-200"
                  placeholder="Ketik password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-xs tracking-wider uppercase border border-green-500/30 transition-all duration-200 shadow-sm"
              >
                Otorisasi Akses
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-500 text-center leading-relaxed">
              Belum memiliki akun pengurus? <br />
              <span className="text-gray-700 font-medium">Silakan hubungi Admin Kwartir Cabang Kabupaten Tasikmalaya.</span>
            </div>
          </div>
        </div>
      )}

      {/* --- PUBLIC PROFILE VERIFICATION MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-green-200 shadow-xl relative p-6 sm:p-8 text-center">
            <button
              onClick={() => {
                setShowVerifyModal(false);
                setVerifiedMember(null);
                setVerifyError(null);
                // Clear query string so scanning again works nicely
                const url = new URL(window.location.href);
                url.searchParams.delete('verify');
                window.history.replaceState({}, '', url.toString());
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {verifyLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-10 h-10 text-green-600 animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Memvalidasi surat keterangan di Pusdatin...</p>
              </div>
            ) : verifyError ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-2xl text-red-500">
                  ❌
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-heading">Verifikasi Gagal</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  {verifyError}
                </p>
                <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed mt-2">
                  Pastikan QR Code berasal dari Surat Keterangan resmi yang diterbitkan oleh sistem Pusdatin Kwarcab Tasikmalaya.
                </p>
              </div>
            ) : verifiedMember ? (
              <div className="space-y-6">
                {/* Header Verification Seal */}
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-0 animate-ping w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20"></div>
                  <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center text-2xl text-green-600 shadow-sm relative z-10 animate-bounce">
                    ✓
                  </div>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 font-black text-[9px] tracking-widest uppercase">
                      TERVERIFIKASI ASLI &amp; AKTIF
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 font-heading mt-2 uppercase tracking-wide">
                    SURAT KETERANGAN LEGALITAS
                  </h3>
                  <p className="text-xs text-gray-500 font-light max-w-sm mt-1">
                    Tercatat resmi pada basis data terpusat <strong className="text-green-700">Pusdatin Kwartir Cabang Tasikmalaya</strong>
                  </p>
                </div>

                <div className="border-t border-b border-gray-100 py-6 my-2 text-left space-y-4">
                  {/* Avatar / Photo placeholder in verification */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-20 h-24 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-200 to-transparent"></div>
                      <span className="text-[10px] text-gray-400 font-bold text-center leading-tight">FOTO<br/>RESMI</span>
                    </div>
                    <div className="flex-grow space-y-1.5 text-center sm:text-left">
                      <h4 className="text-base font-bold text-gray-900 tracking-wide">
                        {verifiedMember.anggota.nama_lengkap.toUpperCase()}
                      </h4>
                      <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">
                        {verifiedMember.anggota.golongan} ({verifiedMember.anggota.tingkatan})
                      </p>
                      <p className="text-xs text-gray-500 font-light">
                        ID Pusdatin: <span className="font-mono font-medium text-gray-900">{verifiedMember.anggota.id.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Tempat, Tanggal Lahir</span>
                      <span className="text-gray-900 font-medium block">{verifiedMember.anggota.tempat_lahir}, {verifiedMember.anggota.tanggal_lahir}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Gugus Depan / Pangkalan</span>
                      <span className="text-gray-900 font-medium block truncate" title={verifiedMember.anggota.pangkalan}>{verifiedMember.anggota.pangkalan}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Kwartir Ranting (Kwarran)</span>
                      <span className="text-gray-900 font-medium block">{verifiedMember.kwarran_nama}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Satuan Karya (Saka)</span>
                      <span className="text-gray-900 font-medium block">{verifiedMember.saka_nama || 'Belum Bergabung'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1 sm:col-span-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Alamat Terdaftar</span>
                      <span className="text-gray-900 font-light block">{verifiedMember.anggota.alamat_asal || 'Kabupaten Tasikmalaya'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-600 font-light flex items-center justify-center space-x-2 bg-green-50 p-3 rounded-xl border border-green-100">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Sertifikat ini dijamin keabsahannya oleh Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya.</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
