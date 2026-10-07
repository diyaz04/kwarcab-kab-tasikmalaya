import React, { useState, useEffect } from 'react';
import { fotoOrDefault, onFotoError } from '../utils/foto';
import { Users, User, MapPin, Award, Shield, CheckCircle2, AlertTriangle, HelpCircle, Activity, BookOpen, Calendar, X, Building, ArrowLeft, Landmark, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { KwartirRanting, SatuanKarya } from '../types';
import SosmedButtons from './SosmedButtons';

interface LandingKwarranSakaProps {
  type: 'kwarran' | 'saka';
  items: any[];
  externalSelectedId?: string | null;
  onSelectId?: (id: string | null) => void;
}

export default function LandingKwarranSaka({ type, items, externalSelectedId, onSelectId }: LandingKwarranSakaProps) {
  const [internalId, setInternalId] = useState<string | null>(null);
  const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalId;
  
  const doSetSelectedId = (id: string | null) => {
    if (onSelectId) {
      onSelectId(id);
    } else {
      setInternalId(id);
    }
  };

  const [detailData, setDetailData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [pageSize, setPageSize] = useState<number>(4);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [type, pageSize]);

  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(items.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageItems = pageSize === Infinity ? items : items.slice((activePage - 1) * pageSize, activePage * pageSize);

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

  // Auto scroll to top on selection (instant, to feel like a new page)
  useEffect(() => {
    if (selectedId) {
      window.scrollTo(0, 0);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetch(`/api/public/${type}/${selectedId}`)
        .then((res) => res.json())
        .then((data) => {
          setDetailData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setDetailData(null);
    }
  }, [selectedId, type]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Unit Aktif</span>
          </span>
        );
      case 'transisi':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
            <span>Masa Transisi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <HelpCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Non-Aktif</span>
          </span>
        );
    }
  };

  const getSakaIcon = (name: string) => {
    return <Award className="w-5 h-5 text-green-700" />;
  };

  // DEDICATED PROFILE PAGE FOR SELECTED ITEM (KWARRAN / SAKA)
  if (selectedId) {
    return (
      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="absolute top-10 right-10 glow-spot-primary opacity-20 pointer-events-none"></div>

        {/* Back Button & Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => {
              doSetSelectedId(null);
              setDetailData(null);
            }}
            className="group flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-green-700 border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kembali ke Beranda</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
            <span className="cursor-pointer hover:text-green-700" onClick={() => doSetSelectedId(null)}>
              {type === 'kwarran' ? 'Kwartir Ranting' : 'Satuan Karya'}
            </span>
            <span>/</span>
            <span className="text-green-700 font-semibold">
              {detailData 
                ? (type === 'kwarran' ? `Kwarran ${detailData.kwarran.nama_kecamatan}` : detailData.saka.nama_saka)
                : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Loader Screen */}
        {loading && (
          <div className="bg-white rounded-3xl py-32 text-center text-gray-500 border border-gray-100 shadow-sm">
            <Activity className="w-12 h-12 animate-spin mx-auto text-green-600 mb-4" />
            <span className="text-sm font-semibold tracking-wide">Sinkronisasi &amp; Mengunduh Profil Basis Data...</span>
          </div>
        )}

        {/* Content Page Grid */}
        {!loading && detailData && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            {/* 1. Header Banner Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="p-4 sm:p-5 rounded-2xl bg-green-50 border border-green-200 shadow-inner">
                    {type === 'kwarran' ? (
                      <MapPin className="w-8 h-8 text-green-700" />
                    ) : (
                      <Award className="w-8 h-8 text-green-700" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase flex items-center gap-1.5 mb-1">
                      <Landmark className="w-3.5 h-3.5 text-green-600" />
                      <span>{type === 'kwarran' ? 'Organisasi Tingkat Kecamatan' : 'Rumpun Kejuruan Saka'}</span>
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-green-900 font-heading tracking-tight leading-tight">
                      {type === 'kwarran' 
                        ? `Kwartir Ranting ${detailData.kwarran.nama_kecamatan}` 
                        : detailData.saka.nama_saka}
                    </h1>
                    {type === 'kwarran' && detailData.kwarran.masa_khidmat && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Masa Khidmat {detailData.kwarran.masa_khidmat}</span>
                      </div>
                    )}
                    {type === 'kwarran' && (
                      <SosmedButtons
                        links={detailData.kwarran.sosmed}
                        variant="header"
                        className="mt-4"
                      />
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(type === 'kwarran' ? detailData.kwarran.status : detailData.saka.status)}
                </div>
              </div>
            </div>

            {/* 2. Main Dashboard Layout (Columns) */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Pengurus Organisasi */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider border-b border-gray-100 pb-2.5 font-heading">
                    Pimpinan &amp; Pengurus Inti
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-light leading-relaxed">
                    Struktur kepengurusan resmi yang memimpin koordinasi administrasi dan pembinaan wilayah.
                  </p>
                </div>

                {/* Ketua */}
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                    <img 
                      src={fotoOrDefault(type === 'kwarran' ? detailData.kwarran.foto_ketua : detailData.saka.foto_ketua)} onError={onFotoError} 
                      alt="Ketua" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Ketua Organisasi</div>
                    <div className="text-sm font-bold text-gray-900 truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.ketua : detailData.saka.ketua}</div>
                  </div>
                </div>

                {/* Sekretaris */}
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                    <img 
                      src={fotoOrDefault(type === 'kwarran' ? detailData.kwarran.foto_sekretaris : detailData.saka.foto_sekretaris)} onError={onFotoError} 
                      alt="Sekretaris" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Sekretaris Utama</div>
                    <div className="text-sm font-bold text-gray-900 truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.sekretaris : detailData.saka.sekretaris}</div>
                  </div>
                </div>

                {/* Bendahara */}
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                    <img 
                      src={fotoOrDefault(type === 'kwarran' ? detailData.kwarran.foto_bendahara : detailData.saka.foto_bendahara)} onError={onFotoError} 
                      alt="Bendahara" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Bendahara Keuangan</div>
                    <div className="text-sm font-bold text-gray-900 truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.bendahara : detailData.saka.bendahara}</div>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: Statistics Demographic */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-4">
                    <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider font-heading">
                      Demografi Anggota
                    </h3>
                    <span className="text-xs text-green-700 font-bold">Total: {detailData.stats.total} Orang</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-5 font-light leading-relaxed">
                    Jumlah anggota Pramuka terdaftar aktif yang dihimpun secara realtime dari pangkalan gugus depan.
                  </p>

                  {/* Stat Progress Bars */}
                  <div className="space-y-4">
                    {type === 'kwarran' ? (
                      <>
                        {/* CALON SIAGA */}
                        {typeof detailData.stats.calon_siaga === 'number' && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                              <span className="text-pink-600">Calon Siaga (TK)</span>
                              <span className="text-gray-900 font-semibold">{detailData.stats.calon_siaga} orang</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full bg-pink-400 rounded-full transition-all duration-500"
                                style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.calon_siaga / detailData.stats.total) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* SIAGA */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                            <span className="text-emerald-600">Siaga (SD)</span>
                            <span className="text-gray-900 font-semibold">{detailData.stats.siaga} orang</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.siaga / detailData.stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* PENGGALANG */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                            <span className="text-red-600">Penggalang (SMP)</span>
                            <span className="text-gray-900 font-semibold">{detailData.stats.penggalang} orang</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all duration-500" 
                              style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.penggalang / detailData.stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </>
                    ) : null}

                    {/* PENEGAK */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                        <span className="text-purple-600">Penegak (SMA)</span>
                        <span className="text-gray-900 font-semibold">{detailData.stats.penegak} orang</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                          style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.penegak / detailData.stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* PANDEGA */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                        <span className="text-sky-600">Pandega (PT)</span>
                        <span className="text-gray-900 font-semibold">{detailData.stats.pandega} orang</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                          style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.pandega / detailData.stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {type === 'kwarran' ? (
                      /* DEWASA */
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                          <span className="text-yellow-600">Pembina / Dewasa</span>
                          <span className="text-gray-900 font-semibold">{detailData.stats.dewasa} orang</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                            style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.dewasa / detailData.stats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        {typeof detailData.stats.pelatih === 'number' && (
                          <div className="flex items-center justify-between text-xs mt-2 font-medium">
                            <span className="text-teal-700">&bull; Di antaranya Pelatih (KPD/KPL)</span>
                            <span className="text-gray-900 font-semibold">{detailData.stats.pelatih} orang</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-500 leading-relaxed flex items-start gap-1.5 font-light">
                  <Activity className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Sistem Sinergi Kwarcab Kabupaten Tasikmalaya memastikan akurasi data anggota demi pembinaan yang tertarget.</span>
                </div>
              </div>

              {/* RIGHT COLUMN: Associated school/Gudep or Saka Mission info */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider border-b border-gray-100 pb-2.5 mb-4 font-heading">
                  {type === 'kwarran' ? 'Gugus Depan Terdaftar' : 'Ketentuan &amp; Spesifikasi Saka'}
                </h3>

                {type === 'kwarran' ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailData.gudeps.length === 0 ? (
                      <p className="text-xs text-gray-500 font-light py-4">Belum ada pangkalan gugus depan yang terdaftar di basis data Kwarran ini.</p>
                    ) : (
                      detailData.gudeps.map((g: any) => (
                        <div key={g.id} className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl border border-gray-100 transition">
                          <div className="p-2 rounded-lg bg-green-50 text-green-700">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-gray-900 truncate block">{g.nama_pangkalan}</span>
                            <span className="text-[10px] text-gray-500 font-light block mt-0.5">ID: {g.nomor_gudep || 'Pangkalan Terverifikasi'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 font-light text-xs leading-relaxed text-gray-600">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="text-green-700 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-green-600" />
                        <span>Fokus &amp; Krida Utama</span>
                      </div>
                      <p>
                        Setiap anggota dididik dalam berbagai krida khusus yang memadukan teori taktis dan bakti nyata masyarakat (misal: penanggulangan bencana, ketertiban sosial, kesehatan).
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="text-blue-700 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-blue-600" />
                        <span>Persyaratan Seleksi</span>
                      </div>
                      <p>
                        Wajib aktif sebagai Pramuka Penegak/Pandega di Gugus Depan, memiliki komitmen tinggi, serta mendapatkan izin resmi dari Pembina Gudep.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 3. Sub-Dashboard Agenda & Berita Ranting */}
            <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
              
              {/* Agenda Tab */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider mb-4 flex items-center space-x-2 font-heading">
                  <Calendar className="w-4.5 h-4.5 text-green-600" />
                  <span>Agenda Kegiatan Khusus</span>
                </h3>

                <div className="space-y-3">
                  {detailData.agendas.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs font-light">
                      Belum ada agenda terjadwal khusus dari ranting/saka ini.
                    </div>
                  ) : (
                    detailData.agendas.map((a: any) => (
                      <div key={a.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-4 items-start hover:border-green-200 transition duration-150">
                        <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 shrink-0 font-bold text-center text-xs min-w-12">
                          💡
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{a.judul}</h4>
                          <p className="text-[11px] text-gray-600 leading-relaxed mb-2 font-light">{a.deskripsi || 'Kegiatan sinergi ranting resmi.'}</p>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                            <span>📅 Periode:</span>
                            <span className="text-gray-900">{a.tanggal_mulai} s/d {a.tanggal_selesai}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Berita/Publikasi Ranting */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider mb-4 flex items-center space-x-2 font-heading">
                  <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                  <span>Warta Publikasi &amp; Kegiatan</span>
                </h3>

                <div className="space-y-3">
                  {detailData.berita.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs font-light">
                      Belum ada publikasi berita yang dirilis oleh unit ini.
                    </div>
                  ) : (
                    detailData.berita.map((b: any) => (
                      <div key={b.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-3.5 hover:border-green-200 transition">
                        {b.gambar_cover && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                            <img src={b.gambar_cover} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-grow flex flex-col justify-center">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{b.judul}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-1 font-light">{b.konten}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  doSetSelectedId(null);
                  setDetailData(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-green-700 hover:border-green-300 font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-sm"
              >
                Tutup Profil
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-green-900 font-heading">
          {type === 'kwarran' ? 'Kwartir Ranting (Kecamatan)' : 'Satuan Karya Pramuka (Saka)'}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-700 mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-green-700 mt-2 font-medium">
          {type === 'kwarran' 
            ? 'Pusat organisasi gerakan kepramukaan di tingkat wilayah kecamatan se-Kabupaten Tasikmalaya.'
            : 'Wadah pembinaan bagi Pramuka Penegak & Pandega untuk menyalurkan minat dan bakat di bidang khusus.'}
        </p>
      </div>

      {/* Grid List of items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {pageItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div>
              {/* Top Bar with Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 shadow-inner">
                  {type === 'kwarran' ? (
                    <MapPin className="w-5 h-5 text-green-700" />
                  ) : (
                    getSakaIcon(item.nama_saka)
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 font-heading tracking-wide mb-4 group-hover:text-green-700 transition-colors">
                {type === 'kwarran' ? `Kwarran ${item.nama_kecamatan}` : item.nama_saka}
              </h3>

              {type === 'kwarran' && item.masa_khidmat && (
                <div className="-mt-2 mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-800 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Masa Khidmat {item.masa_khidmat}</span>
                </div>
              )}

              {/* Leader / Pengurus Cards */}
              <div className="space-y-3 pt-3 border-t border-gray-100 mb-6">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={fotoOrDefault(item.foto_ketua)} onError={onFotoError} alt="Ketua" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs truncate">
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold">Ketua</div>
                    <div className="text-gray-900 font-medium truncate max-w-[150px]">{item.ketua}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={fotoOrDefault(item.foto_sekretaris)} onError={onFotoError} alt="Sekretaris" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs truncate">
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold">Sekretaris</div>
                    <div className="text-gray-900 font-medium truncate max-w-[150px]">{item.sekretaris}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* View Detail Action button */}
            <button
              onClick={() => doSetSelectedId(item.id)}
              className="w-full py-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs tracking-wider uppercase border border-green-200 transition-all duration-200 cursor-pointer"
            >
              Lihat Detail &amp; Statistik
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
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
              Menampilkan {(activePage - 1) * pageSize + 1}&ndash;{Math.min(activePage * pageSize, items.length)} dari {items.length} data
            </span>
          )}

          {totalPages > 1 && pageSize !== Infinity && (
            <nav aria-label="Paginasi data" className="flex flex-wrap items-center justify-center gap-2">
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
