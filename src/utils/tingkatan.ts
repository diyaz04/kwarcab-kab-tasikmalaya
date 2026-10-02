import type { Anggota, GolonganPramuka } from '../types';

/** Daftar tingkatan per golongan (urut dari terendah). Dipakai di form anggota dan statistik Rekap. */
export const TINGKATAN_MAP: Record<GolonganPramuka, string[]> = {
  siaga: ['Mula', 'Bantu', 'Tata', 'Garuda Siaga'],
  penggalang: ['Ramu', 'Rakit', 'Terap', 'Garuda Penggalang'],
  penegak: ['Bantara', 'Laksana', 'Garuda Penegak'],
  pandega: ['Pandega'],
  dewasa: [
    'Pembina Mahir Dasar (KMD)',
    'Pembina Mahir Lanjutan (KML)',
    'Pelatih Dasar (KPD)',
    'Pelatih Lanjutan (KPL)'
  ]
};

export const GOLONGAN_ORDER: GolonganPramuka[] = ['siaga', 'penggalang', 'penegak', 'pandega', 'dewasa'];

export const GOLONGAN_LABEL: Record<GolonganPramuka, string> = {
  siaga: 'Siaga',
  penggalang: 'Penggalang',
  penegak: 'Penegak',
  pandega: 'Pandega',
  dewasa: 'Dewasa'
};

/**
 * Cocokkan teks tingkatan yang tersimpan (bisa dari data lama atau aplikasi native yang memakai
 * teks bebas, mis. "garuda", "KMD", "Pelatih Dasar") ke salah satu nama resmi di TINGKATAN_MAP.
 * Mengembalikan null kalau tidak dikenali.
 */
export const normalizeTingkatan = (golongan: GolonganPramuka, raw?: string | null): string | null => {
  const options = TINGKATAN_MAP[golongan];
  if (!options) return null;
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;

  const exact = options.find(o => o.toLowerCase() === v);
  if (exact) return exact;

  if (golongan === 'dewasa') {
    if (/\bkmd\b|mahir dasar/.test(v)) return options[0];
    if (/\bkml\b|mahir lanjut/.test(v)) return options[1];
    if (/\bkpd\b/.test(v) || (/pelatih/.test(v) && /dasar/.test(v))) return options[2];
    if (/\bkpl\b/.test(v) || (/pelatih/.test(v) && /lanjut/.test(v))) return options[3];
    return null;
  }

  if (/^garuda/.test(v)) return options.find(o => o.startsWith('Garuda')) || null;
  return options.find(o => o.toLowerCase() === v.replace(/^tingkat\s+/, '')) || null;
};

export interface TingkatanRow { name: string; count: number }
export interface GolonganStat { golongan: GolonganPramuka; total: number; rows: TingkatanRow[]; lainnya: number }

/** Hitung jumlah anggota per golongan dan per tingkatan. */
export const buildTingkatanStats = (anggota: Anggota[]): GolonganStat[] =>
  GOLONGAN_ORDER.map(golongan => {
    const members = anggota.filter(a => a.golongan === golongan);
    const rows: TingkatanRow[] = TINGKATAN_MAP[golongan].map(name => ({ name, count: 0 }));
    let lainnya = 0;
    members.forEach(a => {
      const matched = normalizeTingkatan(golongan, a.tingkatan);
      const row = matched ? rows.find(r => r.name === matched) : undefined;
      if (row) row.count += 1; else lainnya += 1;
    });
    return { golongan, total: members.length, rows, lainnya };
  });
