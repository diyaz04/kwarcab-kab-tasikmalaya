import React, { useEffect, useState } from 'react';
import { Trophy, Plus, Trash2, Upload, Save, FileDown } from 'lucide-react';
import type { Lt3Data, Lt3Jenis, Lt3Kelompok, KwartirRanting } from '../types';
import { normalizeLt3, bannerStatus, KELOMPOK_LIST, KELOMPOK_LABEL } from '../utils/lt3';
import { notify, confirmDialog } from '../utils/dialog';

interface Lt3ManagerProps {
  token: string;
  allKwarran: KwartirRanting[];
  /** Unggah gambar (dikompres di AdminPortal); hasilnya URL gambar. */
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => Promise<void> | void;
  /** Dipanggil setelah data tersimpan (menyegarkan landing page). */
  onSaved: () => void;
}

const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
const MAX_JUKNIS_BYTES = 3 * 1024 * 1024; // batas body request di Vercel ~4,5 MB (base64 menambah ±33%)

const STATUS_BANNER: Record<string, { label: string; cls: string }> = {
  aktif: { label: 'Sedang tampil sebagai popup', cls: 'bg-green-100 text-green-800 border-green-300' },
  belum: { label: 'Belum mulai', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  berakhir: { label: 'Masa tampil sudah berakhir', cls: 'bg-gray-100 text-gray-600 border-gray-300' },
  nonaktif: { label: 'Tidak tampil (menu/banner nonaktif atau gambar kosong)', cls: 'bg-gray-100 text-gray-600 border-gray-300' }
};

const inputCls = 'w-full bg-white text-sm text-gray-900 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500';

/** Pengelola menu "Info LT III" di dashboard admin: pengaturan, banner popup, juknis, mata lomba, regu, dan nilai. */
export default function Lt3Manager({ token, allKwarran, onUploadImage, onSaved }: Lt3ManagerProps) {
  const [data, setData] = useState<Lt3Data | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingJuknis, setUploadingJuknis] = useState(false);
  const [jenis, setJenis] = useState<Lt3Jenis>('putra');
  const [reguNama, setReguNama] = useState('');
  const [reguAsal, setReguAsal] = useState('');
  const [reguKwarran, setReguKwarran] = useState('');
  const [lombaBaru, setLombaBaru] = useState('');
  const [lombaKelompok, setLombaKelompok] = useState<Lt3Kelompok>('utama');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/public/lt3', { cache: 'no-store' });
        setData(normalizeLt3(r.ok ? await r.json() : null));
      } catch {
        setData(normalizeLt3(null));
      }
    })();
  }, []);

  if (!data) return <p className="text-xs text-gray-500">Memuat…</p>;

  const update = (fn: (d: Lt3Data) => Lt3Data) => { setData(prev => (prev ? fn(prev) : prev)); setDirty(true); };

  const save = async () => {
    if (uploadingBanner || uploadingJuknis) return void notify.error('Tunggu sampai unggahan selesai.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/lt3', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Gagal menyimpan Info LT III');
      setData(normalizeLt3(out));
      setDirty(false);
      notify.success('Info LT III berhasil disimpan!');
      onSaved();
    } catch (err: any) {
      notify.error(err?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const uploadJuknis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return void notify.error('Juknis harus berformat PDF.');
    if (file.size > MAX_JUKNIS_BYTES) return void notify.error('Ukuran PDF maksimal 3 MB. Untuk file lebih besar, unggah ke Google Drive lalu tempel linknya di kolom "Link juknis".');
    setUploadingJuknis(true);
    try {
      const base64Data: string = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
        fr.onerror = () => reject(new Error('Gagal membaca file'));
        fr.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ filename: file.name, base64Data, contentType: 'application/pdf' }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.url) throw new Error(out.error || 'Unggah gagal');
      update(d => ({ ...d, juknis: { url: out.url, nama: d.juknis.nama || file.name.replace(/\.pdf$/i, '') } }));
      notify.success('Juknis terunggah. Klik Simpan untuk menerapkan.');
    } catch (err: any) {
      notify.error('Gagal mengunggah juknis: ' + (err?.message || err));
    } finally {
      setUploadingJuknis(false);
    }
  };

  const tambahRegu = () => {
    const nama = reguNama.trim();
    if (!reguKwarran) return void notify.error('Pilih Kwarran yang diwakili regu.');
    if (!nama) return void notify.error('Nama regu wajib diisi.');
    update(d => ({ ...d, regu: [...d.regu, { id: newId('rg'), nama, kwarran: reguKwarran, asal: reguAsal.trim(), jenis }] }));
    setReguNama('');
    setReguAsal('');
  };
  const hapusRegu = async (id: string, nama: string) => {
    if (!(await confirmDialog({ title: 'Hapus Regu', message: `Hapus regu "${nama}" beserta semua nilainya?`, danger: true }))) return;
    update(d => ({ ...d, regu: d.regu.filter(r => r.id !== id) }));
  };
  const tambahLomba = () => {
    const nama = lombaBaru.trim();
    if (!nama) return;
    update(d => ({ ...d, lomba: [...d.lomba, { id: newId('lb'), nama, kelompok: lombaKelompok, diumumkan: false }] }));
    setLombaBaru('');
  };
  const hapusLomba = async (id: string, nama: string) => {
    if (!(await confirmDialog({ title: 'Hapus Mata Lomba', message: `Hapus mata lomba "${nama}" beserta semua nilainya?`, danger: true }))) return;
    update(d => { const { [id]: _drop, ...sisa } = d.nilai; return { ...d, lomba: d.lomba.filter(l => l.id !== id), nilai: sisa }; });
  };
  const setPoin = (k: Lt3Kelompok, m: 'emas' | 'perak' | 'perunggu', raw: string) => update(d => {
    const n = raw === '' ? 0 : Number(raw);
    return Number.isFinite(n) && n >= 0 ? { ...d, poin: { ...d.poin, [k]: { ...d.poin[k], [m]: n } } } : d;
  });
  const setKelompokLomba = (id: string, kelompok: Lt3Kelompok) => update(d => ({ ...d, lomba: d.lomba.map(l => (l.id === id ? { ...l, kelompok } : l)) }));
  const setNilai = (lombaId: string, reguId: string, raw: string) => update(d => {
    const lomba = { ...(d.nilai[lombaId] || {}) };
    if (raw === '') delete lomba[reguId]; else { const n = Number(raw); if (Number.isFinite(n)) lomba[reguId] = n; }
    return { ...d, nilai: { ...d.nilai, [lombaId]: lomba } };
  });

  const status = STATUS_BANNER[bannerStatus(data)];
  const reguJenis = data.regu.filter(r => r.jenis === jenis);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-700" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Info LT III</h3>
            <p className="text-[11px] text-gray-500">Pengumuman, popup banner, juknis, dan klasemen sementara di landing page.</p>
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wide">
          <Save className="w-4 h-4" /> {saving ? 'Menyimpan…' : dirty ? 'Simpan Perubahan' : 'Simpan'}
        </button>
      </div>

      {/* Pengaturan umum */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Tampilkan menu "Info LT III" di landing page</p>
            <p className="text-[11px] text-gray-500">{data.aktif ? 'AKTIF — menu terlihat oleh pengunjung.' : 'NONAKTIF — menu dan popup disembunyikan.'}</p>
          </div>
          <button type="button" role="switch" aria-checked={data.aktif} onClick={() => update(d => ({ ...d, aktif: !d.aktif }))}
            className={`relative w-12 h-7 rounded-full transition flex-shrink-0 ${data.aktif ? 'bg-green-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${data.aktif ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Judul halaman</label>
            <input className={inputCls} maxLength={120} value={data.judul} onChange={(e) => update(d => ({ ...d, judul: e.target.value }))} placeholder="Contoh: LT III Penggalang Kwarcab Tasikmalaya 2026" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Tanggal pengumuman</label>
            <input type="date" className={inputCls} value={data.pengumuman_tanggal} onChange={(e) => update(d => ({ ...d, pengumuman_tanggal: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600 font-semibold">Pengumuman</label>
          <textarea rows={6} maxLength={5000} className={inputCls} value={data.pengumuman} onChange={(e) => update(d => ({ ...d, pengumuman: e.target.value }))} placeholder="Tulis pengumuman LT III (jadwal, lokasi, persyaratan, dll.). Baris baru ikut tampil." />
        </div>
      </section>

      {/* Banner popup */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">Popup banner promosi</p>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${status.cls}`}>{status.label}</span>
        </div>
        <div className="grid sm:grid-cols-[200px_1fr] gap-5">
          <div className="space-y-2">
            <div className="aspect-[4/5] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {data.banner.url ? <img src={data.banner.url} alt="Banner" className="w-full h-full object-contain" /> : <span className="text-[11px] text-gray-400 text-center px-3">Belum ada banner</span>}
            </div>
            <label className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-green-300 bg-green-50 text-green-800 text-[11px] font-bold cursor-pointer hover:bg-green-100 ${uploadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-3.5 h-3.5" /> {uploadingBanner ? 'Mengunggah…' : 'Upload banner'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                setUploadingBanner(true);
                try { await onUploadImage(e, (url) => update(d => ({ ...d, banner: { ...d.banner, url } }))); } finally { setUploadingBanner(false); }
              }} />
            </label>
            {data.banner.url && <button type="button" onClick={() => update(d => ({ ...d, banner: { ...d.banner, url: '' } }))} className="w-full text-[11px] text-red-600 hover:underline">Hapus banner</button>}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-800">Tampilkan sebagai popup</p>
                <p className="text-[11px] text-gray-500">Muncul sekali per kunjungan, hanya dalam masa aktif di bawah.</p>
              </div>
              <button type="button" role="switch" aria-checked={data.banner.tampil} onClick={() => update(d => ({ ...d, banner: { ...d.banner, tampil: !d.banner.tampil } }))}
                className={`relative w-12 h-7 rounded-full transition flex-shrink-0 ${data.banner.tampil ? 'bg-green-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${data.banner.tampil ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600 font-semibold">Judul banner (teks di bawah gambar)</label>
              <input className={inputCls} maxLength={120} value={data.banner.judul} onChange={(e) => update(d => ({ ...d, banner: { ...d.banner, judul: e.target.value } }))} placeholder="Contoh: Pendaftaran LT III Dibuka!" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-600 font-semibold">Mulai tampil</label>
                <input type="date" className={inputCls} value={data.banner.mulai} onChange={(e) => update(d => ({ ...d, banner: { ...d.banner, mulai: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-600 font-semibold">Berakhir (sampai tanggal)</label>
                <input type="date" className={inputCls} value={data.banner.selesai} min={data.banner.mulai || undefined} onChange={(e) => update(d => ({ ...d, banner: { ...d.banner, selesai: e.target.value } }))} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">Kosongkan tanggal untuk tanpa batas. Banner tetap tampil sampai hari terakhir yang dipilih.</p>
          </div>
        </div>
      </section>

      {/* Juknis */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><FileDown className="w-4 h-4 text-green-700" /> Juknis LT III</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Nama dokumen</label>
            <input className={inputCls} maxLength={120} value={data.juknis.nama} onChange={(e) => update(d => ({ ...d, juknis: { ...d.juknis, nama: e.target.value } }))} placeholder="Contoh: Juknis LT III Penggalang 2026" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600 font-semibold">Link juknis (PDF / Google Drive)</label>
            <input className={inputCls} maxLength={600} value={data.juknis.url} onChange={(e) => update(d => ({ ...d, juknis: { ...d.juknis, url: e.target.value } }))} placeholder="https://…" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-green-300 bg-green-50 text-green-800 text-[11px] font-bold cursor-pointer hover:bg-green-100 ${uploadingJuknis ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-3.5 h-3.5" /> {uploadingJuknis ? 'Mengunggah…' : 'Upload PDF (maks. 3 MB)'}
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={uploadJuknis} />
          </label>
          {data.juknis.url && <a href={data.juknis.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-700 font-bold hover:underline">Cek link ↗</a>}
        </div>
        <p className="text-[11px] text-gray-500">Jika PDF yang diunggah tidak bisa dibuka pengunjung, pakai link Google Drive (bagikan "Siapa saja yang memiliki link").</p>
      </section>

      {/* Mata lomba */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-sm font-bold text-gray-900">Mata lomba</p>
        <div className="flex flex-wrap gap-2">
          {data.lomba.length === 0 && <span className="text-xs text-gray-400">Belum ada mata lomba. Tambahkan di bawah (mis. Tali-Temali, PBB, Semaphore, Pionering).</span>}
          {data.lomba.length > 0 && <p className="w-full text-[11px] text-gray-500">Centang <b>Umumkan juara</b> pada lomba yang hasilnya sudah resmi, maka juara 1, 2, dan 3 tampil di bagian "Pengumuman Kejuaraan" landing page.</p>}
          {data.lomba.map(l => (
            <span key={l.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs font-semibold text-green-900">
              {l.nama}
              <label className="inline-flex items-center gap-1 text-[10px] font-bold text-green-800 cursor-pointer" title="Centang untuk menampilkan juara 1, 2, dan 3 lomba ini di landing page">
                <input type="checkbox" checked={l.diumumkan === true} onChange={(e) => update(d => ({ ...d, lomba: d.lomba.map(x => (x.id === l.id ? { ...x, diumumkan: e.target.checked } : x)) }))} className="accent-green-600" />
                Umumkan juara
              </label>
              <select value={l.kelompok} onChange={(e) => setKelompokLomba(l.id, e.target.value as Lt3Kelompok)} title="Kelompok lomba" className="bg-white border border-green-200 rounded-md text-[10px] font-bold text-green-800 px-1 py-0.5 focus:outline-none">
                {KELOMPOK_LIST.map(k => <option key={k} value={k}>{KELOMPOK_LABEL[k]}</option>)}
              </select>
              <button type="button" onClick={() => hapusLomba(l.id, l.nama)} title="Hapus mata lomba" className="w-5 h-5 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={lombaKelompok} onChange={(e) => setLombaKelompok(e.target.value as Lt3Kelompok)} className={inputCls + ' !w-auto flex-shrink-0'}>
            {KELOMPOK_LIST.map(k => <option key={k} value={k}>{KELOMPOK_LABEL[k]}</option>)}
          </select>
          <input className={inputCls} maxLength={80} value={lombaBaru} onChange={(e) => setLombaBaru(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); tambahLomba(); } }} placeholder="Nama mata lomba baru" />
          <button type="button" onClick={tambahLomba} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex-shrink-0"><Plus className="w-4 h-4" /> Tambah</button>
        </div>
      </section>

      {/* Poin medali per kelompok lomba */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Poin medali per kelompok lomba</p>
          <p className="text-[11px] text-gray-500">Juara 1, 2, dan 3 tiap mata lomba mendapat emas, perak, dan perunggu. Poinnya mengikuti kelompok lomba. Klasemen Kwarran diurutkan dari total poin ini.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[380px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-y border-gray-100">
                <th className="py-2.5 px-3 text-left">Kelompok</th>
                <th className="py-2.5 px-3 text-center">🥇 Emas</th>
                <th className="py-2.5 px-3 text-center">🥈 Perak</th>
                <th className="py-2.5 px-3 text-center">🥉 Perunggu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {KELOMPOK_LIST.map(k => (
                <tr key={k}>
                  <td className="py-2 px-3 font-bold text-gray-900">{KELOMPOK_LABEL[k]} <span className="font-normal text-gray-400">({data.lomba.filter(l => l.kelompok === k).length} lomba)</span></td>
                  {(['emas', 'perak', 'perunggu'] as const).map(m => (
                    <td key={m} className="py-2 px-3">
                      <input type="number" min={0} step="any" inputMode="decimal" value={data.poin[k][m]} onChange={(e) => setPoin(k, m, e.target.value)}
                        className="w-20 mx-auto block text-center bg-white text-sm text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Regu & nilai */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">Regu &amp; nilai per mata lomba</p>
          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold">
            {(['putra', 'putri'] as Lt3Jenis[]).map(j => (
              <button key={j} type="button" onClick={() => setJenis(j)} className={`px-4 py-2 ${jenis === j ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'}`}>
                Regu {j === 'putra' ? 'Putra' : 'Putri'} ({data.regu.filter(r => r.jenis === j).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <select className={inputCls} value={reguKwarran} onChange={(e) => setReguKwarran(e.target.value)}>
            <option value="">-- Kwarran yang diwakili --</option>
            {[...allKwarran].sort((a, b) => a.nama_kecamatan.localeCompare(b.nama_kecamatan)).map(k => <option key={k.id} value={k.nama_kecamatan}>Kwarran {k.nama_kecamatan}</option>)}
          </select>
          <input className={inputCls} maxLength={80} value={reguNama} onChange={(e) => setReguNama(e.target.value)} placeholder={`Nama regu ${jenis} (mis. Regu Elang)`} />
          <input className={inputCls} maxLength={120} value={reguAsal} onChange={(e) => setReguAsal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); tambahRegu(); } }} placeholder="Asal pangkalan (opsional)" />
          <button type="button" onClick={tambahRegu} className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold"><Plus className="w-4 h-4" /> Tambah regu</button>
        </div>

        {reguJenis.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada regu {jenis}.</p>
        ) : data.lomba.length === 0 ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Tambahkan mata lomba dulu agar nilai bisa diisi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-y border-gray-100">
                  <th className="py-2.5 px-3">Regu</th>
                  {data.lomba.map(l => <th key={l.id} className="py-2.5 px-2 text-center whitespace-nowrap">{l.nama}<div className="normal-case font-normal text-[9px] text-gray-400">{KELOMPOK_LABEL[l.kelompok]}</div></th>)}
                  <th className="py-2.5 px-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reguJenis.map(r => (
                  <tr key={r.id}>
                    <td className="py-2 px-3">
                      <div className="font-bold text-gray-900">{r.nama}</div>
                      <div className="text-[10px] text-gray-500">{r.kwarran ? `Kwarran ${r.kwarran}` : 'Belum ada Kwarran'}{r.asal ? ` • ${r.asal}` : ''}</div>
                    </td>
                    {data.lomba.map(l => (
                      <td key={l.id} className="py-2 px-2">
                        <input
                          type="number" inputMode="decimal" min={0} step="any"
                          value={data.nilai[l.id]?.[r.id] ?? ''}
                          onChange={(e) => setNilai(l.id, r.id, e.target.value)}
                          className="w-20 mx-auto block text-center bg-white text-sm text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-2 text-right">
                      <button type="button" onClick={() => hapusRegu(r.id, r.nama)} title="Hapus regu" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-500">Kosongkan kolom nilai bila belum dinilai. Klasemen di landing page per Kwarran: medali emas, perak, perunggu dihitung dari peringkat 1, 2, 3 tiap mata lomba. Jangan lupa klik <b>Simpan</b>.</p>
      </section>
    </div>
  );
}
