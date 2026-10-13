import React, { useMemo, useState } from 'react';
import { Building, ChevronRight } from 'lucide-react';
import type { Anggota } from '../types';
import TingkatanStats from './TingkatanStats';
import { countJk, countPelatih, GOLONGAN_ORDER, GOLONGAN_LABEL, pelatihList } from '../utils/tingkatan';

const lp = (list: Anggota[]) => {
  const c = countJk(list);
  return ` (L ${c.l} • P ${c.p})`;
};

const CHIP_STYLE: Record<string, string> = {
  calon_siaga: 'bg-pink-50 text-pink-700 border-pink-100',
  siaga: 'bg-green-50 text-green-700 border-green-100',
  penggalang: 'bg-red-50 text-red-700 border-red-100',
  penegak: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  pandega: 'bg-amber-50 text-amber-700 border-amber-100',
  dewasa: 'bg-purple-50 text-purple-700 border-purple-100'
};

/** Chip ringkas: Total, per golongan, dan Pelatih, masing-masing dengan jumlah L/P. */
export function GolonganChips({ anggota }: { anggota: Anggota[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md text-[10px] font-black border border-gray-200">
        Total: {anggota.length}{lp(anggota)}
      </span>
      {GOLONGAN_ORDER.map(g => {
        const list = anggota.filter(a => a.golongan === g);
        return (
          <span key={g} className={`${CHIP_STYLE[g]} px-2 py-0.5 rounded-md text-[10px] font-semibold border`}>
            {GOLONGAN_LABEL[g]}: {list.length}{lp(list)}
          </span>
        );
      })}
      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-teal-100">
        Pelatih: {countPelatih(anggota)}{lp(pelatihList(anggota))}
      </span>
    </div>
  );
}

interface RekapGudepListProps {
  gudeps: any[];
  anggota: Anggota[];
}

/**
 * Rekap untuk akun Kwarran: hanya Gugus Depan di bawah Kwarran tersebut. Tiap Gudep bisa dibuka
 * untuk melihat statistik tingkatan, jumlah L/P, Pelatih, dan Peran anggotanya.
 */
export default function RekapGudepList({ gudeps, anggota }: RekapGudepListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const known = new Set(gudeps.map(g => g.id));
    const list = gudeps.map(g => ({
      id: g.id as string,
      nama: g.nama_pangkalan as string,
      nomor: [g.no_gudep_putra, g.no_gudep_putri].filter(Boolean).join(' / '),
      anggota: anggota.filter(a => a.gudep_id === g.id)
    }));
    // Anggota yang belum dimasukkan ke Gugus Depan mana pun
    const tanpa = anggota.filter(a => !a.gudep_id || !known.has(a.gudep_id));
    if (tanpa.length > 0) list.push({ id: '__tanpa__', nama: 'Belum masuk Gugus Depan', nomor: '', anggota: tanpa });
    return list;
  }, [gudeps, anggota]);

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 font-medium italic text-sm">
        Belum ada Gugus Depan di Kwartir Ranting ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
        Gugus Depan di Kwartir Ranting Anda ({gudeps.length})
      </h3>
      {rows.map(r => {
        const open = openId === r.id;
        return (
          <div key={r.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : r.id)}
              className={`w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-green-50 transition-colors ${open ? 'bg-green-50/50' : ''}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-sm md:text-base">{r.nama}</div>
                  {r.nomor && <div className="text-[10px] font-mono text-gray-500 mb-1.5">Gudep: {r.nomor}</div>}
                  <GolonganChips anggota={r.anggota} />
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 shrink-0 mt-1 transition-transform duration-300 ${open ? 'rotate-90 text-green-600' : ''}`} />
            </button>
            {open && (
              <div className="border-t border-gray-100 bg-gray-50/70 p-4 md:p-5">
                <TingkatanStats anggota={r.anggota} compact />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
