import type { Anggota, GolonganPramuka } from '../types';

export const TINGKATAN_NONE = '-';
export const DEWASA_BELUM_KURSUS = 'Belum Kursus';
export const DEWASA_KMD = 'Pembina Mahir Dasar (KMD)';
export const DEWASA_KML = 'Pembina Mahir Lanjutan (KML)';
export const DEWASA_KPD = 'Pelatih Dasar (KPD)';
export const DEWASA_KPL = 'Pelatih Lanjutan (KPL)';

/** Daftar tingkatan per golongan (urut dari terendah). Dipakai di form anggota dan statistik Rekap. */
export const TINGKATAN_MAP: Record<GolonganPramuka, string[]> = {
  calon_siaga: [TINGKATAN_NONE], // otomatis "-", tidak bisa dipilih
  siaga: ['Mula', 'Bantu', 'Tata', 'Garuda Siaga'],
  penggalang: ['Calon Penggalang', 'Ramu', 'Rakit', 'Terap', 'Garuda Penggalang'],
  penegak: ['Calon Penegak', 'Bantara', 'Laksana', 'Garuda Penegak'],
  pandega: ['Calon Pandega', 'Pandega'],
  dewasa: [DEWASA_BELUM_KURSUS, DEWASA_KMD, DEWASA_KML, DEWASA_KPD, DEWASA_KPL]
};

export const GOLONGAN_ORDER: GolonganPramuka[] = ['calon_siaga', 'siaga', 'penggalang', 'penegak', 'pandega', 'dewasa'];

export const GOLONGAN_LABEL: Record<GolonganPramuka, string> = {
  calon_siaga: 'Calon Siaga',
  siaga: 'Siaga',
  penggalang: 'Penggalang',
  penegak: 'Penegak',
  pandega: 'Pandega',
  dewasa: 'Dewasa'
};

/** Nama golongan yang enak dibaca ("calon_siaga" -> "Calon Siaga"). */
export const golonganLabel = (golongan?: string | null): string => {
  if (!golongan) return '';
  return GOLONGAN_LABEL[golongan as GolonganPramuka]
    || golongan.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/** Peran anggota Dewasa (boleh lebih dari satu). */
export const PERAN_DEWASA = [
  { id: 'pembina_siaga', label: 'Pembina Siaga' },
  { id: 'pembina_penggalang', label: 'Pembina Penggalang' },
  { id: 'pembina_penegak', label: 'Pembina Penegak' },
  { id: 'pembina_pandega', label: 'Pembina Pandega' },
  { id: 'pamong_saka', label: 'Pamong Saka' },
  { id: 'instruktur_saka', label: 'Instruktur Saka' }
] as const;

export const PERAN_IDS: string[] = PERAN_DEWASA.map(p => p.id);

export const peranLabel = (id: string): string => PERAN_DEWASA.find(p => p.id === id)?.label || id;

/** Ambil hanya peran yang dikenal, tanpa duplikat, sesuai urutan daftar. */
export const sanitizePeran = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const set = new Set(value.filter((v): v is string => typeof v === 'string'));
  return PERAN_IDS.filter(id => set.has(id));
};

/**
 * Cocokkan teks tingkatan yang tersimpan (bisa dari data lama atau aplikasi native yang memakai
 * teks bebas, mis. "garuda", "KMD", "Pelatih Dasar") ke salah satu nama resmi di TINGKATAN_MAP.
 * Mengembalikan null kalau tidak dikenali. Calon Siaga selalu "-".
 */
export const normalizeTingkatan = (golongan: GolonganPramuka, raw?: string | null): string | null => {
  const options = TINGKATAN_MAP[golongan];
  if (!options) return null;
  if (golongan === 'calon_siaga') return TINGKATAN_NONE;
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;

  const exact = options.find(o => o.toLowerCase() === v);
  if (exact) return exact;

  if (golongan === 'dewasa') {
    if (/belum\s*(ada\s*)?kursus/.test(v)) return DEWASA_BELUM_KURSUS;
    if (/\bkmd\b|mahir dasar/.test(v)) return DEWASA_KMD;
    if (/\bkml\b|mahir lanjut/.test(v)) return DEWASA_KML;
    if (/\bkpd\b/.test(v) || (/pelatih/.test(v) && /dasar/.test(v))) return DEWASA_KPD;
    if (/\bkpl\b/.test(v) || (/pelatih/.test(v) && /lanjut/.test(v))) return DEWASA_KPL;
    return null;
  }

  if (/^garuda/.test(v)) return options.find(o => o.startsWith('Garuda')) || null;
  if (/^calon/.test(v)) return options.find(o => o.startsWith('Calon')) || null;
  return options.find(o => o.toLowerCase() === v.replace(/^tingkat\s+/, '')) || null;
};

export interface TingkatanRow { name: string; count: number }
export interface GolonganStat { golongan: GolonganPramuka; total: number; rows: TingkatanRow[]; lainnya: number }

/** Hitung jumlah anggota per golongan dan per tingkatan. Calon Siaga tidak punya tingkatan (hanya total). */
export const buildTingkatanStats = (anggota: Anggota[]): GolonganStat[] =>
  GOLONGAN_ORDER.map(golongan => {
    const members = anggota.filter(a => a.golongan === golongan);
    if (golongan === 'calon_siaga') return { golongan, total: members.length, rows: [], lainnya: 0 };
    const rows: TingkatanRow[] = TINGKATAN_MAP[golongan].map(name => ({ name, count: 0 }));
    let lainnya = 0;
    members.forEach(a => {
      const matched = normalizeTingkatan(golongan, a.tingkatan);
      const row = matched ? rows.find(r => r.name === matched) : undefined;
      if (row) row.count += 1; else lainnya += 1;
    });
    return { golongan, total: members.length, rows, lainnya };
  });

/** Pertanyaan "apakah termasuk Pelatih?" hanya relevan untuk Dewasa dengan tingkatan KPD atau KPL. */
export const isPelatihEligible = (golongan: string, tingkatan?: string | null): boolean => {
  if (golongan !== 'dewasa') return false;
  const t = normalizeTingkatan('dewasa', tingkatan);
  return t === DEWASA_KPD || t === DEWASA_KPL;
};

/** Jumlah Pelatih = anggota Dewasa KPD/KPL yang statusnya dibenarkan sebagai Pelatih. */
export const countPelatih = (anggota: Anggota[]): number =>
  anggota.filter(a => a.is_pelatih === true && isPelatihEligible(a.golongan, a.tingkatan)).length;

/** Jumlah anggota Dewasa KPD/KPL (calon Pelatih) sebagai pembanding. */
export const countKpdKpl = (anggota: Anggota[]): number =>
  anggota.filter(a => isPelatihEligible(a.golongan, a.tingkatan)).length;

export interface PeranRow { id: string; label: string; count: number }

/** Jumlah anggota Dewasa per peran (satu orang boleh punya beberapa peran, jadi total bisa lebih besar dari jumlah orang). */
export const countPeran = (anggota: Anggota[]): { rows: PeranRow[]; dewasa: number; denganPeran: number } => {
  const dewasaList = anggota.filter(a => a.golongan === 'dewasa');
  const rows: PeranRow[] = PERAN_DEWASA.map(p => ({ id: p.id, label: p.label, count: 0 }));
  let denganPeran = 0;
  dewasaList.forEach(a => {
    const peran = sanitizePeran(a.peran);
    if (peran.length > 0) denganPeran += 1;
    peran.forEach(id => {
      const row = rows.find(r => r.id === id);
      if (row) row.count += 1;
    });
  });
  return { rows, dewasa: dewasaList.length, denganPeran };
};
