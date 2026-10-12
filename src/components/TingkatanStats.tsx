import React, { useMemo } from 'react';
import type { Anggota } from '../types';
import {
  buildTingkatanStats,
  GOLONGAN_LABEL,
  pelatihList,
  countKpdKpl,
  countPeran,
  countJk
} from '../utils/tingkatan';

interface TingkatanStatsProps {
  anggota: Anggota[];
  /** Tampilan lebih rapat (dipakai di dalam rincian per kecamatan). */
  compact?: boolean;
}

const BAR_COLOR: Record<string, string> = {
  calon_siaga: 'bg-pink-400',
  siaga: 'bg-green-500',
  penggalang: 'bg-red-500',
  penegak: 'bg-yellow-500',
  pandega: 'bg-amber-600',
  dewasa: 'bg-purple-500'
};

/** "L 3 • P 2" kecil, dipakai di semua kartu statistik. */
function Lp({ l, p, className = '' }: { l: number; p: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      <span className="text-blue-700 font-semibold">L {l}</span>
      <span className="text-gray-300"> • </span>
      <span className="text-pink-700 font-semibold">P {p}</span>
    </span>
  );
}

/** Statistik jumlah anggota per tingkatan, dikelompokkan per golongan, lengkap dengan jumlah L/P dan total. */
export default function TingkatanStats({ anggota, compact = false }: TingkatanStatsProps) {
  const stats = useMemo(() => buildTingkatanStats(anggota), [anggota]);
  const jkAll = useMemo(() => countJk(anggota), [anggota]);
  const pelatihJk = useMemo(() => countJk(pelatihList(anggota)), [anggota]);
  const kpdKpl = useMemo(() => countKpdKpl(anggota), [anggota]);
  const peran = useMemo(() => countPeran(anggota), [anggota]);

  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
      {/* Ringkasan keseluruhan */}
      <div className="sm:col-span-2 xl:col-span-3 lg:col-span-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="font-black uppercase tracking-wider text-gray-800">Jumlah</span>
        <span className="text-blue-700 font-semibold">Laki-laki: <b className="tabular-nums">{jkAll.l}</b></span>
        <span className="text-pink-700 font-semibold">Perempuan: <b className="tabular-nums">{jkAll.p}</b></span>
        <span className="text-gray-900 font-semibold">Total: <b className="tabular-nums">{jkAll.total}</b></span>
        {jkAll.u > 0 && (
          <span className="text-amber-700 text-[11px]">
            ({jkAll.u} anggota belum diisi jenis kelaminnya)
          </span>
        )}
      </div>

      {stats.map(g => (
        <div key={g.golongan} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-800">{GOLONGAN_LABEL[g.golongan]}</h5>
            <span className="text-[10px] font-black bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md">
              {g.total} anggota
            </span>
          </div>
          <div className="text-[11px] mb-2.5"><Lp l={g.l} p={g.p} /></div>
          <div className="space-y-1.5">
            {g.rows.map(r => {
              const pct = g.total > 0 ? Math.round((r.count / g.total) * 100) : 0;
              return (
                <div key={r.name}>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-700">
                    <span className="truncate">{r.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Lp l={r.l} p={r.p} className="text-[10px]" />
                      <b className="tabular-nums text-gray-900 w-5 text-right">{r.count}</b>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLOR[g.golongan]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {g.lainnya > 0 && (
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-dashed border-gray-200">
                <span>Tingkatan lain / belum sesuai daftar</span>
                <span className="font-bold tabular-nums">{g.lainnya}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pelatih: anggota Dewasa KPD/KPL yang statusnya dibenarkan sebagai Pelatih */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-teal-900">Pelatih</h5>
          <span className="text-[10px] font-black bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
            {pelatihJk.total} orang
          </span>
        </div>
        <div className="text-[11px] mb-2"><Lp l={pelatihJk.l} p={pelatihJk.p} /></div>
        <p className="text-[11px] text-teal-900/80 leading-relaxed">
          Dihitung dari anggota Dewasa dengan tingkatan KPD atau KPL yang dinyatakan sebagai Pelatih
          ({pelatihJk.total} dari {kpdKpl} anggota KPD/KPL).
        </p>
      </div>

      {/* Peran anggota Dewasa (satu orang boleh lebih dari satu peran) */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h5 className="text-xs font-black uppercase tracking-wider text-purple-900">Peran Dewasa</h5>
          <span className="text-[10px] font-black bg-white border border-purple-200 text-purple-800 px-2 py-0.5 rounded-md">
            {peran.denganPeran} dari {peran.dewasa} dewasa
          </span>
        </div>
        <div className="space-y-1.5">
          {peran.rows.map(r => {
            const pct = peran.dewasa > 0 ? Math.round((r.count / peran.dewasa) * 100) : 0;
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-700">
                  <span className="truncate">{r.label}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Lp l={r.l} p={r.p} className="text-[10px]" />
                    <b className="tabular-nums text-gray-900 w-5 text-right">{r.count}</b>
                  </span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-purple-900/70 mt-2 leading-relaxed">
          Satu orang boleh memiliki lebih dari satu peran, sehingga jumlah per peran bisa lebih besar dari jumlah orang.
        </p>
      </div>
    </div>
  );
}
