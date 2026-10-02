import React, { useState, useMemo, useRef } from 'react';
import { X, MapPin, Globe, Award, BookOpen, ChevronLeft, ChevronRight, Map as MapIcon, Info } from 'lucide-react';
import { KampungPramuka } from '../types';
import { KECAMATAN_SHAPES, KECAMATAN_VIEWBOX, projectLatLon } from '../data/kecamatanMap';

interface LandingMapProps {
  items: KampungPramuka[];
  onSelectKp?: (kp: KampungPramuka) => void;
}

type KecStatus = 'aktif' | 'proses' | 'belum';

const STATUS_STYLE: Record<KecStatus, { fill: string; label: string; badge: string }> = {
  aktif: { fill: '#22c55e', label: 'Sudah ada Kampung Pramuka', badge: 'bg-green-100 text-green-800 border-green-200' },
  proses: { fill: '#facc15', label: 'Dalam proses', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  belum: { fill: '#ef4444', label: 'Belum ada', badge: 'bg-red-100 text-red-800 border-red-200' }
};

// "Gunung Tanjung", "Gunungtanjung", "Kec. Gunungtanjung" -> "gunungtanjung"
const normName = (s: string) =>
  (s || '').toLowerCase().replace(/^kec(amatan|\.)?\s*/i, '').replace(/[^a-z]/g, '');

// Kampung tanpa status dianggap sudah berjalan (data lama sebelum ada kolom status).
const kpStatus = (kp: KampungPramuka): 'aktif' | 'proses' => (kp.status === 'proses' ? 'proses' : 'aktif');

export default function LandingMap({ items, onSelectKp }: LandingMapProps) {
  const [selectedKp, setSelectedKp] = useState<KampungPramuka | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedKecId, setSelectedKecId] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (kp: KampungPramuka) => {
    if (onSelectKp) {
      onSelectKp(kp);
    } else {
      setSelectedKp(kp);
      setActivePhotoIndex(0);
    }
  };

  // Kelompokkan kampung per kecamatan (dicocokkan lewat nama yang dinormalkan)
  const kpByKec = useMemo(() => {
    const map: Record<string, KampungPramuka[]> = {};
    items.forEach((kp) => {
      const key = normName(kp.kecamatan);
      (map[key] = map[key] || []).push(kp);
    });
    return map;
  }, [items]);

  const shapes = useMemo(
    () =>
      KECAMATAN_SHAPES.map((s) => {
        const kps = kpByKec[normName(s.name)] || [];
        const status: KecStatus = kps.some((k) => kpStatus(k) === 'aktif')
          ? 'aktif'
          : kps.length > 0
            ? 'proses'
            : 'belum';
        return { ...s, kps, status };
      }),
    [kpByKec]
  );

  const counts = useMemo(() => {
    const c = { aktif: 0, proses: 0, belum: 0 };
    shapes.forEach((s) => { c[s.status] += 1; });
    return c;
  }, [shapes]);

  const hovered = shapes.find((s) => s.id === hoveredId) || null;
  const selectedKec = shapes.find((s) => s.id === selectedKecId) || null;
  const listItems = selectedKec ? selectedKec.kps : items;

  const points = items
    .filter((kp) => Number.isFinite(Number(kp.latitude)) && Number.isFinite(Number(kp.longitude)))
    .map((kp) => ({ kp, ...projectLatLon(Number(kp.latitude), Number(kp.longitude)) }));

  const moveTip = (e: React.MouseEvent) => {
    const box = mapBoxRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top });
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
    <section id="peta-sebaran" className="pt-32 pb-20 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-green-50 filter blur-3xl -z-10 animate-pulse opacity-60"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-50 filter blur-3xl -z-10 opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 shadow-sm">
            <Globe className="w-4 h-4 text-yellow-600 animate-spin" style={{ animationDuration: '15s' }} />
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-yellow-700">Peta Sebaran</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-green-900 font-heading tracking-tight">
            Sebaran Kampung Pramuka
          </h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
            Peta 39 kecamatan Kabupaten Tasikmalaya. Warna menunjukkan perkembangan Kampung Pramuka di tiap kecamatan.
            Klik kecamatan atau titik lokasi untuk melihat kampung di wilayah tersebut.
          </p>
        </div>

        {/* Main Interface: Map + Sidebar List */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">

          {/* Left / Top Side: Peta vektor kecamatan (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[560px] sm:h-[680px] rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 relative">

            {/* Ringkasan jumlah per status */}
            <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex flex-wrap items-center gap-2 z-10 pointer-events-none">
              {(['aktif', 'proses', 'belum'] as KecStatus[]).map((st) => (
                <div key={st} className="flex items-center space-x-1.5 bg-white/90 px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm backdrop-blur-md">
                  <span className="w-3 h-3 rounded-sm" style={{ background: STATUS_STYLE[st].fill }}></span>
                  <span className="text-[10px] font-bold text-gray-700">{STATUS_STYLE[st].label}: {counts[st]}</span>
                </div>
              ))}
            </div>

            <div ref={mapBoxRef} className="flex-grow w-full h-full relative bg-[#F8FAFC] select-none">
              <svg
                viewBox={`0 0 ${KECAMATAN_VIEWBOX.width} ${KECAMATAN_VIEWBOX.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full pt-10 sm:pt-12 pb-2 px-2"
                role="img"
                aria-label="Peta kecamatan Kabupaten Tasikmalaya"
              >
                {shapes.map((s) => {
                  const isHover = hoveredId === s.id;
                  const isSel = selectedKecId === s.id;
                  return (
                    <path
                      key={s.id}
                      d={s.d}
                      fillRule="evenodd"
                      fill={STATUS_STYLE[s.status].fill}
                      fillOpacity={isHover || isSel ? 1 : 0.82}
                      stroke={isSel ? '#0f172a' : '#ffffff'}
                      strokeWidth={isSel ? 2.4 : 1.2}
                      strokeLinejoin="round"
                      className="cursor-pointer transition-[fill-opacity] duration-150"
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseMove={moveTip}
                      onMouseLeave={() => { setHoveredId(null); setTip(null); }}
                      onClick={() => setSelectedKecId((cur) => (cur === s.id ? null : s.id))}
                    />
                  );
                })}

                {/* Titik lokasi tiap Kampung Pramuka (dari koordinat) */}
                {points.map(({ kp, x, y }) => (
                  <g
                    key={kp.id}
                    transform={`translate(${x} ${y})`}
                    className="cursor-pointer"
                    onClick={() => handleSelect(kp)}
                  >
                    <circle r="9" fill="#ffffff" stroke="#14532d" strokeWidth="2.5" />
                    <circle r="3.6" fill="#14532d" />
                    <title>{kp.nama}</title>
                  </g>
                ))}
              </svg>

              {/* Tooltip nama kecamatan */}
              {hovered && tip && (
                <div
                  className="absolute z-20 pointer-events-none bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-[11px] leading-tight"
                  style={{ left: Math.min(tip.x + 14, (mapBoxRef.current?.clientWidth || 600) - 170), top: Math.max(tip.y - 46, 44) }}
                >
                  <div className="font-bold">Kec. {hovered.name}</div>
                  <div className="text-gray-300 mt-0.5">
                    {STATUS_STYLE[hovered.status].label}
                    {hovered.kps.length > 0 && ` \u2022 ${hovered.kps.length} kampung`}
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 z-10 bg-white/90 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-[9px] text-gray-600 font-light flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                <Info className="w-3.5 h-3.5 text-green-600" />
                Arahkan ke kecamatan untuk detail, klik untuk melihat kampungnya.
              </div>
            </div>
          </div>

          {/* Right Side: List / Info Card Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">

            {/* List Header */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-2">
              {selectedKec ? (
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest truncate">Kecamatan {selectedKec.name}</div>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[selectedKec.status].badge}`}>
                    {STATUS_STYLE[selectedKec.status].label}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Daftar Kampung ({items.length})</span>
              )}
              {selectedKec ? (
                <button
                  type="button"
                  onClick={() => setSelectedKecId(null)}
                  className="text-[10px] font-bold text-green-700 hover:underline shrink-0"
                >
                  Tampilkan semua
                </button>
              ) : (
                <MapIcon className="w-4 h-4 text-green-600" />
              )}
            </div>

            {/* Scrollable list of locations */}
            <div className="flex-grow max-h-[380px] lg:max-h-[560px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {listItems.map((kp) => {
                const isSelected = selectedKp?.id === kp.id;
                const st = kpStatus(kp);
                return (
                  <button
                    key={kp.id}
                    onClick={() => handleSelect(kp)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected ? 'bg-green-50 border-green-300 shadow-md shadow-green-900/5' : 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm hover:shadow-md'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>{kp.nama}</h4>
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-light mt-1">Kecamatan {kp.kecamatan}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1.5 font-mono text-[9px] text-green-700">
                        <span>{Number(kp.latitude).toFixed(4)}° S</span>
                        <span className="text-gray-300">&bull;</span>
                        <span>{Number(kp.longitude).toFixed(4)}° E</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[st === 'aktif' ? 'aktif' : 'proses'].badge}`}>
                        {st === 'aktif' ? 'Aktif' : 'Dalam proses'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {listItems.length === 0 && (
                <div className="bg-white p-8 text-center text-xs text-gray-500 font-light rounded-2xl border border-dashed border-gray-200">
                  {selectedKec
                    ? `Belum ada Kampung Pramuka di Kecamatan ${selectedKec.name}.`
                    : 'Belum ada data Kampung Pramuka yang diinput oleh admin.'}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* --- EXPANDED DETAILS DRAWER/MODAL --- */}
        {selectedKp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl relative p-5 sm:p-8 space-y-6">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedKp(null)}
                className="absolute top-5 right-5 z-50 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Title Banner */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-green-700 font-extrabold uppercase tracking-widest">Profil Kampung Pramuka Binaan</span>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-heading mt-0.5">
                    {selectedKp.nama}
                  </h3>
                  <p className="text-xs text-gray-500 font-light mt-1">
                    Wilayah Pembinaan Kwartir Ranting Kecamatan {selectedKp.kecamatan}
                  </p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid md:grid-cols-12 gap-6 items-stretch">
                
                {/* Photo Gallery Slideshow (5 cols) */}
                <div className="md:col-span-5 flex flex-col space-y-2">
                  <div className="h-64 sm:h-72 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center shadow-sm">
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
                              className="p-1.5 rounded-lg bg-white/80 border border-gray-200 text-gray-700 hover:bg-white transition cursor-pointer backdrop-blur-sm"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono bg-white/80 border border-gray-200 px-2 py-0.5 rounded-md text-gray-800 backdrop-blur-sm">
                              {activePhotoIndex + 1} / {photos.length}
                            </span>
                            <button
                              onClick={handleNextPhoto}
                              className="p-1.5 rounded-lg bg-white/80 border border-gray-200 text-gray-700 hover:bg-white transition cursor-pointer backdrop-blur-sm"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-400 text-xs font-light flex flex-col items-center gap-2">
                        <Globe className="w-10 h-10 stroke-1" />
                        <span>Tidak ada dokumentasi foto</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Geographic Metadata */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 font-mono text-[10px] space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Garis Lintang:</span>
                      <span className="text-green-700 font-bold">{selectedKp.latitude.toFixed(6)}° S</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Garis Bujur:</span>
                      <span className="text-green-700 font-bold">{selectedKp.longitude.toFixed(6)}° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Diresmikan:</span>
                      <span className="text-gray-900 font-semibold">{new Date(selectedKp.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Sejarah & Keunggulan Columns (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  
                  {/* Sejarah */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Sejarah Pendirian &amp; Latar Belakang</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed text-justify bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {selectedKp.sejarah}
                    </p>
                  </div>

                  {/* Keunggulan */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-yellow-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>Keunggulan &amp; Potensi Unggulan Kampung</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed text-justify bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {selectedKp.keunggulan}
                    </p>
                  </div>

                </div>

              </div>

              {/* Bottom Citation Line */}
              <div className="pt-4 border-t border-gray-100 text-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">
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
