import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Berita } from '../types';

interface LandingBeritaStripProps {
  /** Berita yang sudah difilter & diurutkan dari App (maks. 6 akan ditampilkan). */
  news: Berita[];
  onSelectBerita: (b: Berita) => void;
  onSeeAll: () => void;
}

const MAX_CARDS = 6;

export default function LandingBeritaStrip({ news, onSelectBerita, onSeeAll }: LandingBeritaStripProps) {
  const items = news.slice(0, MAX_CARDS);
  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-extrabold text-white font-heading uppercase tracking-wider">
          Berita Lainnya
        </h2>
        <button
          onClick={onSeeAll}
          className="text-xs font-bold text-[#D4AF37] flex items-center space-x-1 hover:underline"
        >
          <span>Semua Berita</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelectBerita(b)}
            className="glass-panel glass-panel-interactive rounded-2xl overflow-hidden flex flex-col text-left border border-white/5 group"
          >
            <div className="h-24 sm:h-28 overflow-hidden relative bg-purple-950/40">
              {b.gambar_cover && (
                <img
                  src={b.gambar_cover}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-[#D4AF37] transition-colors">
                {b.judul}
              </h3>
              <span className="text-[10px] text-purple-300/70 mt-auto pt-2 truncate">
                {new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-900/30 text-white font-bold text-xs uppercase border border-purple-500/40 hover:bg-purple-800/40 transition"
        >
          <span>Lihat Semua Berita</span>
          <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </div>
    </section>
  );
}
