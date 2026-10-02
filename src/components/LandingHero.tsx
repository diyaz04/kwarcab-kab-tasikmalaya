import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Play, Calendar, MapPin, Users, BookOpen, Newspaper, Leaf, ChevronLeft } from 'lucide-react';
import { Berita, ProfilKwarcab } from '../types';

interface LandingHeroProps {
  profil: ProfilKwarcab | null;
  /** Berita terbaru untuk kilasan di hero (sudah diurutkan, maks. 5 dipakai). */
  featuredNews: Berita[];
  onSelectBerita: (b: Berita) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function LandingHero({
  profil,
  featuredNews,
  onSelectBerita,
  onNavigateToTab
}: LandingHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const newsItems = featuredNews.slice(0, 5);
  const hasNews = newsItems.length > 0;

  useEffect(() => {
    if (activeIndex >= newsItems.length) setActiveIndex(0);
  }, [newsItems.length, activeIndex]);

  useEffect(() => {
    if (newsItems.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % newsItems.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [newsItems.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? newsItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % newsItems.length);
  };

  const mainNews = hasNews ? newsItems[Math.min(activeIndex, newsItems.length - 1)] : null;
  const bannerUrl = profil?.banner_statis_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop';

  return (
    <div className="relative min-h-[100vh] flex flex-col justify-center overflow-hidden bg-white">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={bannerUrl}
          alt="Banner Kwarcab"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Complex White Overlay Shape (Left side) - Desktop */}
      <div className="absolute inset-0 z-10 hero-mask bg-white/20 hidden md:block pointer-events-none"></div>

      {/* Light Overlay for Mobile Readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/60 to-white/95 md:hidden pointer-events-none"></div>

      {/* Decorative Bottom Waves */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none overflow-hidden h-32 md:h-64">
        {/* Yellow Wave */}
        <svg className="absolute bottom-0 w-[150%] md:w-full h-full -left-10 md:left-0 text-amber-400 fill-current opacity-100" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,160L48,165.3C96,171,192,181,288,208C384,235,480,277,576,272C672,267,768,213,864,197.3C960,181,1056,203,1152,213.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        {/* Green Wave */}
        <svg className="absolute bottom-0 w-[150%] md:w-full h-full -left-10 md:left-0 text-green-800 fill-current opacity-100 transform translate-y-4 md:translate-y-12" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,256L60,240C120,224,240,192,360,186.7C480,181,600,203,720,197.3C840,192,960,160,1080,149.3C1200,139,1320,149,1380,154.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>

      {/* Main Content container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-[19rem] sm:pb-[20rem] md:pb-32 flex flex-col justify-center min-h-[100vh]">
        <div className="w-full md:w-[60%] lg:w-[55%]">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-1.5 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-4 pr-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-700 flex items-center justify-center text-white p-1">
              <img 
                src="https://api.iconify.design/mdi/fleur-de-lis.svg?color=white" 
                alt="Logo WOSM" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-[9px] sm:text-xs font-bold tracking-wide text-green-700 uppercase">
              PRAMUKA BERJIWA PANCASILA
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-green-900 mb-4 leading-tight font-heading drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] md:drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
            Kwartir Cabang <br/><span className="text-green-700">Kabupaten Tasikmalaya</span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-700 mb-6 line-clamp-4 leading-relaxed max-w-xl drop-shadow-[0_0_15px_rgba(255,255,255,1)] md:drop-shadow-none">
            Wadah pembentukan generasi muda tangguh, edukatif, mandiri, berkarakter luhur, dan unggul berlandaskan nilai moral Pancasila serta religiusitas Islami.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 items-center mb-6">
            <button 
              onClick={() => onNavigateToTab('berita')}
              className="flex items-center justify-center space-x-2 px-5 sm:px-7 py-3 rounded-full bg-green-700 hover:bg-green-800 text-white font-bold text-[11px] sm:text-sm shadow-xl shadow-green-900/20 transition-all duration-200 flex-1 sm:flex-none"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Semua Berita</span>
            </button>
            <button 
              onClick={() => onNavigateToTab('agenda')}
              className="flex items-center justify-center space-x-2 px-5 sm:px-7 py-3 rounded-full bg-white text-green-700 font-bold text-[11px] sm:text-sm border border-gray-200 hover:bg-green-50 shadow-md transition-all duration-200 flex-1 sm:flex-none"
            >
              <Calendar className="w-4 h-4" />
              <span>Lihat Agenda</span>
            </button>
          </div>

          {/* Kilasan berita terbaru */}
          {mainNews && (
            <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700">Kilasan Berita Terbaru</span>
                {newsItems.length > 1 && (
                  <div className="flex items-center space-x-1">
                    <button type="button" onClick={handlePrev} aria-label="Berita sebelumnya" className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleNext} aria-label="Berita berikutnya" className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onSelectBerita(mainNews)} className="flex items-center gap-3 text-left w-full group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img key={mainNews.id} src={mainNews.gambar_cover} alt="" className="w-full h-full object-cover animate-in fade-in duration-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-green-700">{mainNews.judul}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {new Date(mainNews.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </button>
              {newsItems.length > 1 && (
                <div className="flex justify-center space-x-1 mt-2">
                  {newsItems.map((n, i) => (
                    <span key={n.id} className={`h-1 rounded-full transition-all ${i === activeIndex ? 'w-4 bg-green-700' : 'w-1.5 bg-gray-300'}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      {/* Positioned relative to bottom of container to avoid overlap */}
      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 z-30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-3 sm:p-2 lg:flex lg:flex-row lg:items-center">
          
          <div className="grid grid-cols-2 lg:flex lg:flex-1 gap-2 lg:gap-0 lg:divide-x divide-gray-100">
            {/* 1. Tentang Kami */}
            <button onClick={() => onNavigateToTab('profil')} className="flex items-center p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group flex-1 text-left border-b border-r lg:border-r-0 lg:border-b-0 border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-green-700 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Tentang Kami</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-2">Mengenal lebih dekat Kwarcab</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden xl:block group-hover:text-green-700" />
            </button>
            
            {/* 2. Berita Terbaru */}
            <button onClick={() => onNavigateToTab('berita')} className="flex items-center p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group flex-1 text-left border-b lg:border-b-0 border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-amber-400 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Newspaper className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Berita Terbaru</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-2">Informasi dan kabar terkini</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden xl:block group-hover:text-amber-500" />
            </button>

            {/* 3. Agenda Kegiatan */}
            <button onClick={() => onNavigateToTab('agenda')} className="flex items-center p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group flex-1 text-left border-r lg:border-r-0 lg:border-b-0 border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Agenda Kegiatan</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-2">Jadwal kegiatan Pramuka</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden xl:block group-hover:text-blue-500" />
            </button>

            {/* 4. Sebaran KP */}
            <button onClick={() => onNavigateToTab('kampung_pramuka')} className="flex items-center p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group flex-1 text-left border-gray-100 lg:border-transparent">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-purple-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Sebaran KP</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-2">Pemetaan satuan karya</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden xl:block group-hover:text-purple-600" />
            </button>

            {/* 5. Layanan & Info */}
            <button onClick={() => onNavigateToTab('home')} className="flex items-center p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group flex-1 text-left border-gray-100 lg:border-transparent col-span-2 lg:col-span-1 border-t lg:border-t-0 mt-1 lg:mt-0 pt-3 lg:pt-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-green-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="ml-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Layanan & Informasi</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-2">Butuh bantuan? Kami siap membantu</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden xl:block group-hover:text-green-600" />
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
