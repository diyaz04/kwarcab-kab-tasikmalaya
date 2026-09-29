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
        <h2 className="text-sm sm:text-base font-extrabold text-green-900 font-heading uppercase tracking-wider">
          Berita Lainnya
        </h2>
        <button
          onClick={onSeeAll}
          className="text-xs font-bold text-green-700 flex items-center space-x-1 hover:underline"
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
            className="bg-white rounded-2xl overflow-hidden flex flex-col text-left border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 group transition-all duration-300"
          >
            <div className="h-24 sm:h-28 overflow-hidden relative bg-gray-100">
              {b.gambar_cover && (
                <img
                  src={b.gambar_cover}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            </div>
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                {b.judul}
              </h3>
              <span className="text-[10px] text-gray-500 mt-auto pt-2 truncate">
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
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-green-50 text-green-700 font-bold text-xs uppercase border border-green-200 hover:bg-green-100 transition"
        >
          <span>Lihat Semua Berita</span>
          <ArrowUpRight className="w-4 h-4 text-green-700" />
        </button>
      </div>
    </section>
  );
}
