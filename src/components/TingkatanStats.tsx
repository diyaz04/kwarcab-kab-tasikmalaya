import React, { useMemo } from 'react';
import type { Anggota } from '../types';
import { buildTingkatanStats, GOLONGAN_LABEL } from '../utils/tingkatan';

interface TingkatanStatsProps {
  anggota: Anggota[];
  /** Tampilan lebih rapat (dipakai di dalam rincian per kecamatan). */
  compact?: boolean;
}

const BAR_COLOR: Record<string, string> = {
  siaga: 'bg-green-500',
  penggalang: 'bg-red-500',
  penegak: 'bg-yellow-500',
  pandega: 'bg-amber-600',
  dewasa: 'bg-purple-500'
};

/** Statistik jumlah anggota per tingkatan, dikelompokkan per golongan. */
export default function TingkatanStats({ anggota, compact = false }: TingkatanStatsProps) {
  const stats = useMemo(() => buildTingkatanStats(anggota), [anggota]);

  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
      {stats.map(g => (
        <div key={g.golongan} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-800">{GOLONGAN_LABEL[g.golongan]}</h5>
            <span className="text-[10px] font-black bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md">
              {g.total} anggota
            </span>
          </div>
          <div className="space-y-1.5">
            {g.rows.map(r => {
              const pct = g.total > 0 ? Math.round((r.count / g.total) * 100) : 0;
              return (
                <div key={r.name}>
                  <div className="flex items-center justify-between text-[11px] text-gray-700">
                    <span className="truncate pr-2">{r.name}</span>
                    <span className="font-bold tabular-nums">{r.count}{g.total > 0 && <span className="text-gray-400 font-normal"> ({pct}%)</span>}</span>
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
    </div>
  );
}
