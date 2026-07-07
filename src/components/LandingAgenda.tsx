import React, { useState } from 'react';
import { Calendar, Tag, ChevronRight, Compass, Filter, Clock, MapPin } from 'lucide-react';
import { Agenda } from '../types';

interface LandingAgendaProps {
  agenda: Agenda[];
}

export default function LandingAgenda({ agenda }: LandingAgendaProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all'); // all, mandiri, partisipasi_daerah, partisipasi_nasional, partisipasi_internasional

  const filtered = agenda.filter((a) => {
    return activeCategory === 'all' || a.kategori === activeCategory;
  });

  const getCategoryBadgeColor = (kat: string) => {
    switch (kat) {
      case 'mandiri':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      case 'partisipasi_daerah':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/30';
      case 'partisipasi_nasional':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'partisipasi_internasional':
        return 'bg-amber-950/80 text-[#D4AF37] border-amber-500/30 animate-pulse';
      default:
        return 'bg-slate-900/60 text-slate-200 border-slate-500/30';
    }
  };

  const getCategoryLabel = (kat: string) => {
    switch (kat) {
      case 'mandiri': return 'Mandiri (Kwarcab)';
      case 'partisipasi_daerah': return 'Partisipasi Daerah';
      case 'partisipasi_nasional': return 'Partisipasi Nasional';
      case 'partisipasi_internasional': return 'Partisipasi Internasional';
      default: return kat;
    }
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-10 right-10 glow-spot-primary opacity-20"></div>

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          Agenda Kegiatan Kwarcab
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-[#D4AF37] mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-purple-300 mt-2 font-medium">
          Rencana program, pertemuan, kegiatan bakti, dan agenda kepanduan mendatang
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {[
          { id: 'all', label: 'Semua Agenda' },
          { id: 'mandiri', label: 'Mandiri (Kwarcab)' },
          { id: 'partisipasi_daerah', label: 'Daerah (Jawa Barat)' },
          { id: 'partisipasi_nasional', label: 'Nasional (Cibubur)' },
          { id: 'partisipasi_internasional', label: 'Internasional (WOSM)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
              activeCategory === tab.id
                ? 'bg-purple-600/35 text-white border-purple-500 shadow-lg shadow-purple-500/10'
                : 'bg-black/20 text-purple-200/80 border-white/5 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Agendas */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-purple-300/70 max-w-2xl mx-auto border border-white/5">
          Belum ada agenda terdaftar untuk kategori yang dipilih.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ag) => (
            <div
              key={ag.id}
              className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-purple-400/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Category Badge & Owner */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-md ${getCategoryBadgeColor(ag.kategori)}`}>
                    {getCategoryLabel(ag.kategori)}
                  </span>
                  <span className="text-[10px] text-purple-400 font-medium">
                    Oleh: {ag.owner_type.toUpperCase()}
                  </span>
                </div>

                {/* Agenda Title */}
                <h3 className="text-base font-bold text-white mb-3 line-clamp-2 leading-snug">
                  {ag.judul}
                </h3>

                {/* Description */}
                <p className="text-xs text-purple-200/70 font-light leading-relaxed line-clamp-3 mb-6">
                  {ag.deskripsi || 'Tidak ada deskripsi khusus untuk agenda ini.'}
                </p>
              </div>

              {/* Date Box */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-purple-300 mt-auto">
                <span className="flex items-center space-x-1.5 font-light">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {ag.tanggal_mulai} s/d {ag.tanggal_selesai}
                  </span>
                </span>
                <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/5 px-2 py-0.5 rounded border border-[#D4AF37]/10">
                  Kab. Tasikmalaya
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
