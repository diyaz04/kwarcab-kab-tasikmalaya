import React from 'react';
import { BookOpen, Award, Shield, Compass, Eye, ListOrdered, Calendar } from 'lucide-react';
import { PimpinanKwarcab, ProfilKwarcab } from '../types';

interface LandingProfilProps {
  profil: ProfilKwarcab | null;
  pimpinan: PimpinanKwarcab[];
}

export default function LandingProfil({ profil, pimpinan }: LandingProfilProps) {
  if (!profil) {
    return (
      <div className="py-20 text-center text-purple-300">
        Memuat data profil kwarcab...
      </div>
    );
  }

  // Format missions into array
  const misiList = profil.misi
    .split('\n')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Glow Effects */}
      <div className="absolute top-10 left-10 glow-spot-primary opacity-30"></div>
      <div className="absolute bottom-40 right-10 glow-spot-gold opacity-35"></div>

      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          Profil Kwartir Cabang
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-[#D4AF37] mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-purple-300 mt-3 uppercase tracking-wider font-semibold">
          Kabupaten Tasikmalaya
        </p>
      </div>

      {/* Visi & Misi - Glass Panels */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {/* Visi */}
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Eye className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
              <Compass className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="text-2xl font-bold text-white font-heading">Visi Utama</h3>
          </div>
          <p className="text-lg text-purple-100 font-light leading-relaxed">
            "{profil.visi}"
          </p>
        </div>

        {/* Misi */}
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group hover:border-purple-400/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <ListOrdered className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
              <Award className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-2xl font-bold text-white font-heading">Misi Strategis</h3>
          </div>
          <ul className="space-y-4">
            {misiList.map((m, i) => (
              <li key={i} className="flex items-start space-x-3 text-purple-200 text-sm font-light leading-relaxed">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  {i + 1}
                </span>
                <span>{m.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pimpinan Kwarcab - Dynamic Grid */}
      <div className="mb-20">
        <div className="flex items-center justify-center space-x-3 mb-10 text-center">
          <Shield className="w-6 h-6 text-[#D4AF37]" />
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-heading">Struktur Pimpinan Kwarcab</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pimpinan.map((p) => (
            <div 
              key={p.id} 
              className="glass-panel glass-panel-interactive rounded-2xl overflow-hidden flex flex-col h-full border border-white/5"
            >
              <div className="relative h-64 overflow-hidden group">
                <img 
                  src={p.foto} 
                  alt={p.nama} 
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1A]/90 via-transparent to-transparent"></div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between bg-black/10">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide leading-snug line-clamp-2">
                    {p.nama}
                  </h4>
                  <p className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase mt-2">
                    {p.jabatan}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-[10px] text-purple-300/80">
                  <span>Pramuka Tasikmalaya</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sejarah Kwarcab */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 overflow-hidden relative">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-900/10 filter blur-3xl"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#D4AF37]/5 filter blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-heading">Catatan Sejarah Singkat</h3>
          </div>
          
          <div className="text-purple-200 font-light text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
            {profil.sejarah}
          </div>
        </div>
      </div>
    </div>
  );
}
