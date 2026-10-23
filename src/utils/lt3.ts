import type { Lt3Data, Lt3Jenis, Lt3Regu, Lt3Kelompok, Lt3Poin } from '../types';

export const KELOMPOK_LIST: Lt3Kelompok[] = ['utama', 'penunjang', 'tambahan'];
export const KELOMPOK_LABEL: Record<Lt3Kelompok, string> = { utama: 'Lomba Utama', penunjang: 'Lomba Penunjang', tambahan: 'Lomba Tambahan' };
/** Nilai awal poin; admin menyesuaikan sesuai juknis. */
export const defaultPoin = (): Lt3Poin => ({
  utama: { emas: 10, perak: 6, perunggu: 3 },
  penunjang: { emas: 6, perak: 4, perunggu: 2 },
  tambahan: { emas: 3, perak: 2, perunggu: 1 }
});

export const emptyLt3 = (): Lt3Data => ({
  aktif: false,
  judul: 'Lomba Tingkat III',
  poin: defaultPoin(),
  pengumuman: '',
  pengumuman_tanggal: '',
  banner: { url: '', judul: '', tampil: false, mulai: '', selesai: '' },
  juknis: { url: '', nama: '' },
  lomba: [],
  regu: [],
  nilai: {}
});

const normalizePoin = (raw: Partial<Lt3Poin> | undefined): Lt3Poin => {
  const base = defaultPoin();
  KELOMPOK_LIST.forEach(k => {
    (['emas', 'perak', 'perunggu'] as const).forEach(m => {
      const v = Number(raw?.[k]?.[m]);
      if (raw?.[k]?.[m] !== undefined && raw?.[k]?.[m] !== null && Number.isFinite(v) && v >= 0) base[k][m] = v;
    });
  });
  return base;
};

/** Gabungkan data tersimpan dengan bentuk standar (aman untuk data lama/kosong). */
export const normalizeLt3 = (raw: Partial<Lt3Data> | null | undefined): Lt3Data => {
  const base = emptyLt3();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    banner: { ...base.banner, ...(raw.banner || {}) },
    juknis: { ...base.juknis, ...(raw.juknis || {}) },
    poin: normalizePoin(raw.poin),
    lomba: Array.isArray(raw.lomba) ? raw.lomba.map(l => ({ ...l, kelompok: KELOMPOK_LIST.includes(l?.kelompok as Lt3Kelompok) ? l.kelompok : 'utama' })) : [],
    regu: Array.isArray(raw.regu) ? raw.regu : [],
    nilai: raw.nilai && typeof raw.nilai === 'object' ? raw.nilai : {}
  };
};

export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type BannerStatus = 'aktif' | 'belum' | 'berakhir' | 'nonaktif';

/** Status popup banner pada hari ini (mulai/selesai kosong = tanpa batas). */
export const bannerStatus = (lt3: Lt3Data, today = todayIso()): BannerStatus => {
  const b = lt3.banner;
  if (!lt3.aktif || !b.tampil || !b.url) return 'nonaktif';
  if (b.mulai && today < b.mulai) return 'belum';
  if (b.selesai && today > b.selesai) return 'berakhir';
  return 'aktif';
};

export type Medali = 'emas' | 'perak' | 'perunggu';
export const MEDALI_EMOJI: Record<Medali, string> = { emas: '🥇', perak: '🥈', perunggu: '🥉' };
export const MEDALI_LABEL: Record<Medali, string> = { emas: 'Emas', perak: 'Perak', perunggu: 'Perunggu' };
export const medaliDariPeringkat = (p: number): Medali | null => (p === 1 ? 'emas' : p === 2 ? 'perak' : p === 3 ? 'perunggu' : null);

export const TANPA_KWARRAN = 'Tanpa Kwarran';

export interface HasilLomba { nilai: number; peringkat: number; medali: Medali | null; poin: number }
export interface ReguHasil {
  regu: Lt3Regu;
  /** hasil per mata lomba (undefined = belum dinilai) */
  perLomba: Record<string, HasilLomba | undefined>;
  total: number;
  /** poin medali yang dikumpulkan regu ini */
  poin: number;
}
export interface KwarranKlasemen {
  kwarran: string;
  peringkat: number; // 0 = belum ada nilai (hanya pada tampilan per lomba)
  emas: number;
  perak: number;
  perunggu: number;
  /** total poin medali (emas/perak/perunggu x poin kelompok lomba) */
  poin: number;
  totalNilai: number;
  /** tampilan per lomba: nilai terbaik regu Kwarran ini di lomba tsb. */
  skor: number | null;
  medali: Medali | null;
  regu: ReguHasil[];
}

/** Peringkat tiap regu pada tiap mata lomba (nilai sama = peringkat sama: 1, 1, 3, ...). Medali untuk peringkat 1-3. */
const hitungHasilRegu = (lt3: Lt3Data, jenis: Lt3Jenis): ReguHasil[] => {
  const reguJenis = lt3.regu.filter(r => r.jenis === jenis);
  const hasil: ReguHasil[] = reguJenis.map(regu => ({ regu, perLomba: {}, total: 0, poin: 0 }));
  lt3.lomba.forEach(l => {
    const dinilai = hasil
      .map(h => ({ h, v: lt3.nilai?.[l.id]?.[h.regu.id] }))
      .filter((x): x is { h: ReguHasil; v: number } => typeof x.v === 'number')
      .sort((a, b) => b.v - a.v);
    let prev: number | undefined;
    let rank = 0;
    dinilai.forEach((x, idx) => {
      if (x.v !== prev) { rank = idx + 1; prev = x.v; }
      const medali = medaliDariPeringkat(rank);
      const poin = medali ? (lt3.poin?.[l.kelompok]?.[medali] ?? 0) : 0;
      x.h.perLomba[l.id] = { nilai: x.v, peringkat: rank, medali, poin };
      x.h.total += x.v;
      x.h.poin += poin;
    });
  });
  hasil.forEach(h => { h.total = Math.round(h.total * 100) / 100; });
  return hasil;
};

export interface JuaraLomba { peringkat: number; medali: Medali; regu: Lt3Regu; nilai: number; poin: number }

/** Juara 1-3 (emas, perak, perunggu) satu mata lomba untuk satu jenis regu. Nilai sama = peringkat sama (semua ikut tampil). */
export const juaraLomba = (lt3: Lt3Data, jenis: Lt3Jenis, lombaId: string): JuaraLomba[] => {
  const out: JuaraLomba[] = [];
  hitungHasilRegu(lt3, jenis).forEach(h => {
    const r = h.perLomba[lombaId];
    if (r && r.medali) out.push({ peringkat: r.peringkat, medali: r.medali, regu: h.regu, nilai: r.nilai, poin: r.poin });
  });
  return out.sort((a, b) => a.peringkat - b.peringkat || a.regu.nama.localeCompare(b.regu.nama));
};

/**
 * Klasemen per Kwarran untuk satu jenis regu.
 * lombaId null = klasemen medali: urut poin medali (poin per kelompok lomba), lalu jumlah emas, perak, perunggu, dan total nilai; selain itu = peringkat Kwarran pada satu mata lomba.
 */
export const buildKlasemenKwarran = (lt3: Lt3Data, jenis: Lt3Jenis, lombaId: string | null): KwarranKlasemen[] => {
  const groups = new Map<string, ReguHasil[]>();
  hitungHasilRegu(lt3, jenis).forEach(h => {
    const k = (h.regu.kwarran || '').trim() || TANPA_KWARRAN;
    groups.set(k, [...(groups.get(k) || []), h]);
  });

  const rows: KwarranKlasemen[] = [...groups.entries()].map(([kwarran, regu]) => {
    let emas = 0, perak = 0, perunggu = 0, totalNilai = 0, poin = 0;
    regu.forEach(h => {
      totalNilai += h.total;
      poin += h.poin;
      Object.values(h.perLomba).forEach(r => {
        if (r?.medali === 'emas') emas += 1; else if (r?.medali === 'perak') perak += 1; else if (r?.medali === 'perunggu') perunggu += 1;
      });
    });
    let skor: number | null = null;
    let medali: Medali | null = null;
    if (lombaId) {
      regu.forEach(h => {
        const r = h.perLomba[lombaId];
        if (r && (skor === null || r.nilai > skor)) { skor = r.nilai; medali = r.medali; }
      });
    }
    return { kwarran, peringkat: 0, emas, perak, perunggu, poin, totalNilai: Math.round(totalNilai * 100) / 100, skor, medali, regu };
  });

  const kunci = (r: KwarranKlasemen): number[] => (lombaId ? [r.skor ?? -1] : [r.poin, r.emas, r.perak, r.perunggu, r.totalNilai]);
  rows.sort((a, b) => {
    const ka = kunci(a), kb = kunci(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return a.kwarran.localeCompare(b.kwarran);
  });

  let prev: string | undefined;
  let rank = 0;
  return rows.map((r, i) => {
    const k = kunci(r).join('|');
    if (k !== prev) { rank = i + 1; prev = k; }
    const belumAdaNilai = lombaId ? r.skor === null : r.totalNilai === 0 && r.poin === 0 && r.emas + r.perak + r.perunggu === 0;
    return { ...r, peringkat: belumAdaNilai ? 0 : rank };
  });
};

export const fmtNilai = (n: number | undefined | null): string =>
  n === undefined || n === null ? '-' : Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
