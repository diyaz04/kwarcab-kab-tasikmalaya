import React, { useState, useEffect } from 'react';
import { Calendar, Tag, ChevronRight, Compass, Filter, Clock, MapPin } from 'lucide-react';
import { Agenda } from '../types';

interface LandingAgendaProps {
  agenda: Agenda[];
}

export default function LandingAgenda({ agenda }: LandingAgendaProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all'); // all, mandiri, partisipasi_daerah, partisipasi_nasional, partisipasi_internasional

  const [pageSize, setPageSize] = useState<number>(4);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, pageSize]);

  const filtered = agenda.filter((a) => {
    return activeCategory === 'all' || a.kategori === activeCategory;
  });

  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageItems = pageSize === Infinity ? filtered : filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

  const pageNumbers: Array<number | 'gap'> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - activePage) <= 1) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== 'gap') {
      pageNumbers.push('gap');
    }
  }

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const getCategoryBadgeColor = (kat: string) => {
    switch (kat) {
      case 'mandiri':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partisipasi_daerah':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partisipasi_nasional':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'partisipasi_internasional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-10 right-10 glow-spot-primary opacity-20"></div>

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-green-900 font-heading">
          Agenda Kegiatan Kwarcab
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-green-700 mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-green-700 mt-2 font-medium">
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
                ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:text-green-700 hover:bg-green-50 hover:border-green-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Agendas */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 max-w-2xl mx-auto border border-gray-100 shadow-sm">
          Belum ada agenda terdaftar untuk kategori yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {pageItems.map((ag) => (
            <div
              key={ag.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Category Badge & Owner */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getCategoryBadgeColor(ag.kategori)}`}>
                    {getCategoryLabel(ag.kategori)}
                  </span>
                  <span className="text-[10px] text-green-600 font-medium">
                    Oleh: {ag.owner_type.toUpperCase()}
                  </span>
                </div>

                {/* Agenda Title */}
                <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
                  {ag.judul}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-600 font-light leading-relaxed line-clamp-3 mb-6">
                  {ag.deskripsi || 'Tidak ada deskripsi khusus untuk agenda ini.'}
                </p>
              </div>

              {/* Date Box */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-auto">
                <span className="flex items-center space-x-1.5 font-light">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>
                    {ag.tanggal_mulai} s/d {ag.tanggal_selesai}
                  </span>
                </span>
                <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  Kab. Tasikmalaya
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize === Infinity ? 'all' : pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer shadow-sm"
            >
              <option value={4}>4 Data</option>
              <option value={10}>10 Data</option>
              <option value={20}>20 Data</option>
              <option value="all">Semua</option>
            </select>
          </div>

          {pageSize !== Infinity && (
            <span className="text-xs text-gray-500 hidden md:block">
              Menampilkan {(activePage - 1) * pageSize + 1}&ndash;{Math.min(activePage * pageSize, filtered.length)} dari {filtered.length} agenda
            </span>
          )}

          {totalPages > 1 && pageSize !== Infinity && (
            <nav aria-label="Paginasi agenda" className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(activePage - 1)}
                disabled={activePage === 1}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 shadow-sm"
              >
                Sebelumnya
              </button>

              {pageNumbers.map((n, idx) =>
                n === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-1 text-gray-400 text-xs">&hellip;</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goToPage(n)}
                    aria-current={n === activePage ? 'page' : undefined}
                    className={`min-w-[36px] px-2.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm ${
                      n === activePage
                        ? 'bg-green-700 text-white border-green-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:text-green-700 hover:border-green-300'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goToPage(activePage + 1)}
                disabled={activePage === totalPages}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 shadow-sm"
              >
                Selanjutnya
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
