import React, { useState } from 'react';
import { Compass, X, MapPin, Globe, Award, BookOpen, ChevronLeft, ChevronRight, Map, Info } from 'lucide-react';
import { KampungPramuka } from '../types';

interface LandingMapProps {
  items: KampungPramuka[];
  onSelectKp?: (kp: KampungPramuka) => void;
}

export default function LandingMap({ items, onSelectKp }: LandingMapProps) {
  const [selectedKp, setSelectedKp] = useState<KampungPramuka | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [hoveredKp, setHoveredKp] = useState<KampungPramuka | null>(null);

  // Coordinate bounding box for Kabupaten Tasikmalaya
  const minLat = -7.85;
  const maxLat = -7.15;
  const minLon = 107.95;
  const maxLon = 108.45;

  const getXY = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { 
      x: Math.max(10, Math.min(90, x)), 
      y: Math.max(10, Math.min(90, y)) 
    };
  };

  const photos = selectedKp ? selectedKp.foto.split(',').filter(Boolean) : [];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section id="peta-sebaran" className="py-20 bg-black/5 border-y border-white/5 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-purple-900/10 filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-900/10 filter blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/20">
            <Globe className="w-4 h-4 text-[#D4AF37] animate-spin" style={{ animationDuration: '15s' }} />
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-amber-300">Geospasial Interaktif</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
            Sebaran Kampung Pramuka
          </h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-purple-200/80 font-light leading-relaxed">
            Eksplorasi peta digital rintisan Kampung Pramuka di Kabupaten Tasikmalaya. Klik pada pin lokasi di peta atau daftar wilayah di samping untuk melihat sejarah pendirian dan keunggulan masing-masing kampung.
          </p>
        </div>

        {/* Main Interface: Map Canvas + Sidebar List */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left / Top Side: Interactive Map Container (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[520px] sm:h-[600px] rounded-3xl overflow-hidden glass-panel border border-white/10 relative">
            
            {/* Map Top Metadata Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-[#0F0A1A]/90 to-transparent p-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center space-x-2 bg-[#0F0A1A]/80 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
                <Compass className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Tasikmalaya Grid System</span>
              </div>
              <div className="bg-[#0F0A1A]/80 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md text-[9px] font-mono text-purple-300 pointer-events-auto">
                Kab. Tasikmalaya (7.15° S &bull; 108.15° E)
              </div>
            </div>

            {/* MAP CANVAS (SVG Vector Background + Grid + Markers) */}
            <div className="flex-grow w-full h-full relative bg-[#090511] overflow-hidden flex items-center justify-center select-none">
              
              {/* Coordinate Grid Overlay */}
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-15 pointer-events-none">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="border-t border-l border-purple-400/30 font-mono text-[7px] text-purple-400/40 p-0.5">
                    {i % 10 === 0 && `${(minLon + (i/10) * 0.05).toFixed(2)}°E`}
                  </div>
                ))}
              </div>

              {/* Geographic Vector Shape of Kabupaten Tasikmalaya (Stylized Premium Outline) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* Background glow around central Tasikmalaya */}
                <rect width="100" height="100" fill="url(#mapGlow)" />

                {/* Stylized region contour representing mountain slopes and Tasikmalaya terrain */}
                <path 
                  d="M 15,35 Q 25,20 45,25 T 75,15 T 85,45 T 70,80 T 50,90 T 25,85 T 15,55 Z" 
                  fill="none" 
                  stroke="rgba(139, 92, 246, 0.25)" 
                  strokeWidth="0.75" 
                  strokeDasharray="2,2" 
                />
                
                <path 
                  d="M 20,40 Q 30,28 48,32 T 70,25 T 80,48 T 65,75 T 48,82 T 28,78 T 20,55 Z" 
                  fill="none" 
                  stroke="rgba(212, 175, 55, 0.15)" 
                  strokeWidth="0.5" 
                />

                {/* Volcano Ridge: Mt. Galunggung representation */}
                <g transform="translate(42, 38)">
                  <path d="M -10,12 L 0,0 L 10,12" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="0.5" />
                  <path d="M -6,12 L 0,4 L 6,12" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="0.5" />
                  <circle r="1" fill="rgba(239, 68, 68, 0.3)" className="animate-ping" />
                </g>

                {/* Southern Coast representation */}
                <path d="M 5,87 L 95,95" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="4,4" />
              </svg>

              {/* Dynamic Interactive Markers */}
              {items.map((kp) => {
                const { x, y } = getXY(kp.latitude, kp.longitude);
                const isSelected = selectedKp?.id === kp.id;
                const isHovered = hoveredKp?.id === kp.id;

                return (
                  <div
                    key={kp.id}
                    className="absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => {
                      if (onSelectKp) {
                        onSelectKp(kp);
                      } else {
                        setSelectedKp(kp);
                        setActivePhotoIndex(0);
                      }
                    }}
                    onMouseEnter={() => setHoveredKp(kp)}
                    onMouseLeave={() => setHoveredKp(null)}
                  >
                    {/* Ring Pulse Effect */}
                    <span className={`absolute inline-flex h-10 w-10 -left-3.5 -top-3.5 rounded-full bg-[#D4AF37]/20 transition-transform ${isSelected || isHovered ? 'scale-150 opacity-100 animate-ping' : 'scale-50 opacity-0'}`}></span>
                    <span className={`absolute inline-flex h-6 w-6 -left-1.5 -top-1.5 rounded-full bg-purple-500/30 animate-pulse`}></span>
                    
                    {/* Pin Shape */}
                    <div className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-[#D4AF37] border-white text-black scale-125 shadow-xl shadow-[#D4AF37]/35' : 'bg-[#0F0A1A] border-[#D4AF37]/60 text-[#D4AF37] hover:border-white hover:text-white hover:scale-110'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>

                    {/* Popover Hover Label */}
                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none transition-all duration-200 ${isHovered && !isSelected ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}>
                      <div className="bg-black/90 text-[10px] text-white font-bold px-2.5 py-1.5 rounded-lg border border-purple-500/40 shadow-xl whitespace-nowrap">
                        {kp.nama}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Compass Indicator */}
              <div className="absolute bottom-6 left-6 flex flex-col items-center opacity-30">
                <Compass className="w-12 h-12 text-[#D4AF37] animate-spin" style={{ animationDuration: '25s' }} />
                <span className="text-[9px] font-mono text-purple-300 font-bold mt-1 tracking-widest">N &bull; SE</span>
              </div>

              {/* Floating Helper Tip */}
              <div className="absolute bottom-6 right-6 bg-[#0F0A1A]/85 px-3 py-1.5 rounded-lg border border-white/5 text-[9px] text-purple-200 font-light flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                Hover pin untuk nama, klik untuk profil lengkap.
              </div>
            </div>
          </div>

          {/* Right Side: List / Info Card Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            
            {/* List Header */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-[#0F0A1A]/40 flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Daftar Kampung ({items.length})</span>
              <Map className="w-4 h-4 text-[#D4AF37]" />
            </div>

            {/* Scrollable list of locations */}
            <div className="flex-grow max-h-[380px] lg:max-h-[500px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {items.map((kp) => {
                const isSelected = selectedKp?.id === kp.id;
                return (
                  <button
                    key={kp.id}
                    onClick={() => {
                      if (onSelectKp) {
                        onSelectKp(kp);
                      } else {
                        setSelectedKp(kp);
                        setActivePhotoIndex(0);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected ? 'bg-gradient-to-r from-purple-950/50 to-purple-900/10 border-[#D4AF37] shadow-lg shadow-purple-500/5' : 'glass-panel hover:bg-white/5 border-white/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>{kp.nama}</h4>
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D4AF37] animate-bounce' : 'text-purple-300/60'}`} />
                    </div>
                    <p className="text-[10px] text-purple-300/80 font-light mt-1">Kecamatan {kp.kecamatan}</p>
                    <div className="flex items-center space-x-1.5 mt-2 font-mono text-[9px] text-[#D4AF37]">
                      <span>{kp.latitude.toFixed(4)}° S</span>
                      <span className="text-purple-400/40">&bull;</span>
                      <span>{kp.longitude.toFixed(4)}° E</span>
                    </div>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="glass-panel p-8 text-center text-xs text-purple-300/50 font-light rounded-2xl border border-dashed border-white/10">
                  Belum ada data Kampung Pramuka yang diinput oleh admin.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* --- EXPANDED DETAILS DRAWER/MODAL --- */}
        {selectedKp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="glass-panel-heavy rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl relative p-5 sm:p-8 space-y-6">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedKp(null)}
                className="absolute top-5 right-5 z-50 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Title Banner */}
              <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-2xl text-[#D4AF37]">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest">Profil Kampung Pramuka Binaan</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-heading mt-0.5">
                    {selectedKp.nama}
                  </h3>
                  <p className="text-xs text-purple-200/80 font-light mt-1">
                    Wilayah Pembinaan Kwartir Ranting Kecamatan {selectedKp.kecamatan}
                  </p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid md:grid-cols-12 gap-6 items-stretch">
                
                {/* Photo Gallery Slideshow (5 cols) */}
                <div className="md:col-span-5 flex flex-col space-y-2">
                  <div className="h-64 sm:h-72 rounded-2xl overflow-hidden relative border border-white/5 bg-black/30 flex items-center justify-center">
                    {photos.length > 0 ? (
                      <>
                        <img 
                          src={photos[activePhotoIndex]} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {/* Slide Navigation Overlay */}
                        {photos.length > 1 && (
                          <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4 z-10">
                            <button
                              onClick={handlePrevPhoto}
                              className="p-1.5 rounded-lg bg-[#0F0A1A]/80 border border-white/15 text-white hover:bg-purple-950 transition cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono bg-[#0F0A1A]/80 border border-white/10 px-2 py-0.5 rounded-md text-white">
                              {activePhotoIndex + 1} / {photos.length}
                            </span>
                            <button
                              onClick={handleNextPhoto}
                              className="p-1.5 rounded-lg bg-[#0F0A1A]/80 border border-white/15 text-white hover:bg-purple-950 transition cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-purple-300/40 text-xs font-light flex flex-col items-center gap-2">
                        <Globe className="w-10 h-10 stroke-1" />
                        <span>Tidak ada dokumentasi foto</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Geographic Metadata */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-1 text-purple-200">
                    <div className="flex justify-between">
                      <span className="text-purple-400">Garis Lintang:</span>
                      <span className="text-[#D4AF37] font-bold">{selectedKp.latitude.toFixed(6)}° S</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Garis Bujur:</span>
                      <span className="text-[#D4AF37] font-bold">{selectedKp.longitude.toFixed(6)}° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Diresmikan:</span>
                      <span>{new Date(selectedKp.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Sejarah & Keunggulan Columns (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  
                  {/* Sejarah */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Sejarah Pendirian &amp; Latar Belakang</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-100 font-light leading-relaxed text-justify bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                      {selectedKp.sejarah}
                    </p>
                  </div>

                  {/* Keunggulan */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>Keunggulan &amp; Potensi Unggulan Kampung</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-100 font-light leading-relaxed text-justify bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                      {selectedKp.keunggulan}
                    </p>
                  </div>

                </div>

              </div>

              {/* Bottom Citation Line */}
              <div className="pt-4 border-t border-white/10 text-center">
                <span className="text-[9px] text-purple-300/40 uppercase tracking-widest font-mono">
                  Sistem Informasi Geospasial Binaan Kwartir Cabang Kabupaten Tasikmalaya
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
