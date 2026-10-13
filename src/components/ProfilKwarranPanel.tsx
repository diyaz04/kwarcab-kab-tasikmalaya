import React, { useEffect, useState } from 'react';
import type { KwartirRanting, SosmedLinks } from '../types';
import SosmedFields from './SosmedFields';
import { sanitizeSosmed } from '../utils/sosmed';
import { fotoOrDefault, onFotoError } from '../utils/foto';
import { notify } from '../utils/dialog';

interface ProfilKwarranPanelProps {
  /** Data Kwarran milik akun yang sedang login. */
  kwarran: KwartirRanting | undefined;
  token: string;
  /** Dipanggil setelah berhasil disimpan (muat ulang data). */
  onSaved: () => void;
  /** Unggah foto (dikompres di AdminPortal); hasilnya URL gambar. */
  onUploadFoto: (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => Promise<void> | void;
}

const STATUS_LABEL: Record<string, string> = { aktif: 'Aktif', transisi: 'Masa Transisi', 'non-aktif': 'Non-Aktif' };

interface FotoFieldProps {
  id: string;
  label: string;
  value: string;
  busyKey: string | null;
  onPick: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FotoField({ id, label, value, busyKey, onPick }: FotoFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <img src={fotoOrDefault(value)} onError={onFotoError} alt={label} className="w-14 h-14 rounded-lg object-cover object-top border border-gray-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <input
          type="file"
          accept="image/*"
          disabled={busyKey !== null}
          onChange={(e) => onPick(id, e)}
          className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700"
        />
        {busyKey === id && <p className="text-[10px] text-amber-600 mt-1">Mengunggah foto…</p>}
      </div>
    </div>
  );
}

/** Halaman "Profil Kwarran" untuk akun Kwarran: ubah pengurus, foto, masa khidmat, dan media sosial. */
export default function ProfilKwarranPanel({ kwarran, token, onSaved, onUploadFoto }: ProfilKwarranPanelProps) {
  const [ketua, setKetua] = useState('');
  const [sekretaris, setSekretaris] = useState('');
  const [bendahara, setBendahara] = useState('');
  const [masaKhidmat, setMasaKhidmat] = useState('');
  const [fotoKetua, setFotoKetua] = useState('');
  const [fotoSekretaris, setFotoSekretaris] = useState('');
  const [fotoBendahara, setFotoBendahara] = useState('');
  const [sosmed, setSosmed] = useState<SosmedLinks>({});
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const sosmedKey = JSON.stringify(kwarran?.sosmed || {});
  useEffect(() => {
    if (!kwarran) return;
    setKetua(kwarran.ketua === '-' ? '' : kwarran.ketua || '');
    setSekretaris(kwarran.sekretaris === '-' ? '' : kwarran.sekretaris || '');
    setBendahara(kwarran.bendahara === '-' ? '' : kwarran.bendahara || '');
    setMasaKhidmat(kwarran.masa_khidmat || '');
    setFotoKetua(kwarran.foto_ketua || '');
    setFotoSekretaris(kwarran.foto_sekretaris || '');
    setFotoBendahara(kwarran.foto_bendahara || '');
    setSosmed(kwarran.sosmed || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kwarran?.id, kwarran?.ketua, kwarran?.sekretaris, kwarran?.bendahara, kwarran?.masa_khidmat, kwarran?.foto_ketua, kwarran?.foto_sekretaris, kwarran?.foto_bendahara, sosmedKey]);

  if (!kwarran) {
    return (
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8 text-sm text-gray-500 italic">
        Akun ini belum terhubung ke data Kwartir Ranting. Hubungi Superadmin Kwarcab.
      </div>
    );
  }

  const setters: Record<string, (v: string) => void> = { ketua: setFotoKetua, sekretaris: setFotoSekretaris, bendahara: setFotoBendahara };
  const pickFoto = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingKey(id);
    try { await onUploadFoto(e, setters[id]); } finally { setUploadingKey(null); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingKey) {
      notify.error('Foto masih diunggah, tunggu sampai selesai.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        ketua: ketua.trim() || '-',
        sekretaris: sekretaris.trim() || '-',
        bendahara: bendahara.trim() || '-',
        foto_ketua: fotoKetua,
        foto_sekretaris: fotoSekretaris,
        foto_bendahara: fotoBendahara,
        sosmed: sanitizeSosmed(sosmed)
      };
      // Masa Khidmat dikirim hanya jika diisi atau sebelumnya sudah ada (aman sebelum kolom DB dibuat)
      if (masaKhidmat.trim() || kwarran.masa_khidmat !== undefined) body.masa_khidmat = masaKhidmat.trim();

      const res = await fetch(`/api/admin/kwarran/${kwarran.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan profil Kwarran');
      }
      notify.success('Profil Kwarran berhasil disimpan!');
      onSaved();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal menyimpan profil Kwarran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6 animate-fade-in">
      <div className="border-b border-gray-100 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase">Kwartir Ranting {kwarran.nama_kecamatan}</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Data ini tampil di halaman Kwarran pada situs. Nama kecamatan dan status layanan dikelola oleh Kwarcab.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
          Status: {STATUS_LABEL[kwarran.status] || kwarran.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Nama Kecamatan</label>
          <input value={kwarran.nama_kecamatan} disabled className="w-full bg-gray-100 text-sm text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Masa Khidmat</label>
          <input
            value={masaKhidmat}
            maxLength={40}
            onChange={(e) => setMasaKhidmat(e.target.value)}
            placeholder="Contoh: 2023 - 2028"
            className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-600">Ketua Kwarran *</label>
          <input required value={ketua} onChange={(e) => setKetua(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200" />
          <FotoField id="ketua" label="Foto Ketua" value={fotoKetua} busyKey={uploadingKey} onPick={pickFoto} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Sekretaris *</label>
          <input required value={sekretaris} onChange={(e) => setSekretaris(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200" />
          <FotoField id="sekretaris" label="Foto Sekretaris" value={fotoSekretaris} busyKey={uploadingKey} onPick={pickFoto} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Bendahara *</label>
          <input required value={bendahara} onChange={(e) => setBendahara(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200" />
          <FotoField id="bendahara" label="Foto Bendahara" value={fotoBendahara} busyKey={uploadingKey} onPick={pickFoto} />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase">Media Sosial Kwarran</h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Link ini tampil sebagai tombol di halaman detail Kwarran pada situs. Kosongkan kolom yang tidak dipakai.
          </p>
        </div>
        <SosmedFields value={sosmed} onChange={setSosmed} />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving || uploadingKey !== null}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-xs uppercase tracking-wider"
        >
          {saving ? 'Menyimpan…' : 'Simpan Profil Kwarran'}
        </button>
      </div>
    </form>
  );
}
