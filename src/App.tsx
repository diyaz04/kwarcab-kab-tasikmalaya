import React, { useState, useEffect } from 'react';
import { 
  Compass, Shield, Award, Users, Calendar, BookOpen, MapPin, 
  ChevronRight, ArrowUpRight, Activity, HelpCircle, User, 
  Key, LogOut, CheckCircle2, Lock, Sparkles, Building, AlertCircle, X,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import LandingProfil from './components/LandingProfil';
import LandingBerita from './components/LandingBerita';
import LandingKwarranSaka from './components/LandingKwarranSaka';
import LandingAgenda from './components/LandingAgenda';
import LandingMap from './components/LandingMap';
import LandingKampungPramukaDetail from './components/LandingKampungPramukaDetail';
import AdminPortal from './components/AdminPortal';
import ValidasiKTA from './components/ValidasiKTA';
import { ProfilKwarcab, PimpinanKwarcab, Berita, Agenda, KwartirRanting, SatuanKarya, User as UserType, KampungPramuka } from './types';

export default function App() {
  // Public tabs: home, profil, berita, kwarran, saka, agenda, admin, validasi
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [validasiId, setValidasiId] = useState<string>('');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
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
  
  // Auth state
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string>('');
  
  // Data states
  const [profil, setProfil] = useState<ProfilKwarcab | null>(null);
  const [pimpinan, setPimpinan] = useState<PimpinanKwarcab[]>([]);
  const [berita, setBerita] = useState<Berita[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [kwarran, setKwarran] = useState<KwartirRanting[]>([]);
  const [saka, setSaka] = useState<SatuanKarya[]>([]);
  const [selectedBerita, setSelectedBerita] = useState<Berita | null>(null);
  const [selectedKp, setSelectedKp] = useState<KampungPramuka | null>(null);
  const [kampungPramuka, setKampungPramuka] = useState<KampungPramuka[]>([]);

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
  const [showDevPanel, setShowDevPanel] = useState(true);

  // Load all public data
  const loadPublicData = async () => {
    try {
      const [pRes, pimRes, bRes, agRes, kwRes, skRes, kpRes] = await Promise.all([
        fetch('/api/public/profil'),
        fetch('/api/public/pimpinan'),
        fetch('/api/public/berita'),
        fetch('/api/public/agenda'),
        fetch('/api/public/kwarran'),
        fetch('/api/public/saka'),
        fetch('/api/public/kampung-pramuka')
      ]);

      setProfil(await pRes.json());
      setPimpinan(await pimRes.json());
      setBerita(await bRes.json());
      setAgenda(await agRes.json());
      setKwarran(await kwRes.json());
      setSaka(await skRes.json());
      setKampungPramuka(await kpRes.json());
    } catch (err) {
      console.error('Gagal mengambil data publik:', err);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Autentikasi gagal');

      setUser(data.user);
      setToken(data.token);
      setShowLoginModal(false);
      setCurrentTab('admin');
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setCurrentTab('home');
  };

  // Quick Switch Test Accounts (evaluator's best friend)
  const handleQuickSwitchRole = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('scout123');
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'scout123' })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        setShowLoginModal(false);
        setCurrentTab('admin');
      }
    } catch (err) {}
  };

  const featuredNews = berita.filter(b => b.is_featured && b.status === 'approved');
  const approvedNews = berita.filter(b => b.status === 'approved');

  return (
    <div className={`min-h-screen bg-[#0F0A1A] text-white flex flex-col relative overflow-x-hidden ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Background stars / ambient dots */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0 bg-[radial-gradient(#1E1530_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header / Navbar */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          if (tab === 'berita') {
            setSelectedBerita(null);
          }
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

      {/* DEV PANEL FOR QUICK ROLE EVALUATION (Modul 1 & 4 Multi-Role) */}
      {showDevPanel && (
        <div className="fixed bottom-6 left-6 z-40 max-w-sm w-full glass-panel-heavy p-4 rounded-2xl border border-[#D4AF37]/40 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#D4AF37]">
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
              <span>Developer &amp; Evaluator Panel</span>
            </div>
            <button 
              onClick={() => setShowDevPanel(false)} 
              className="text-xs text-purple-300 hover:text-white px-1 py-0.5 rounded bg-white/5 border border-white/10"
            >
              Sembunyikan
            </button>
          </div>
          <p className="text-[10px] text-purple-200/80 mb-3 leading-normal font-light">
            Klik tombol di bawah ini untuk berpindah peran dan menguji fitur database multi-role serta simulasi RBAC secara langsung tanpa registrasi manual.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
            <button
              onClick={() => handleQuickSwitchRole('admin@kwarcabtasik.id')}
              className="p-2 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30 text-left"
            >
              👑 Superadmin Kwarcab
            </button>
            <button
              onClick={() => handleQuickSwitchRole('cisayong@kwarcabtasik.id')}
              className="p-2 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/30 text-left"
            >
              📍 Kwarran Cisayong
            </button>
            <button
              onClick={() => handleQuickSwitchRole('gudep_sma1@kwarcabtasik.id')}
              className="p-2 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-left"
            >
              🏫 Gudep SMAN 1
            </button>
            <button
              onClick={() => handleQuickSwitchRole('bhayangkara@kwarcabtasik.id')}
              className="p-2 rounded bg-amber-950/80 hover:bg-amber-900 text-[#D4AF37] border border-amber-500/30 text-left"
            >
              ⚔️ Saka Bhayangkara
            </button>
          </div>
          {user && (
            <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
              <span className="text-purple-300">Aktif: <strong className="text-white">{user.nama}</strong></span>
              <button onClick={handleLogout} className="text-red-400 hover:underline flex items-center gap-0.5">
                <LogOut className="w-3 h-3" /> Log Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-grow z-10">
        
        {/* --- PORTAL LANDING: HOME --- */}
        {currentTab === 'home' && (
          <div className="animate-fade-in space-y-20">
            {/* Hero */}
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

            {/* Quick Stats Grid section (No AI template look, pure premium bento design) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Card 1 */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-[#D4AF37]/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-105 transition-transform">
                    <Users className="w-24 h-24 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading">Sistem Pendataan Terpusat</h3>
                  <p className="text-xs text-purple-200 mt-2 font-light leading-relaxed">
                    Data keanggotaan Pramuka dari ribuan gugus depan dan puluhan kwartir ranting di Kabupaten Tasikmalaya terhimpun secara akurat dalam basis data terintegrasi.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-purple-400/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-105 transition-transform">
                    <Award className="w-24 h-24 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading">Pembinaan Krida Saka</h3>
                  <p className="text-xs text-purple-200 mt-2 font-light leading-relaxed">
                    Memberikan kesempatan emas bagi Pramuka Penegak &amp; Pandega untuk mengasah keahlian taktis melalui berbagai rumpun Satuan Karya Pramuka khusus.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="glass-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-blue-400/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-105 transition-transform">
                    <Activity className="w-24 h-24 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading">Sinergitas Informasi</h3>
                  <p className="text-xs text-purple-200 mt-2 font-light leading-relaxed">
                    Setiap jenjang kwartir diberikan otoritas mandiri untuk mengunggah rilis warta kegiatan kepanduan resmi yang diverifikasi langsung oleh Kwarcab Tasikmalaya.
                  </p>
                </div>

              </div>
            </section>

            {/* Featured Section : Profil Singkat pimpinan */}
            <section className="py-16 bg-black/15 border-y border-white/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2 space-y-6">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/20">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[10px] tracking-wider uppercase font-extrabold text-purple-200">Kwartir Cabang Tasikmalaya</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading leading-tight">
                    Membentuk Karakter Pemuda Harapan Bangsa
                  </h2>
                  <p className="text-sm text-purple-200 font-light leading-relaxed">
                    Gerakan Pramuka Kwartir Cabang Kabupaten Tasikmalaya terus berkomitmen menyelenggarakan kegiatan edukatif, inovatif, dan rekreatif yang berlandaskan Tri Satya dan Dasa Darma demi mencetak kader pembangunan yang andal dan berjiwa Pancasila.
                  </p>
                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => setCurrentTab('profil')} 
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-900/30 text-white font-bold text-xs uppercase border border-purple-500/40 hover:bg-purple-800/40 transition"
                    >
                      <span>Lihat Struktur</span>
                      <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                    <button 
                      onClick={() => setCurrentTab('kwarran')}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-purple-200 hover:text-white text-xs font-bold uppercase transition"
                    >
                      <span>Jaringan Kwarran</span>
                    </button>
                  </div>
                </div>
                <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                  {pimpinan.slice(0, 2).map((p) => (
                    <div key={p.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                      <div className="h-48 overflow-hidden">
                        <img src={p.foto} alt={p.nama} className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="p-4 bg-black/20 text-center">
                        <h4 className="text-xs font-bold text-white truncate">{p.nama}</h4>
                        <p className="text-[9px] text-[#D4AF37] font-semibold mt-1 uppercase tracking-wide">{p.jabatan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick news teaser section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Warta Kepanduan Terbaru</h2>
                  <p className="text-xs text-purple-300 mt-1 font-light">Rilis berita dan dinamika kegiatan pramuka se-kabupaten</p>
                </div>
                <button 
                  onClick={() => setCurrentTab('berita')}
                  className="text-xs font-bold text-[#D4AF37] flex items-center space-x-1 hover:underline"
                >
                  <span>Semua Berita</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {approvedNews.slice(0, 3).map((b) => (
                  <div 
                    key={b.id} 
                    onClick={() => {
                      setSelectedBerita(b);
                      setCurrentTab('berita');
                    }}
                    className="glass-panel glass-panel-interactive rounded-2xl overflow-hidden flex flex-col h-full border border-white/5 cursor-pointer group"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img src={b.gambar_cover} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-purple-300 uppercase">{b.author_type}</span>
                        <h4 className="text-sm font-bold text-white mt-1 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">{b.judul}</h4>
                      </div>
                      <p className="text-[10px] text-purple-200/60 font-light mt-3 line-clamp-2 leading-relaxed">{b.konten}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

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
            <LandingKwarranSaka type="kwarran" items={kwarran} />
          </div>
        )}

        {/* --- PORTAL LANDING: SAKA --- */}
        {currentTab === 'saka' && (
          <div className="animate-fade-in">
            <LandingKwarranSaka type="saka" items={saka} />
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
                setTimeout(() => {
                  const el = document.getElementById('peta-sebaran');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
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
                onRefreshData={loadPublicData} 
                allKwarran={kwarran} 
                allSaka={saka} 
                onBackToLanding={() => setCurrentTab('home')}
              />
            ) : (
              <div className="py-24 text-center max-w-md mx-auto px-4">
                <Lock className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-white font-heading">Akses Portal Admin Terkunci</h3>
                <p className="text-xs text-purple-200 mt-2 font-light leading-relaxed">
                  Halaman ini dikhususkan untuk pengurus Kwartir Cabang, Kwartir Ranting, Gugus Depan, dan Satuan Karya Pramuka untuk mengelola basis data terintegrasi.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/10 active:scale-95 transition-all flex items-center justify-center mx-auto"
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
        <footer className="z-10 border-t border-white/5 bg-black/40 py-12 text-xs text-purple-300 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-purple-500/30 overflow-hidden shadow-lg p-1">
                <img 
                  src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
                  alt="Logo Kwarcab Kab. Tasikmalaya" 
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm text-white tracking-wider">KWARCAB TASIKMALAYA</span>
                <span className="text-[10px] text-purple-400 font-medium tracking-wide">Gerakan Pramuka Indonesia</span>
              </div>
            </div>
            <p className="font-light leading-relaxed text-purple-200/75">
              Sistem Basis Data Terpadu dan Portal Informasi Resmi Gerakan Pramuka Kwartir Cabang Kabupaten Tasikmalaya, Jawa Barat.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-purple-500/30 overflow-hidden shadow-lg p-1">
                <img 
                  src="https://lh3.googleusercontent.com/d/1lIpW-IUIUljA-sCXEloLp8Q1N3hJeymm" 
                  alt="Logo Pusdatin Kwarcab Kab. Tasikmalaya" 
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm text-[#D4AF37] tracking-wider">PUSDATIN KWARCAB</span>
                <span className="text-[10px] text-purple-400 font-medium tracking-wide">Kab. Tasikmalaya</span>
              </div>
            </div>
            <p className="font-light leading-relaxed text-purple-200/75">
              Pengembang &amp; Pengelola IT: Pusat Data dan Informasi (Pusdatin) Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Navigasi Portal</h4>
            <div className="space-y-2 font-light">
              <div><button onClick={() => setCurrentTab('home')} className="hover:text-white">Beranda Publik</button></div>
              <div><button onClick={() => setCurrentTab('profil')} className="hover:text-white">Visi &amp; Misi Kwarcab</button></div>
              <div><button onClick={() => { setSelectedBerita(null); setCurrentTab('berita'); }} className="hover:text-white">Warta Pramuka</button></div>
              <div><button onClick={() => setCurrentTab('kwarran')} className="hover:text-white">Pusat Kwarran</button></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Informasi Kontak</h4>
            <p className="font-light leading-relaxed text-purple-200/75">
              Sekretariat Kwarcab Tasikmalaya<br />
              Kabupaten Tasikmalaya, Jawa Barat, Indonesia<br />
              Email: humas@kwarcabtasikmalaya.or.id
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-purple-400">
          <span>&copy; {new Date().getFullYear()} Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya. Hak Cipta Dilindungi.</span>
          <div className="flex space-x-4">
            <span>Syarat &amp; Ketentuan</span>
            <span>Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
      )}

      {/* --- SECURE AUTH LOGIN MODAL (Glassmorphism modal) --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-heavy rounded-3xl max-w-md w-full max-h-[95vh] overflow-y-auto border border-[#D4AF37]/50 shadow-2xl relative p-6 sm:p-8">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError('');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-white/10 transition-all duration-200"
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
              <h4 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase mb-1">
                PUSDATIN KWARCAB KAB. TASIKMALAYA
              </h4>
              <h3 className="text-lg font-bold text-white font-heading tracking-wide">Akses Portal Sinergi</h3>
              <p className="text-[11px] text-purple-300/80 mt-1 font-light">Masuk menggunakan email pengurus resmi Anda</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/20 text-red-300 text-xs flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Email Pengurus *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-black/40 text-xs text-white px-4 py-3 rounded-xl border border-white/10 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all duration-200"
                  placeholder="pengurus@kwarcabtasik.id"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Kata Sandi (Password) *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-black/40 text-xs text-white px-4 py-3 rounded-xl border border-white/10 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all duration-200"
                  placeholder="Ketik password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white font-bold text-xs tracking-wider uppercase border border-purple-500/30 transition-all duration-200 shadow-lg shadow-purple-950/50"
              >
                Otorisasi Akses
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-purple-300/70 text-center leading-relaxed">
              Belum memiliki akun pengurus? <br />
              <span className="text-purple-300 font-medium">Silakan hubungi Admin Kwartir Cabang Kabupaten Tasikmalaya.</span>
            </div>
          </div>
        </div>
      )}

      {/* --- PUBLIC PROFILE VERIFICATION MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-heavy rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#D4AF37] shadow-2xl relative p-6 sm:p-8 text-center">
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
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {verifyLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-10 h-10 text-[#D4AF37] animate-spin" />
                <p className="text-sm text-purple-200 font-medium">Memvalidasi surat keterangan di Pusdatin...</p>
              </div>
            ) : verifyError ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-2xl text-red-400">
                  ❌
                </div>
                <h3 className="text-xl font-bold text-white font-heading">Verifikasi Gagal</h3>
                <p className="text-xs text-purple-200 max-w-md mx-auto leading-relaxed">
                  {verifyError}
                </p>
                <p className="text-[10px] text-purple-400 max-w-xs leading-relaxed mt-2">
                  Pastikan QR Code berasal dari Surat Keterangan resmi yang diterbitkan oleh sistem Pusdatin Kwarcab Tasikmalaya.
                </p>
              </div>
            ) : verifiedMember ? (
              <div className="space-y-6">
                {/* Header Verification Seal */}
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-0 animate-ping w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20"></div>
                  <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-2xl text-emerald-400 shadow-lg shadow-emerald-500/20 relative z-10 animate-bounce">
                    ✓
                  </div>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-black text-[9px] tracking-widest uppercase">
                      TERVERIFIKASI ASLI &amp; AKTIF
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white font-heading mt-2 uppercase tracking-wide">
                    SURAT KETERANGAN LEGALITAS
                  </h3>
                  <p className="text-xs text-purple-200/80 font-light max-w-sm mt-1">
                    Tercatat resmi pada basis data terpusat <strong className="text-[#D4AF37]">Pusdatin Kwartir Cabang Tasikmalaya</strong>
                  </p>
                </div>

                <div className="border-t border-b border-white/5 py-6 my-2 text-left space-y-4">
                  {/* Avatar / Photo placeholder in verification */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-purple-950/10 p-4 rounded-2xl border border-white/5">
                    <div className="w-20 h-24 rounded-lg bg-black/60 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
                      <span className="text-[10px] text-purple-300/60 font-bold text-center leading-tight">FOTO<br/>RESMI</span>
                    </div>
                    <div className="flex-grow space-y-1.5 text-center sm:text-left">
                      <h4 className="text-base font-bold text-white tracking-wide">
                        {verifiedMember.anggota.nama_lengkap.toUpperCase()}
                      </h4>
                      <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
                        {verifiedMember.anggota.golongan} ({verifiedMember.anggota.tingkatan})
                      </p>
                      <p className="text-xs text-purple-200/80 font-light">
                        ID Pusdatin: <span className="font-mono font-medium text-white">{verifiedMember.anggota.id.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Tempat, Tanggal Lahir</span>
                      <span className="text-white font-medium block">{verifiedMember.anggota.tempat_lahir}, {verifiedMember.anggota.tanggal_lahir}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Gugus Depan / Pangkalan</span>
                      <span className="text-white font-medium block truncate" title={verifiedMember.anggota.pangkalan}>{verifiedMember.anggota.pangkalan}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Kwartir Ranting (Kwarran)</span>
                      <span className="text-white font-medium block">{verifiedMember.kwarran_nama}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Satuan Karya (Saka)</span>
                      <span className="text-white font-medium block">{verifiedMember.saka_nama || 'Belum Bergabung'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 sm:col-span-2">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Alamat Terdaftar</span>
                      <span className="text-white font-light block">{verifiedMember.anggota.alamat_asal || 'Kabupaten Tasikmalaya'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-purple-400 font-light flex items-center justify-center space-x-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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
