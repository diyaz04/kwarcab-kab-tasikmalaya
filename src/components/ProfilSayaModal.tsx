import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera } from 'lucide-react';
import type { User } from '../types';
import { fotoOrDefault, onFotoError } from '../utils/foto';
import { notify } from '../utils/dialog';

interface ProfilSayaModalProps {
  user: User;
  token: string;
  roleLabel: string;
  onClose: () => void;
  /** Dipanggil dengan data akun terbaru setelah nama/foto tersimpan. */
  onUpdated: (user: User) => void;
  /** Unggah foto (dikompres di AdminPortal); hasilnya URL gambar. */
  onUploadFoto: (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => Promise<void> | void;
}

/** Profil akun yang sedang login: ganti foto, nama, dan password. */
export default function ProfilSayaModal({ user, token, roleLabel, onClose, onUpdated, onUploadFoto }: ProfilSayaModalProps) {
  const [nama, setNama] = useState(user.nama || '');
  const [foto, setFoto] = useState(user.foto || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwUlang, setPwUlang] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      notify.error('Foto masih diunggah, tunggu sampai selesai.');
      return;
    }
    const gantiPw = pwBaru.length > 0 || pwLama.length > 0 || pwUlang.length > 0;
    if (gantiPw) {
      if (!pwLama) return void notify.error('Isi password lama untuk mengganti password.');
      if (pwBaru.length < 6) return void notify.error('Password baru minimal 6 karakter.');
      if (pwBaru !== pwUlang) return void notify.error('Konfirmasi password baru tidak sama.');
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers, body: JSON.stringify({ nama: nama.trim(), foto }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil');

      if (gantiPw) {
        const pr = await fetch('/api/auth/password', { method: 'PUT', headers, body: JSON.stringify({ password: pwBaru, current_password: pwLama }) });
        const pd = await pr.json().catch(() => ({}));
        if (!pr.ok) {
          // nama & foto sudah tersimpan; beri tahu bahwa hanya password yang gagal
          onUpdated(data.user);
          throw new Error('Nama dan foto tersimpan, tetapi password belum diganti: ' + (pd.error || 'gagal'));
        }
      }
      onUpdated(data.user);
      notify.success(gantiPw ? 'Profil dan password berhasil diperbarui!' : 'Profil berhasil diperbarui!');
      onClose();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative my-auto">
        <button type="button" onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-gray-900 uppercase">Profil Saya</h3>

        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={fotoOrDefault(foto)}
              onError={onFotoError}
              alt="Foto profil"
              className="w-24 h-24 rounded-full object-cover object-top border-2 border-green-200 shadow-sm"
            />
            <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center cursor-pointer shadow-md" title="Ganti foto">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                className="hidden"
                onChange={async (e) => {
                  setUploading(true);
                  try { await onUploadFoto(e, setFoto); } finally { setUploading(false); }
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-gray-500">{uploading ? 'Mengunggah foto…' : 'Tanpa foto, otomatis memakai siluet bawaan'}</p>
          {foto && !uploading && (
            <button type="button" onClick={() => setFoto('')} className="text-[11px] text-red-600 hover:underline">Hapus foto</button>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-600 font-semibold">Nama</label>
          <input required value={nama} onChange={(e) => setNama(e.target.value)} maxLength={80} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Email login</label>
            <input value={user.email} disabled className="w-full bg-gray-100 text-xs text-gray-500 px-3 py-2 rounded-lg border border-gray-200" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Peran</label>
            <input value={roleLabel} disabled className="w-full bg-gray-100 text-xs text-gray-500 px-3 py-2 rounded-lg border border-gray-200" />
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-800">Ganti password <span className="font-normal text-gray-500">(kosongkan bila tidak diganti)</span></p>
          <input type="password" autoComplete="current-password" placeholder="Password lama" value={pwLama} onChange={(e) => setPwLama(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
          <input type="password" autoComplete="new-password" placeholder="Password baru (min. 6 karakter)" value={pwBaru} onChange={(e) => setPwBaru(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
          <input type="password" autoComplete="new-password" placeholder="Ulangi password baru" value={pwUlang} onChange={(e) => setPwUlang(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
        </div>

        <div className="flex justify-end space-x-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm">Batal</button>
          <button type="submit" disabled={saving || uploading} className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl text-white font-bold text-sm">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
