import React, { useState, useEffect } from 'react';
import { Users, User, MapPin, Award, Shield, CheckCircle2, AlertTriangle, HelpCircle, Activity, BookOpen, Calendar, X, Building, ArrowLeft, Landmark, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { KwartirRanting, SatuanKarya } from '../types';

interface LandingKwarranSakaProps {
  type: 'kwarran' | 'saka';
  items: any[];
}

export default function LandingKwarranSaka({ type, items }: LandingKwarranSakaProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto scroll to top on selection
  useEffect(() => {
    if (selectedId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unit Aktif</span>
          </span>
        );
      case 'transisi':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-[#D4AF37] border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Masa Transisi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-300 border border-red-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Non-Aktif</span>
          </span>
        );
    }
  };

  const getSakaIcon = (name: string) => {
    return <Award className="w-5 h-5 text-[#D4AF37]" />;
  };

  // DEDICATED PROFILE PAGE FOR SELECTED ITEM (KWARRAN / SAKA)
  if (selectedId) {
    return (
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="absolute top-10 right-10 glow-spot-primary opacity-20 pointer-events-none"></div>

        {/* Back Button & Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => {
              setSelectedId(null);
              setDetailData(null);
            }}
            className="group flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white border border-white/5 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kembali ke Daftar</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-purple-300 font-medium">
            <span className="cursor-pointer hover:text-white" onClick={() => setSelectedId(null)}>
              {type === 'kwarran' ? 'Kwartir Ranting' : 'Satuan Karya'}
            </span>
            <span>/</span>
            <span className="text-[#D4AF37] font-semibold">
              {detailData 
                ? (type === 'kwarran' ? `Kwarran ${detailData.kwarran.nama_kecamatan}` : detailData.saka.nama_saka)
                : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Loader Screen */}
        {loading && (
          <div className="glass-panel rounded-3xl py-32 text-center text-purple-300 border border-white/5 shadow-2xl">
            <Activity className="w-12 h-12 animate-spin mx-auto text-[#D4AF37] mb-4" />
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
            <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/5 relative overflow-hidden shadow-2xl bg-gradient-to-br from-purple-950/20 via-[#0F0A1A] to-black/35">
              <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/80 border border-[#D4AF37]/45 shadow-inner shadow-purple-500/10">
                    {type === 'kwarran' ? (
                      <MapPin className="w-8 h-8 text-[#D4AF37]" />
                    ) : (
                      <Award className="w-8 h-8 text-[#D4AF37]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-purple-300 font-semibold tracking-wider uppercase flex items-center gap-1.5 mb-1">
                      <Landmark className="w-3.5 h-3.5 text-purple-400" />
                      <span>{type === 'kwarran' ? 'Organisasi Tingkat Kecamatan' : 'Rumpun Kejuruan Saka'}</span>
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight leading-tight">
                      {type === 'kwarran' 
                        ? `Kwartir Ranting ${detailData.kwarran.nama_kecamatan}` 
                        : detailData.saka.nama_saka}
                    </h1>
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
              <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 font-heading">
                    Pimpinan &amp; Pengurus Inti
                  </h3>
                  <p className="text-[11px] text-purple-300/80 mt-1 font-light leading-relaxed">
                    Struktur kepengurusan resmi yang memimpin koordinasi administrasi dan pembinaan wilayah.
                  </p>
                </div>

                {/* Ketua */}
                <div className="flex items-center space-x-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-purple-500/20 shadow-lg">
                    <img 
                      src={type === 'kwarran' ? detailData.kwarran.foto_ketua : detailData.saka.foto_ketua} 
                      alt="Ketua" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">Ketua Organisasi</div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.ketua : detailData.saka.ketua}</div>
                  </div>
                </div>

                {/* Sekretaris */}
                <div className="flex items-center space-x-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-purple-500/20 shadow-lg">
                    <img 
                      src={type === 'kwarran' ? detailData.kwarran.foto_sekretaris : detailData.saka.foto_sekretaris} 
                      alt="Sekretaris" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">Sekretaris Utama</div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.sekretaris : detailData.saka.sekretaris}</div>
                  </div>
                </div>

                {/* Bendahara */}
                <div className="flex items-center space-x-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-purple-500/20 shadow-lg">
                    <img 
                      src={type === 'kwarran' ? detailData.kwarran.foto_bendahara : detailData.saka.foto_bendahara} 
                      alt="Bendahara" 
                      className="w-full h-full object-cover object-top" 
                    />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">Bendahara Keuangan</div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">{type === 'kwarran' ? detailData.kwarran.bendahara : detailData.saka.bendahara}</div>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: Statistics Demographic */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">
                      Demografi Anggota
                    </h3>
                    <span className="text-xs text-[#D4AF37] font-bold">Total: {detailData.stats.total} Orang</span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 mb-5 font-light leading-relaxed">
                    Jumlah anggota Pramuka terdaftar aktif yang dihimpun secara realtime dari pangkalan gugus depan.
                  </p>

                  {/* Stat Progress Bars */}
                  <div className="space-y-4">
                    {type === 'kwarran' ? (
                      <>
                        {/* SIAGA */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                            <span className="text-emerald-300">Siaga (SD)</span>
                            <span className="text-white font-semibold">{detailData.stats.siaga} orang</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.siaga / detailData.stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* PENGGALANG */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                            <span className="text-red-300">Penggalang (SMP)</span>
                            <span className="text-white font-semibold">{detailData.stats.penggalang} orang</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
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
                        <span className="text-purple-300">Penegak (SMA)</span>
                        <span className="text-white font-semibold">{detailData.stats.penegak} orang</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                          style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.penegak / detailData.stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* PANDEGA */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                        <span className="text-sky-300">Pandega (PT)</span>
                        <span className="text-white font-semibold">{detailData.stats.pandega} orang</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
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
                          <span className="text-[#D4AF37]">Pembina / Dewasa</span>
                          <span className="text-white font-semibold">{detailData.stats.dewasa} orang</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-[#D4AF37] rounded-full transition-all duration-500" 
                            style={{ width: `${detailData.stats.total > 0 ? (detailData.stats.dewasa / detailData.stats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-purple-300/70 leading-relaxed flex items-start gap-1.5 font-light">
                  <Activity className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span>Sistem Sinergi Kwarcab Kabupaten Tasikmalaya memastikan akurasi data anggota demi pembinaan yang tertarget.</span>
                </div>
              </div>

              {/* RIGHT COLUMN: Associated school/Gudep or Saka Mission info */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-xl">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 mb-4 font-heading">
                  {type === 'kwarran' ? 'Gugus Depan Terdaftar' : 'Ketentuan &amp; Spesifikasi Saka'}
                </h3>

                {type === 'kwarran' ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailData.gudeps.length === 0 ? (
                      <p className="text-xs text-purple-300/60 font-light py-4">Belum ada pangkalan gugus depan yang terdaftar di basis data Kwarran ini.</p>
                    ) : (
                      detailData.gudeps.map((g: any) => (
                        <div key={g.id} className="flex items-center space-x-3 bg-white/[0.01] hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/5 transition">
                          <div className="p-2 rounded-lg bg-purple-950/40 text-purple-300">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white truncate block">{g.nama_pangkalan}</span>
                            <span className="text-[10px] text-purple-300 font-light block mt-0.5">ID: {g.nomor_gudep || 'Pangkalan Terverifikasi'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 font-light text-xs leading-relaxed text-purple-200">
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="text-purple-300 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Fokus &amp; Krida Utama</span>
                      </div>
                      <p>
                        Setiap anggota dididik dalam berbagai krida khusus yang memadukan teori taktis dan bakti nyata masyarakat (misal: penanggulangan bencana, ketertiban sosial, kesehatan).
                      </p>
                    </div>

                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-purple-400" />
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
            <div className="grid md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
              
              {/* Agenda Tab */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-xl">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2 font-heading">
                  <Calendar className="w-4.5 h-4.5 text-[#D4AF37]" />
                  <span>Agenda Kegiatan Khusus</span>
                </h3>

                <div className="space-y-3">
                  {detailData.agendas.length === 0 ? (
                    <div className="text-center py-10 text-purple-300/50 text-xs font-light">
                      Belum ada agenda terjadwal khusus dari ranting/saka ini.
                    </div>
                  ) : (
                    detailData.agendas.map((a: any) => (
                      <div key={a.id} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex gap-4 items-start hover:border-purple-500/20 transition duration-150">
                        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[#D4AF37] shrink-0 font-bold text-center text-xs min-w-12">
                          💡
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">{a.judul}</h4>
                          <p className="text-[11px] text-purple-200/75 leading-relaxed mb-2 font-light">{a.deskripsi || 'Kegiatan sinergi ranting resmi.'}</p>
                          <div className="text-[10px] text-purple-300 flex items-center gap-1 font-medium">
                            <span>📅 Periode:</span>
                            <span className="text-white">{a.tanggal_mulai} s/d {a.tanggal_selesai}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Berita/Publikasi Ranting */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-xl">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2 font-heading">
                  <BookOpen className="w-4.5 h-4.5 text-purple-400" />
                  <span>Warta Publikasi &amp; Kegiatan</span>
                </h3>

                <div className="space-y-3">
                  {detailData.berita.length === 0 ? (
                    <div className="text-center py-10 text-purple-300/50 text-xs font-light">
                      Belum ada publikasi berita yang dirilis oleh unit ini.
                    </div>
                  ) : (
                    detailData.berita.map((b: any) => (
                      <div key={b.id} className="bg-black/20 p-3 rounded-2xl border border-white/5 flex gap-3.5 hover:border-purple-500/10 transition">
                        {b.gambar_cover && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                            <img src={b.gambar_cover} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-grow flex flex-col justify-center">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{b.judul}</h4>
                          <p className="text-[10px] text-purple-300/70 line-clamp-1 mt-1 font-light">{b.konten}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setDetailData(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-500/30 hover:bg-purple-900/60 font-semibold text-xs tracking-wider uppercase transition-all duration-200"
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
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-10 right-10 glow-spot-primary opacity-20"></div>

      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          {type === 'kwarran' ? 'Kwartir Ranting (Kecamatan)' : 'Satuan Karya Pramuka (Saka)'}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-[#D4AF37] mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-purple-300 mt-2 font-medium">
          {type === 'kwarran' 
            ? 'Pusat organisasi gerakan kepramukaan di tingkat wilayah kecamatan se-Kabupaten Tasikmalaya.'
            : 'Wadah pembinaan bagi Pramuka Penegak & Pandega untuk menyalurkan minat dan bakat di bidang khusus.'}
        </p>
      </div>

      {/* Grid List of items */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-panel glass-panel-interactive rounded-2xl p-5 flex flex-col justify-between border border-white/5 bg-white/[0.02]"
          >
            <div>
              {/* Top Bar with Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20 shadow-md">
                  {type === 'kwarran' ? (
                    <MapPin className="w-5 h-5 text-purple-300" />
                  ) : (
                    getSakaIcon(item.nama_saka)
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white font-heading tracking-wide mb-4">
                {type === 'kwarran' ? `Kwarran ${item.nama_kecamatan}` : item.nama_saka}
              </h3>

              {/* Leader / Pengurus Cards */}
              <div className="space-y-3 pt-3 border-t border-white/5 mb-6">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-900/40 border border-purple-500/20 overflow-hidden flex-shrink-0">
                    <img src={item.foto_ketua} alt="Ketua" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs truncate">
                    <div className="text-purple-300 text-[9px] uppercase tracking-wider font-semibold">Ketua</div>
                    <div className="text-white font-medium truncate max-w-[150px]">{item.ketua}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-900/40 border border-purple-500/20 overflow-hidden flex-shrink-0">
                    <img src={item.foto_sekretaris} alt="Sekretaris" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs truncate">
                    <div className="text-purple-300 text-[9px] uppercase tracking-wider font-semibold">Sekretaris</div>
                    <div className="text-white font-medium truncate max-w-[150px]">{item.sekretaris}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* View Detail Action button */}
            <button
              onClick={() => setSelectedId(item.id)}
              className="w-full py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 text-white font-bold text-xs tracking-wider uppercase border border-purple-500/30 hover:border-purple-400/40 transition-all duration-200"
            >
              Lihat Detail &amp; Statistik
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

