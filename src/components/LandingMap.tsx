import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, X, MapPin, Globe, Award, BookOpen, ChevronLeft, ChevronRight, Map as MapIcon, Info } from 'lucide-react';
import { KampungPramuka } from '../types';

interface LandingMapProps {
  items: KampungPramuka[];
  onSelectKp?: (kp: KampungPramuka) => void;
}

export default function LandingMap({ items, onSelectKp }: LandingMapProps) {
  const [selectedKp, setSelectedKp] = useState<KampungPramuka | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef<(kp: KampungPramuka) => void>(() => {});

  const handleSelect = (kp: KampungPramuka) => {
    if (onSelectKp) {
      onSelectKp(kp);
    } else {
      setSelectedKp(kp);
      setActivePhotoIndex(0);
    }
  };
  onSelectRef.current = handleSelect;

  const validItems = items.filter(
    (kp) => Number.isFinite(Number(kp.latitude)) && Number.isFinite(Number(kp.longitude))
  );

  // Buat peta sekali
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, { scrollWheelZoom: false }).setView([-7.45, 108.15], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Pasang / perbarui marker dari koordinat tiap Kampung Pramuka
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    validItems.forEach((kp) => {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:34px;height:34px;border-radius:12px;background:#fff;border:2px solid #16a34a;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:#15803d"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });
      const marker = L.marker([Number(kp.latitude), Number(kp.longitude)], { icon, title: kp.nama })
        .addTo(map)
        .bindTooltip(kp.nama, { direction: 'top', offset: [0, -34] });
      marker.on('click', () => onSelectRef.current(kp));
      markersRef.current.set(kp.id, marker);
    });

    if (validItems.length === 1) {
      map.setView([Number(validItems[0].latitude), Number(validItems[0].longitude)], 13);
    } else if (validItems.length > 1) {
      map.fitBounds(
        L.latLngBounds(validItems.map((kp) => [Number(kp.latitude), Number(kp.longitude)] as [number, number])),
        { padding: [60, 60], maxZoom: 13 }
      );
    }
  }, [items]);

  // Klik di daftar / marker -> geser peta ke lokasi tersebut
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedKp) return;
    const lat = Number(selectedKp.latitude);
    const lon = Number(selectedKp.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  }, [selectedKp]);

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
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 shadow-sm">
            <Globe className="w-4 h-4 text-yellow-600 animate-spin" style={{ animationDuration: '15s' }} />
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-yellow-700">Geospasial Interaktif</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-green-900 font-heading tracking-tight">
            Sebaran Kampung Pramuka
          </h2>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
            Eksplorasi peta digital rintisan Kampung Pramuka di Kabupaten Tasikmalaya. Klik pada pin lokasi di peta atau daftar wilayah di samping untuk melihat sejarah pendirian dan keunggulan masing-masing kampung.
          </p>
        </div>

        {/* Main Interface: Map Canvas + Sidebar List */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left / Top Side: Interactive Map Container (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[520px] sm:h-[600px] rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow">
            
            {/* Map Top Metadata Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-white/90 to-transparent p-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm backdrop-blur-md">
                <Compass className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-green-900 uppercase tracking-wider">Peta Sebaran Kampung Pramuka</span>
              </div>
              <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm backdrop-blur-md text-[9px] font-mono text-gray-600 pointer-events-auto">
                {validItems.length} lokasi
              </div>
            </div>

            {/* PETA ASLI (OpenStreetMap) - posisi pin dibaca dari koordinat tiap Kampung Pramuka */}
            <div ref={mapDivRef} className="flex-grow w-full h-full relative z-0" />

            {/* Floating Helper Tip */}
            <div className="absolute bottom-6 left-4 z-10 bg-white/90 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-[9px] text-gray-600 font-light flex items-center gap-1 backdrop-blur-sm pointer-events-none">
              <Info className="w-3.5 h-3.5 text-green-600" />
              Arahkan ke pin untuk nama, klik untuk profil lengkap.
            </div>
          </div>

          {/* Right Side: List / Info Card Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            
            {/* List Header */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Daftar Kampung ({items.length})</span>
              <MapIcon className="w-4 h-4 text-green-600" />
            </div>

            {/* Scrollable list of locations */}
            <div className="flex-grow max-h-[380px] lg:max-h-[500px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {items.map((kp) => {
                const isSelected = selectedKp?.id === kp.id;
                return (
                  <button
                    key={kp.id}
                    onClick={() => {
                      handleSelect(kp);
                      const m = mapRef.current;
                      if (m && Number.isFinite(Number(kp.latitude)) && Number.isFinite(Number(kp.longitude))) {
                        m.flyTo([Number(kp.latitude), Number(kp.longitude)], Math.max(m.getZoom(), 12), { duration: 0.8 });
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected ? 'bg-green-50 border-green-300 shadow-md shadow-green-900/5' : 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm hover:shadow-md'}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>{kp.nama}</h4>
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-green-600 animate-bounce' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-light mt-1">Kecamatan {kp.kecamatan}</p>
                    <div className="flex items-center space-x-1.5 mt-2 font-mono text-[9px] text-green-700">
                      <span>{kp.latitude.toFixed(4)}° S</span>
                      <span className="text-gray-300">&bull;</span>
                      <span>{kp.longitude.toFixed(4)}° E</span>
                    </div>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="bg-white p-8 text-center text-xs text-gray-500 font-light rounded-2xl border border-dashed border-gray-200">
                  Belum ada data Kampung Pramuka yang diinput oleh admin.
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
