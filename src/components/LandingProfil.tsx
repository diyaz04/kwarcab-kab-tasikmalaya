import React from 'react';
import { fotoOrDefault, onFotoError } from '../utils/foto';
import { BookOpen, Award, Shield, Compass, Eye, ListOrdered, Calendar } from 'lucide-react';
import { PimpinanKwarcab, ProfilKwarcab } from '../types';

interface LandingProfilProps {
  profil: ProfilKwarcab | null;
  pimpinan: PimpinanKwarcab[];
}

export default function LandingProfil({ profil, pimpinan }: LandingProfilProps) {
  if (!profil) {
    return (
      <div className="py-20 text-center text-gray-500">
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
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Watermark Logo (Mockup Style) */}
      <div className="absolute top-10 -right-20 opacity-5 pointer-events-none w-96 h-96">
        <img 
          src="https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z" 
          alt="Watermark" 
          className="w-full h-full object-contain" 
        />
      </div>

      {/* Header (Mockup Style) */}
      <div className="text-left mb-16 relative z-10">
        <div className="w-8 h-1 bg-green-700 mb-3 rounded-full"></div>
        <h3 className="text-xs sm:text-sm text-green-700 font-bold uppercase tracking-wider mb-2">
          Tentang Kami
        </h3>
        <h2 className="text-3xl sm:text-5xl font-black text-blue-950 font-heading leading-tight max-w-2xl">
          Kwartir Cabang Kabupaten Tasikmalaya
        </h2>
      </div>

      {/* Visi & Misi */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {/* Visi */}
        <div className="bg-white rounded-3xl p-8 relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Eye className="w-32 h-32 text-green-700" />
          </div>
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-200">
              <Compass className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-heading">Visi Utama</h3>
          </div>
          <p className="text-lg text-gray-600 font-light leading-relaxed relative z-10">
            "{profil.visi}"
          </p>
        </div>

        {/* Misi */}
        <div className="bg-white rounded-3xl p-8 relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ListOrdered className="w-32 h-32 text-blue-500" />
          </div>
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
              <Award className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-heading">Misi Strategis</h3>
          </div>
          <ul className="space-y-4 relative z-10">
            {misiList.map((m, i) => (
              <li key={i} className="flex items-start space-x-3 text-gray-600 text-sm font-light leading-relaxed">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600">
                  {i + 1}
                </span>
                <span>{m.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pimpinan Inti Kwarcab */}
      <div className="mb-20">
        <div className="flex items-center justify-center space-x-3 mb-10 text-center">
          <Shield className="w-6 h-6 text-green-700" />
          <h3 className="text-2xl sm:text-3xl font-bold text-green-900 font-heading">Pimpinan Inti Kwartir Cabang</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {[
            { jabatan: 'Ketua Kwartir Cabang', nama: profil.ketua_kwarcab_nama, foto: profil.ketua_kwarcab_foto },
            { jabatan: 'Ketua Harian', nama: profil.ketua_harian_nama, foto: profil.ketua_harian_foto },
            { jabatan: 'Sekretaris Cabang', nama: profil.sekretaris_nama, foto: profil.sekretaris_foto },
            { jabatan: 'Bendahara Cabang', nama: profil.bendahara_nama, foto: profil.bendahara_foto },
          ].map((pim, idx) => (
            pim.nama && (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden flex flex-col h-full border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="relative h-72 overflow-hidden bg-gray-50 flex items-center justify-center group">
                  <img src={fotoOrDefault(pim.foto)} onError={onFotoError} alt={pim.nama} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-left">
                    <p className="text-[10px] sm:text-xs text-green-400 font-bold uppercase tracking-widest mb-1">{pim.jabatan}</p>
                    <h4 className="text-sm sm:text-base font-black text-white leading-tight">{pim.nama}</h4>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Sejarah Kwarcab */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-50 filter blur-3xl opacity-50"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-50 filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-200">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">Catatan Sejarah Singkat</h3>
          </div>
          
          <div className="text-gray-600 font-light text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
            {profil.sejarah}
          </div>
        </div>
      </div>
    </div>
  );
}
