import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { User, KwartirRanting, GugusDepan } from '../types';
import { GOLONGAN_ORDER, GOLONGAN_LABEL, TINGKATAN_MAP, PERAN_DEWASA } from '../utils/tingkatan';
import { notify } from '../utils/dialog';

interface ImportAnggotaModalProps {
  user: User;
  token: string;
  allKwarran: KwartirRanting[];
  gudepList: GugusDepan[];
  onClose: () => void;
  /** Dipanggil setelah impor berhasil menyimpan data. */
  onDone: () => void;
}

interface ImportResult { baris: number; status: 'ok' | 'error' | 'duplikat'; pesan: string }
interface ImportResponse { dry_run: boolean; total: number; berhasil: number; duplikat: number; gagal: number; results: ImportResult[] }

type ColKey = string;
interface Col { key: ColKey; header: string; width: number; wajib?: boolean }

const MAX_ROWS = 1000;
const SHEET = 'Data Anggota';

/** Kolom template mengikuti peran: Kwarcab pilih Kwarran + Gudep, Kwarran hanya Gudep, Gudep tidak keduanya. */
const buildColumns = (role: string): Col[] => {
  const cols: Col[] = [
    { key: 'nama_lengkap', header: 'Nama Lengkap', width: 30, wajib: true },
    { key: 'jenis_kelamin', header: 'Jenis Kelamin', width: 16, wajib: true },
    { key: 'tempat_lahir', header: 'Tempat Lahir', width: 20, wajib: true },
    { key: 'tanggal_lahir', header: 'Tanggal Lahir', width: 16, wajib: true },
    { key: 'golongan', header: 'Golongan', width: 14, wajib: true },
    { key: 'tingkatan', header: 'Tingkatan', width: 26 },
    { key: 'alamat_asal', header: 'Alamat', width: 34 },
  ];
  if (role !== 'kwarran' && role !== 'gudep') cols.push({ key: 'kwarran', header: 'Kwarran', width: 20, wajib: true });
  if (role !== 'gudep') cols.push({ key: 'gudep', header: 'Gugus Depan', width: 28 });
  cols.push({ key: 'pelatih', header: 'Pelatih', width: 12 });
  PERAN_DEWASA.forEach(p => cols.push({ key: 'peran_' + p.id, header: p.label, width: 18 }));
  return cols;
};

const norm = (v: string) => v.toLowerCase().replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/** Ubah nilai sel Excel (teks, angka, tanggal, rich text, rumus) menjadi teks biasa. */
const cellText = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    const y = v.getUTCFullYear(), m = String(v.getUTCMonth() + 1).padStart(2, '0'), d = String(v.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t: any) => t.text).join('').trim();
    if ('result' in v) return cellText(v.result);
    if ('text' in v) return cellText(v.text);
    return '';
  }
  return String(v).trim();
};

export default function ImportAnggotaModal({ user, token, allKwarran, gudepList, onClose, onDone }: ImportAnggotaModalProps) {
  const cols = buildColumns(user.role);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = async () => {
    setBusy(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Sistem Informasi Kwarcab Kab. Tasikmalaya';

      // ---- Sheet "Daftar Pilihan" (sumber dropdown)
      // urutan tab: Data Anggota, Petunjuk, Daftar Pilihan
      const ws = wb.addWorksheet(SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
      const pt = wb.addWorksheet('Petunjuk');
      const ref = wb.addWorksheet('Daftar Pilihan');
      // Kwarcab: Gugus Depan dipilih bergantung pada Kwarran (dropdown berantai), supaya hanya Gudep di wilayah itu yang muncul.
      const perKwarran = user.role !== 'kwarran' && user.role !== 'gudep';
      const kwarranSorted = [...allKwarran].sort((a, b) => a.nama_kecamatan.localeCompare(b.nama_kecamatan));
      const gdNamaDi = (kwId: string) => gudepList.filter(g => g.kwartir_ranting_id === kwId).map(g => g.nama_pangkalan).sort();
      const lists: { title: string; items: string[] }[] = [
        { title: 'Jenis Kelamin', items: ['Laki-laki', 'Perempuan'] },
        { title: 'Golongan', items: GOLONGAN_ORDER.map(g => GOLONGAN_LABEL[g]) },
        { title: 'Pelatih', items: ['Ya', 'Tidak'] },
        { title: 'Ya', items: ['Ya'] },
        { title: 'Kwarran', items: allKwarran.map(k => k.nama_kecamatan).sort() },
        ...(perKwarran ? [] : [{ title: 'Gugus Depan', items: gudepList.map(g => g.nama_pangkalan).sort() }]),
      ];
      lists.forEach((l, i) => {
        const c = ref.getColumn(i + 1);
        c.width = 28;
        ref.getCell(1, i + 1).value = l.title;
        ref.getCell(1, i + 1).font = { bold: true };
        l.items.forEach((it, r) => { ref.getCell(r + 2, i + 1).value = it; });
      });
      const nameKw = (kec: string) => 'GD_' + kec.toUpperCase().replace(/[ -.'/]/g, '_');
      if (perKwarran) {
        // blok kolom Gugus Depan per Kwarran, dimulai setelah daftar umum (dilewati satu kolom)
        const start = lists.length + 2;
        kwarranSorted.forEach((kw, i) => {
          const col = start + i;
          ref.getColumn(col).width = 28;
          ref.getCell(1, col).value = 'Gudep ' + kw.nama_kecamatan;
          ref.getCell(1, col).font = { bold: true };
          const items = gdNamaDi(kw.id);
          items.forEach((it, r) => { ref.getCell(r + 2, col).value = it; });
          const letter = ref.getColumn(col).letter;
          wb.definedNames.add(`'Daftar Pilihan'!$${letter}$2:$${letter}$${Math.max(2, items.length + 1)}`, nameKw(kw.nama_kecamatan));
        });
      }
      // Blok Tingkatan per golongan (nama range TK_<GOLONGAN>) untuk dropdown berantai
      {
        const tkStart = lists.length + 2 + (perKwarran ? kwarranSorted.length + 1 : 0);
        GOLONGAN_ORDER.forEach((g, i) => {
          const col = tkStart + i;
          ref.getColumn(col).width = 24;
          ref.getCell(1, col).value = 'Tingkatan ' + GOLONGAN_LABEL[g];
          ref.getCell(1, col).font = { bold: true };
          TINGKATAN_MAP[g].forEach((it, r) => { ref.getCell(r + 2, col).value = it; });
          const letter = ref.getColumn(col).letter;
          wb.definedNames.add(`'Daftar Pilihan'!$${letter}$2:$${letter}$${TINGKATAN_MAP[g].length + 1}`, 'TK_' + GOLONGAN_LABEL[g].toUpperCase().replace(/ /g, '_'));
        });
      }
      const rangeOf = (title: string) => {
        const idx = lists.findIndex(l => l.title === title);
        const letter = String.fromCharCode(65 + idx);
        return `'Daftar Pilihan'!$${letter}$2:$${letter}$${Math.max(2, lists[idx].items.length + 1)}`;
      };

      // ---- Sheet "Data Anggota"
      ws.columns = cols.map(c => ({ header: c.wajib ? `${c.header} *` : c.header, key: c.key, width: c.width }));
      const head = ws.getRow(1);
      head.height = 24;
      head.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
        cell.alignment = { vertical: 'middle' };
      });
      const colLetter = (key: ColKey) => ws.getColumn(cols.findIndex(c => c.key === key) + 1).letter;
      const has = (key: ColKey) => cols.some(c => c.key === key);
      type DV = Record<string, any>;
      // Semua validasi bersifat KETAT: isian di luar pilihan ditolak Excel dengan pesan yang jelas.
      const setDV = (key: ColKey, make: (row: number) => DV) => {
        if (!has(key)) return;
        const L = colLetter(key);
        for (let r = 2; r <= MAX_ROWS + 1; r++) ws.getCell(`${L}${r}`).dataValidation = { allowBlank: true, showErrorMessage: true, errorStyle: 'stop', showInputMessage: true, ...make(r) } as any;
      };
      const listDV = (formula: string, errorTitle: string, error: string, prompt?: string) => (_r: number): DV =>
        ({ type: 'list', formulae: [formula], errorTitle, error, ...(prompt ? { promptTitle: errorTitle, prompt } : {}) });
      const safeName = (v: string) => v.toUpperCase().replace(/[ \-.'/]/g, '_');
      const subst = (ref: string) => `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(UPPER(${ref})," ","_"),"-","_"),".","_"),"'","_"),"/","_")`;

      setDV('nama_lengkap', () => ({ type: 'textLength', operator: 'between', formulae: [1, 120], errorTitle: 'Nama Lengkap', error: 'Nama wajib diisi (maksimal 120 karakter).' }));
      setDV('jenis_kelamin', listDV(rangeOf('Jenis Kelamin'), 'Jenis Kelamin', 'Pilih dari daftar: Laki-laki atau Perempuan.', 'Pilih Laki-laki atau Perempuan'));
      setDV('tanggal_lahir', () => ({ type: 'date', operator: 'between', formulae: [new Date(Date.UTC(1900, 0, 2)), new Date()], errorTitle: 'Tanggal Lahir', error: 'Isi tanggal yang valid, contoh 23/05/2012. Tidak boleh di masa depan.', promptTitle: 'Tanggal Lahir', prompt: 'Format hh/bb/tttt, contoh 23/05/2012' }));
      setDV('golongan', listDV(rangeOf('Golongan'), 'Golongan', 'Pilih golongan dari daftar.', 'Pilih golongan dulu, lalu Tingkatan'));
      // Tingkatan bergantung pada Golongan (Calon Siaga: "-")
      {
        const gL = colLetter('golongan');
        setDV('tingkatan', (r) => ({ type: 'list', formulae: [`INDIRECT("TK_"&${subst(`$${gL}${r}`)})`], errorTitle: 'Tingkatan', error: 'Pilih Golongan dulu, lalu pilih Tingkatan dari daftar (hanya tingkatan golongan tersebut).' }));
      }
      setDV('kwarran', listDV(rangeOf('Kwarran'), 'Kwarran', 'Pilih Kwarran dari daftar (tidak boleh diketik bebas).'));
      if (perKwarran) {
        const kwL = colLetter('kwarran');
        setDV('gudep', (r) => ({ type: 'list', formulae: [`INDIRECT("GD_"&${subst(`$${kwL}${r}`)})`], errorTitle: 'Gugus Depan', error: 'Pilih Kwarran dulu, lalu pilih Gugus Depan dari daftar (hanya Gudep di wilayah Kwarran itu).' }));
      } else {
        setDV('gudep', listDV(rangeOf('Gugus Depan'), 'Gugus Depan', 'Pilih Gugus Depan dari daftar.'));
      }
      setDV('pelatih', listDV(rangeOf('Pelatih'), 'Pelatih', 'Pilih Ya atau Tidak.', 'Hanya untuk Dewasa KPD / KPL'));
      PERAN_DEWASA.forEach(p => setDV('peran_' + p.id, listDV(rangeOf('Ya'), 'Peran: ' + p.label, 'Pilih Ya atau kosongkan.', 'Pilih Ya bila berperan sebagai ' + p.label)));
      // Teks bebas yang dibatasi panjangnya
      setDV('tempat_lahir', () => ({ type: 'textLength', operator: 'lessThanOrEqual', formulae: [80], errorTitle: 'Tempat Lahir', error: 'Maksimal 80 karakter.' }));
      setDV('alamat_asal', () => ({ type: 'textLength', operator: 'lessThanOrEqual', formulae: [250], errorTitle: 'Alamat', error: 'Maksimal 250 karakter.' }));
      const tglCol = ws.getColumn(cols.findIndex(c => c.key === 'tanggal_lahir') + 1);
      tglCol.numFmt = 'dd/mm/yyyy';

      // ---- Sheet "Petunjuk"
      pt.getColumn(1).width = 30;
      pt.getColumn(2).width = 90;
      const lines: [string, string][] = [
        ['PETUNJUK PENGISIAN', ''],
        ['', ''],
        ['Cara pakai', `Isi sheet "${SHEET}" mulai baris 2 (maksimal ${MAX_ROWS} baris), simpan sebagai .xlsx, lalu unggah lewat tombol "Impor Excel" di menu Anggota. Jangan ubah judul kolom di baris 1.`],
        ['Kolom bertanda *', 'Wajib diisi.'],
        ['Jenis Kelamin *', 'Laki-laki atau Perempuan (L / P juga diterima).'],
        ['Tanggal Lahir *', 'Format 23/05/2012 atau 2012-05-23. Tidak boleh di masa depan.'],
        ['Golongan *', GOLONGAN_ORDER.map(g => GOLONGAN_LABEL[g]).join(', ')],
        ['Tingkatan', 'Pilih Golongan dulu, lalu pilih Tingkatan (lihat tabel di bawah). Calon Siaga: pilih "-" atau kosongkan.'],
      ];
      if (user.role !== 'kwarran' && user.role !== 'gudep') lines.push(['Kwarran *', 'Nama kecamatan sesuai daftar (mis. Ciawi atau Kwarran Ciawi).']);
      if (user.role === 'kwarran') lines.push(['Wilayah', 'Anggota otomatis masuk ke Kwarran Anda.']);
      if (user.role === 'gudep') lines.push(['Wilayah', 'Anggota otomatis masuk ke Gugus Depan Anda.']);
      if (user.role !== 'gudep') lines.push(['Gugus Depan', 'Opsional. Pilih Kwarran dulu, lalu dropdown ini hanya menampilkan Gugus Depan di wilayah Kwarran itu. Harus sudah terdaftar (lihat sheet "Daftar Pilihan").']);
      lines.push(
        ['Pelatih', 'Hanya untuk Dewasa dengan tingkatan KPD atau KPL: isi Ya atau Tidak.'],
        ['Kolom Peran', 'Hanya untuk Dewasa. Ada satu kolom per peran (' + PERAN_DEWASA.map(p => p.label).join(', ') + '). Pilih "Ya" pada peran yang dijalani, boleh lebih dari satu; kosongkan jika tidak.'],
        ['Dropdown', 'Semua kolom pilihan wajib diisi lewat dropdown; isian di luar daftar ditolak Excel. Tingkatan bergantung pada Golongan, Gugus Depan bergantung pada Kwarran.'],
        ['Data ganda', 'Anggota dengan nama dan tanggal lahir yang sama di Kwarran yang sama dilewati.'],
        ['', ''],
        ['TINGKATAN PER GOLONGAN', ''],
        ...GOLONGAN_ORDER.map(g => [GOLONGAN_LABEL[g], TINGKATAN_MAP[g].join(', ')] as [string, string]),
      );
      lines.forEach((l, i) => {
        pt.getCell(i + 1, 1).value = l[0];
        pt.getCell(i + 1, 2).value = l[1];
        pt.getCell(i + 1, 1).font = { bold: true };
        pt.getCell(i + 1, 2).alignment = { wrapText: true, vertical: 'top' };
        pt.getCell(i + 1, 1).alignment = { vertical: 'top' };
      });
      pt.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF15803D' } };

      const buf = await wb.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template-Impor-Anggota.xlsx';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      notify.error('Gagal membuat template: ' + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const postImport = async (payloadRows: Record<string, any>[], dryRun: boolean): Promise<ImportResponse> => {
    const res = await fetch('/api/admin/anggota/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rows: payloadRows, dry_run: dryRun })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Impor gagal');
    return data;
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreview(null);
    setRows([]);
    setFileName(file.name);
    if (!/\.xlsx$/i.test(file.name)) return void notify.error('Gunakan file Excel berformat .xlsx (unduh template dari tombol di atas).');
    if (file.size > 5 * 1024 * 1024) return void notify.error('Ukuran file maksimal 5 MB.');
    setBusy(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.getWorksheet(SHEET) || wb.worksheets[0];
      if (!ws) throw new Error('File tidak berisi lembar data.');

      // petakan judul kolom -> nomor kolom
      const colIndex: Partial<Record<ColKey, number>> = {};
      ws.getRow(1).eachCell((cell, n) => {
        const h = norm(cellText(cell.value));
        const found = cols.find(c => norm(c.header) === h);
        if (found) colIndex[found.key] = n;
      });
      const missing = cols.filter(c => c.wajib && !colIndex[c.key]).map(c => c.header);
      if (missing.length > 0) throw new Error(`Judul kolom tidak sesuai template (tidak ditemukan: ${missing.join(', ')}). Unduh template terbaru lalu isi ulang.`);

      const parsed: Record<string, any>[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, any> = { baris: rowNumber };
        let any = false;
        cols.forEach(c => {
          const n = colIndex[c.key];
          const t = n ? cellText(row.getCell(n).value) : '';
          if (t) any = true;
          obj[c.key] = t;
        });
        const perans = PERAN_DEWASA.filter(p => /^(ya|y|x|1|true)$/i.test(String(obj['peran_' + p.id] || '').trim())).map(p => p.label);
        obj.peran = perans.join(', ');
        if (any) parsed.push(obj);
      });
      if (parsed.length === 0) throw new Error('Tidak ada data anggota di file. Isi data mulai baris 2.');
      if (parsed.length > MAX_ROWS) throw new Error(`Maksimal ${MAX_ROWS} baris per impor (file berisi ${parsed.length}). Pecah menjadi beberapa file.`);

      setRows(parsed);
      setPreview(await postImport(parsed, true));
    } catch (err: any) {
      setFileName('');
      notify.error(err?.message || 'Gagal membaca file Excel');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    if (!preview || preview.berhasil === 0) return;
    setBusy(true);
    try {
      const r = await postImport(rows, false);
      notify.success(`${r.berhasil} anggota berhasil diimpor.${r.gagal + r.duplikat > 0 ? ` ${r.gagal + r.duplikat} baris dilewati.` : ''}`);
      onDone();
      onClose();
    } catch (err: any) {
      notify.error(err?.message || 'Impor gagal');
    } finally {
      setBusy(false);
    }
  };

  const bermasalah = preview ? preview.results.filter(r => r.status !== 'ok') : [];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative my-auto">
        <button type="button" onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-green-700" /> Impor Anggota dari Excel</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Unduh template, isi data anggota, lalu unggah kembali. Data diperiksa dulu sebelum disimpan.
            {user.role === 'kwarran' && ' Anggota otomatis masuk ke Kwarran Anda.'}
            {user.role === 'gudep' && ' Anggota otomatis masuk ke Gugus Depan Anda.'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button type="button" onClick={downloadTemplate} disabled={busy}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-green-300 bg-green-50 text-green-800 text-xs font-bold hover:bg-green-100 disabled:opacity-50">
            <Download className="w-4 h-4" /> 1. Unduh Template (.xlsx)
          </button>
          <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" /> 2. {fileName ? 'Pilih File Lain' : 'Unggah File Terisi'}
            <input type="file" accept=".xlsx" className="hidden" onChange={onPickFile} />
          </label>
        </div>

        {busy && <p className="text-xs text-gray-500 text-center">Memproses…</p>}

        {preview && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500">File: <span className="font-semibold text-gray-700">{fileName}</span> • {preview.total} baris terbaca</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                <div className="text-xl font-black text-green-700">{preview.berhasil}</div>
                <div className="text-[10px] font-bold text-green-800 uppercase">Siap diimpor</div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <div className="text-xl font-black text-amber-700">{preview.duplikat}</div>
                <div className="text-[10px] font-bold text-amber-800 uppercase">Data ganda</div>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <div className="text-xl font-black text-red-700">{preview.gagal}</div>
                <div className="text-[10px] font-bold text-red-800 uppercase">Perlu diperbaiki</div>
              </div>
            </div>

            {bermasalah.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Baris yang tidak akan diimpor
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {bermasalah.slice(0, 200).map(r => (
                    <div key={r.baris} className="px-3 py-2 flex gap-3">
                      <span className="font-bold text-gray-500 w-16 flex-shrink-0">Baris {r.baris}</span>
                      <span className={r.status === 'error' ? 'text-red-700' : 'text-amber-700'}>{r.pesan}</span>
                    </div>
                  ))}
                  {bermasalah.length > 200 && <div className="px-3 py-2 text-gray-500">…dan {bermasalah.length - 200} baris lainnya.</div>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm">Batal</button>
              <button type="button" onClick={doImport} disabled={busy || preview.berhasil === 0}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-xl text-white font-bold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {preview.berhasil === 0 ? 'Tidak ada data valid' : `Impor ${preview.berhasil} anggota${bermasalah.length > 0 ? ' yang valid' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
