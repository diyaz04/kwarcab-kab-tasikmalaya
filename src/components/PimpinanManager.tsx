import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Edit, Plus, Trash2, X } from 'lucide-react';
import type { PimpinanKwarcab } from '../types';
import { fotoOrDefault, onFotoError } from '../utils/foto';
import { confirmDialog, notify } from '../utils/dialog';

type Kategori = 'inti' | 'pengurus';

interface PimpinanManagerProps {
  items: PimpinanKwarcab[];
  token: string;
  /** Dipanggil setelah data berubah supaya daftar admin & landing page dimuat ulang. */
  onChanged: () => void;
  /** Unggah foto (dikompres di AdminPortal); hasilnya URL gambar. */
  onUploadFoto: (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => Promise<void> | void;
}

const KATEGORI_LABEL: Record<Kategori, string> = {
  inti: 'Pimpinan Inti',
  pengurus: 'Pengurus'
};

const kategoriOf = (p: PimpinanKwarcab): Kategori => (p.kategori === 'inti' ? 'inti' : 'pengurus');

/**
 * Admin menambah / mengubah / menghapus / mengurutkan siapa saja yang tampil sebagai Pimpinan Inti dan
 * Pengurus Kwarcab di halaman Profil. (Ketua, Ketua Harian, Sekretaris, Bendahara tetap diisi di form di atas.)
 */
export default function PimpinanManager({ items, token, onChanged, onUploadFoto }: PimpinanManagerProps) {
  const [editing, setEditing] = useState<PimpinanKwarcab | 'new' | null>(null);
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [kategori, setKategori] = useState<Kategori>('pengurus');
  const [foto, setFoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0)),
    [items]
  );
  const groups: Record<Kategori, PimpinanKwarcab[]> = {
    inti: sorted.filter(p => kategoriOf(p) === 'inti'),
    pengurus: sorted.filter(p => kategoriOf(p) === 'pengurus')
  };

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const openNew = (k: Kategori) => {
    setEditing('new');
    setNama('');
    setJabatan('');
    setKategori(k);
    setFoto('');
  };

  const openEdit = (p: PimpinanKwarcab) => {
    setEditing(p);
    setNama(p.nama);
    setJabatan(p.jabatan);
    setKategori(kategoriOf(p));
    setFoto(p.foto || '');
  };

  const request = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Permintaan gagal');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      notify.error('Foto masih diunggah, tunggu sampai selesai.');
      return;
    }
    setBusy(true);
    try {
      const isNew = editing === 'new';
      const maxUrutan = sorted.reduce((m, p) => Math.max(m, p.urutan ?? 0), 0);
      const body: Record<string, unknown> = { nama: nama.trim(), jabatan: jabatan.trim(), foto };
      // Kolom kategori dikirim hanya jika perlu (Pimpinan Inti, atau data yang sudah punya kategori).
      if (kategori === 'inti' || (!isNew && (editing as PimpinanKwarcab).kategori !== undefined)) {
        body.kategori = kategori;
      }
      if (isNew) {
        body.urutan = maxUrutan + 1;
        await request('/api/admin/pimpinan', 'POST', body);
      } else {
        await request(`/api/admin/pimpinan/${(editing as PimpinanKwarcab).id}`, 'PUT', body);
      }
      notify.success('Data berhasil disimpan.');
      setEditing(null);
      onChanged();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: PimpinanKwarcab) => {
    if (!(await confirmDialog({ title: 'Hapus dari daftar', message: `Hapus ${p.nama} (${p.jabatan}) dari halaman Profil?`, danger: true }))) return;
    try {
      await request(`/api/admin/pimpinan/${p.id}`, 'DELETE');
      notify.success('Data dihapus.');
      onChanged();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal menghapus');
    }
  };

  // Tukar urutan dengan tetangga di kelompok yang sama
  const move = async (k: Kategori, index: number, dir: -1 | 1) => {
    const list = groups[k];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    // Beri nomor urut unik berurutan supaya pertukaran selalu berefek, walau urutan lama sama.
    const reordered = [...list];
    reordered[index] = b;
    reordered[target] = a;
    const base = Math.min(...list.map(p => p.urutan ?? 0));
    try {
      await Promise.all(
        reordered.map((p, i) =>
          (p.urutan ?? 0) === base + i ? Promise.resolve() : request(`/api/admin/pimpinan/${p.id}`, 'PUT', { urutan: base + i })
        )
      );
      onChanged();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal mengubah urutan');
    }
  };

  const renderGroup = (k: Kategori) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
          {KATEGORI_LABEL[k]} ({groups[k].length})
        </h4>
        <button
          type="button"
          onClick={() => openNew(k)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>
      {groups[k].length === 0 ? (
        <div className="text-[11px] text-gray-500 italic bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
          Belum ada. Klik "Tambah" untuk menambahkan.
        </div>
      ) : (
        <div className="space-y-2">
          {groups[k].map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-2.5">
              <img
                src={fotoOrDefault(p.foto)}
                onError={onFotoError}
                alt={p.nama}
                className="w-11 h-11 rounded-lg object-cover object-top border border-gray-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 truncate">{p.nama}</div>
                <div className="text-[11px] text-gray-500 truncate">{p.jabatan}</div>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <button type="button" onClick={() => move(k, i, -1)} disabled={i === 0} title="Naikkan" className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => move(k, i, 1)} disabled={i === groups[k].length - 1} title="Turunkan" className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => openEdit(p)} title="Ubah" className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => remove(p)} title="Hapus" className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6 sm:p-8 mt-6 space-y-5">
      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold text-gray-900 uppercase">Pimpinan Inti &amp; Pengurus Kwarcab</h3>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          Tambahkan siapa saja yang tampil di halaman Profil. <b>Pimpinan Inti</b> tampil setelah Ketua, Ketua Harian,
          Sekretaris, dan Bendahara di atas. <b>Pengurus</b> tampil di bagian "Pengurus Kwartir Cabang". Gunakan panah untuk mengatur urutan.
        </p>
      </div>

      {renderGroup('inti')}
      {renderGroup('pengurus')}

      {editing && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Tutup">
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-gray-900 uppercase">
              {editing === 'new' ? 'Tambah' : 'Ubah'} {KATEGORI_LABEL[kategori]}
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 font-semibold">Nama &amp; Gelar *</label>
              <input required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 font-semibold">Jabatan *</label>
              <input required value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Contoh: Wakil Ketua Bidang Organisasi" className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 font-semibold">Ditampilkan sebagai</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value as Kategori)} className="w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-300">
                <option value="inti">Pimpinan Inti</option>
                <option value="pengurus">Pengurus Kwarcab</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 font-semibold">Foto</label>
              <div className="flex items-center gap-3">
                <img src={fotoOrDefault(foto)} onError={onFotoError} alt="Pratinjau" className="w-14 h-14 rounded-lg object-cover object-top border border-gray-200 shrink-0" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    setUploading(true);
                    try {
                      await onUploadFoto(e, setFoto);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700"
                />
              </div>
              <p className="text-[10px] text-gray-500">{uploading ? 'Mengunggah foto…' : 'Kosongkan untuk memakai foto siluet bawaan.'}</p>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm">Batal</button>
              <button type="submit" disabled={busy || uploading} className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl text-white font-bold text-sm">
                {busy ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
