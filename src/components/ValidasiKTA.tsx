import React, { useState, useEffect } from 'react';
import { Anggota } from '../types';
import { BadgeCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

interface VerifyResponse {
  anggota: Anggota;
  kwarran_nama: string;
  gudep_nama: string;
  saka_nama: string;
}

interface ValidasiKTAProps {
  id: string;
}

const ValidasiKTA: React.FC<ValidasiKTAProps> = ({ id }) => {
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidasi = async () => {
      try {
        const response = await fetch(`/api/public/verify-anggota/${id}`);
        if (!response.ok) {
          throw new Error('Data tidak ditemukan');
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Gagal memvalidasi anggota');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchValidasi();
    } else {
      setError('ID Anggota tidak valid');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </a>
          <div className="flex justify-center mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/90/Logo_Gerakan_Pramuka.svg" alt="Pramuka" className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Validasi KTA Pramuka</h1>
          <p className="text-gray-500 mt-1">Kwartir Cabang Gerakan Pramuka Kab. Tasikmalaya</p>
        </div>

        {error ? (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden p-8 text-center border-t-4 border-red-500">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Validasi Gagal</h2>
            <p className="text-gray-600">{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Kartu Tanda Anggota ini mungkin tidak valid atau belum terdaftar di sistem pendataan Kwarcab Kab. Tasikmalaya.
            </p>
          </div>
        ) : data ? (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-green-500">
            <div className="p-6 text-center bg-green-50/50 border-b border-green-100">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <BadgeCheck className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Anggota Terverifikasi</h2>
              <p className="text-green-700 font-medium">Data KTA sesuai dengan sistem Pusdatin Kwarcab.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                {data.anggota.foto ? (
                  <img src={data.anggota.foto} alt="Foto Profil" className="w-24 h-32 object-cover rounded-lg shadow-md mb-4 border border-gray-200" />
                ) : (
                  <div className="w-24 h-32 bg-gray-200 rounded-lg shadow-inner mb-4 flex items-center justify-center text-gray-400">
                    No Photo
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 text-center uppercase">{data.anggota.nama_lengkap}</h3>
                <span className="mt-1 px-3 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded-full uppercase tracking-wide">
                  {data.anggota.golongan} - {data.anggota.tingkatan}
                </span>
              </div>
              
              <div className="border-t border-gray-100 pt-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">NTA (Nomor Tanda Anggota)</dt>
                    <dd className="mt-1 text-base font-bold text-gray-900 font-mono">09.01.{data.anggota.id.replace('ang_', '').padStart(5, '0')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tempat, Tanggal Lahir</dt>
                    <dd className="mt-1 text-base text-gray-900">{data.anggota.tempat_lahir}, {new Date(data.anggota.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pangkalan</dt>
                    <dd className="mt-1 text-base text-gray-900 font-medium">{data.anggota.pangkalan}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kwartir Ranting</dt>
                    <dd className="mt-1 text-base text-gray-900">{data.kwarran_nama}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">Data ini divalidasi secara realtime dari server Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ValidasiKTA;
