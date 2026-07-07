import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Award, Sparkles } from 'lucide-react';
import { Berita, ProfilKwarcab } from '../types';

interface LandingHeroProps {
  profil: ProfilKwarcab | null;
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

  const heroMode = profil?.hero_mode || 'dinamis';
  const hasFeatured = featuredNews.length > 0;

  useEffect(() => {
    if (heroMode === 'dinamis' && hasFeatured) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % featuredNews.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [heroMode, featuredNews.length, hasFeatured]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? featuredNews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featuredNews.length);
  };

  if (heroMode === 'statis' || !hasFeatured) {
    const bannerUrl = profil?.banner_statis_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop';
    return (
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-32">
        {/* Ambient background mesh */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerUrl} 
            alt="Scout Hero Banner" 
            className="w-full h-full object-cover object-center filter brightness-[0.25] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1A] via-transparent to-[#0F0A1A]/80"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A1A] via-transparent to-transparent"></div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 glow-spot-primary opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 glow-spot-gold opacity-50"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel border border-white/10 mb-6 scale-95 md:scale-100 hover:border-purple-400/40 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs tracking-wider text-purple-200 uppercase font-semibold">Selamat Datang di Portal Resmi</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 font-heading">
            Kwartir Cabang <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-[#D4AF37]">Gerakan Pramuka</span> <br />
            Kabupaten Tasikmalaya
          </h1>

          <p className="text-base sm:text-lg text-purple-200 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Wadah pembentukan generasi muda tangguh, edukatif, mandiri, berkarakter luhur, dan unggul berlandaskan nilai moral Pancasila serta religiusitas Islami.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onNavigateToTab('profil')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-purple-400/20"
            >
              <span>Jelajahi Profil</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => onNavigateToTab('berita')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl glass-panel text-purple-200 hover:text-white hover:bg-white/10 font-semibold border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <span>Berita Terbaru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DYNAMIC CAROUSEL HERO ---
  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      {featuredNews.map((news, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={news.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image & Overlay */}
            <div className="absolute inset-0">
              <img
                src={news.gambar_cover}
                alt={news.judul}
                className="w-full h-full object-cover object-center filter brightness-[0.25]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1A] via-transparent to-[#0F0A1A]/80"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A1A] via-transparent to-transparent"></div>
            </div>

            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center pt-28 pb-16 sm:pt-36 sm:pb-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl text-left">
                  {/* Badge */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-900/60 border border-[#D4AF37]/50 mb-4 sm:mb-6 shadow-inner shadow-[#D4AF37]/10 animate-pulse">
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                    <span className="text-[10px] sm:text-xs tracking-wider text-[#D4AF37] uppercase font-bold">
                      Sorotan Berita Utama
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight font-heading line-clamp-2 sm:line-clamp-3">
                    {news.judul}
                  </h2>

                  <p className="text-xs sm:text-base text-purple-200/90 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 font-light leading-relaxed">
                    {news.konten}
                  </p>

                  <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                    <button
                      onClick={() => onSelectBerita(news)}
                      className="flex items-center space-x-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-950/40 hover:-translate-y-0.5 active:translate-y-0 border border-purple-500/30 transition-all duration-200"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>Baca Selengkapnya</span>
                    </button>
                    <span className="text-[10px] sm:text-xs text-purple-300 font-medium">
                      Oleh: {news.author_nama} &bull; {new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Navigation Controls */}
      {featuredNews.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full glass-panel border border-white/10 hover:border-purple-400/40 text-purple-200 hover:text-white transition-all duration-200 shadow-md hover:scale-105"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full glass-panel border border-white/10 hover:border-purple-400/40 text-purple-200 hover:text-white transition-all duration-200 shadow-md hover:scale-105"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md">
            {featuredNews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'bg-[#D4AF37] w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
