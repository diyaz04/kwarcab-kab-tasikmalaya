import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, MapPin, Award, BookOpen, Calendar, Compass, 
  Globe, Info, ChevronLeft, ChevronRight, Share2 
} from 'lucide-react';
import { KampungPramuka } from '../types';
import { notify } from '../utils/dialog';

interface LandingKampungPramukaDetailProps {
  kp: KampungPramuka;
  onBack: () => void;
}

export default function LandingKampungPramukaDetail({ kp, onBack }: LandingKampungPramukaDetailProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Scroll smoothly to top when this view loads (instant to feel like a new page)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [kp]);

  const photos = kp.foto ? kp.foto.split(',').filter(Boolean) : [];

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
    <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Background ambient lighting */}
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-green-50 filter blur-3xl pointer-events-none -z-10 animate-pulse opacity-60"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-yellow-50 filter blur-3xl pointer-events-none -z-10 opacity-60"></div>

      {/* Navigation Breadcrumb & Back Button */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-green-700 border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Kembali ke Beranda</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
          <span className="cursor-pointer hover:text-green-700" onClick={onBack}>
            Beranda
          </span>
          <span>/</span>
          <span className="text-green-700 font-semibold">Kampung Pramuka {kp.nama}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* 1. Jumbotron Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-yellow-50 border border-yellow-200 shadow-inner text-yellow-600">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-yellow-600 font-bold tracking-widest uppercase flex items-center gap-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '20s' }} />
                  <span>Rintisan Kampung Pramuka Binaan Kwarcab</span>
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-green-900 font-heading tracking-tight leading-tight">
                  Kampung Pramuka {kp.nama}
                </h1>
                <p className="text-xs text-gray-500 font-light mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  <span>Kecamatan {kp.kecamatan}, Kabupaten Tasikmalaya, Jawa Barat</span>
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                <Globe className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                <span>Kampung Binaan Terdaftar</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Grid Dashboard Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Photos & Geospatial Metadata (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Visual Showcase (Photo Gallery) */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2.5 font-heading">
                Dokumentasi Visual
              </h3>
              
              <div className="h-64 sm:h-80 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-50 flex items-center justify-center group/gallery">
                {photos.length > 0 ? (
                  <>
                    <img 
                      src={photos[activePhotoIndex]} 
                      alt={`Dokumentasi ${kp.nama}`} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Shadow gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-transparent to-transparent h-20 pointer-events-none"></div>

                    {/* Navigation Buttons */}
                    {photos.length > 1 && (
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between z-10">
                        <button
                          onClick={handlePrevPhoto}
                          className="p-2 rounded-xl bg-white/80 hover:bg-white border border-gray-200 text-gray-700 transition cursor-pointer backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-mono bg-white/80 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 backdrop-blur-sm">
                          {activePhotoIndex + 1} / {photos.length}
                        </span>
                        <button
                          onClick={handleNextPhoto}
                          className="p-2 rounded-xl bg-white/80 hover:bg-white border border-gray-200 text-gray-700 transition cursor-pointer backdrop-blur-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-400 text-xs font-light flex flex-col items-center gap-2 py-12">
                    <Globe className="w-12 h-12 stroke-1 text-gray-300" />
                    <span>Tidak ada dokumentasi foto yang diunggah</span>
                  </div>
                )}
              </div>

              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((ph, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`h-12 sm:h-14 rounded-lg overflow-hidden border transition-all ${idx === activePhotoIndex ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200 opacity-65 hover:opacity-100'}`}
                    >
                      <img src={ph} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Geospasial & Adminsitrative Info Panel */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2.5 font-heading">
                Sistem Koordinat &amp; Publikasi
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 text-[11px]">Garis Lintang (Lat):</span>
                  <span className="text-green-700 font-bold">{kp.latitude.toFixed(8)}° S</span>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 text-[11px]">Garis Bujur (Lon):</span>
                  <span className="text-green-700 font-bold">{kp.longitude.toFixed(8)}° E</span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 text-[11px]">Diresmikan Pada:</span>
                  <span className="text-gray-900">
                    {new Date(kp.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-[10px] text-yellow-800 leading-relaxed flex items-start gap-2 font-light">
                <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>Titik ini merupakan hasil validasi geo-mapping resmi oleh tim IT Pusdatin Kwarcab Kabupaten Tasikmalaya.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Sejarah & Keunggulan (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Sejarah Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-grow space-y-4">
              <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider font-heading">
                  Sejarah Pendirian &amp; Latar Belakang
                </h3>
              </div>

              <p className="text-sm text-gray-600 font-light leading-relaxed text-justify bg-gray-50 p-5 rounded-2xl border border-gray-100 whitespace-pre-line">
                {kp.sejarah || `Kampung Pramuka rintisan di Kecamatan ${kp.kecamatan} didirikan dengan tujuan utama menghidupkan kembali semangat gotong royong, kemandirian pemuda, serta menyinergikan pola pembinaan karakter kepanduan Gerakan Pramuka dengan potensi luhur masyarakat pedesaan.`}
              </p>
            </div>

            {/* Keunggulan Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-grow space-y-4">
              <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
                <div className="p-2 rounded-xl bg-green-50 border border-green-200 text-green-600">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider font-heading">
                  Keunggulan &amp; Potensi Unggulan Kampung
                </h3>
              </div>

              <p className="text-sm text-gray-600 font-light leading-relaxed text-justify bg-gray-50 p-5 rounded-2xl border border-gray-100 whitespace-pre-line">
                {kp.keunggulan || 'Memiliki keunggulan strategis dalam pengembangan agro-wisata, budidaya lokal, serta kerajinan tradisional yang dikelola secara kolektif oleh anggota Pramuka Penegak/Pandega bersama warga masyarakat setempat.'}
              </p>
            </div>

            {/* Interactive program details card for premium touch */}
            <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-5 rounded-3xl border border-yellow-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider">Mari Kunjungi Kampung Pramuka</h4>
                <p className="text-[11px] text-gray-600 font-light leading-relaxed">
                  Buka kesempatan kolaborasi kunjungan studi banding, kemah bakti masyarakat, atau program edukasi kepanduan terintegrasi.
                </p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    notify.success('Tautan halaman Kampung Pramuka ini berhasil disalin ke clipboard!', 'Tautan Disalin');
                  } catch (_) {
                    notify.error('Tautan tidak bisa disalin otomatis. Salin manual dari address bar browser.', 'Gagal Menyalin');
                  }
                }}
                className="shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-[11px] uppercase transition cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Profil</span>
              </button>
            </div>

          </div>

        </div>

        {/* 3. Bottom Footer/Action Bar */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-green-700 font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-sm"
          >
            Tutup Profil &amp; Kembali ke Peta
          </button>
        </div>

      </motion.div>
    </div>
  );
}
