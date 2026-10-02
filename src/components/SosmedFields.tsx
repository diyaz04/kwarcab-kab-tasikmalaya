import React from 'react';
import type { SosmedLinks } from '../types';
import { SOSMED_PLATFORMS } from '../utils/sosmed';

interface SosmedFieldsProps {
  value: SosmedLinks;
  onChange: (next: SosmedLinks) => void;
}

/** Kumpulan input link media sosial untuk form admin (Kwarcab & Kwarran). */
export default function SosmedFields({ value, onChange }: SosmedFieldsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {SOSMED_PLATFORMS.map(p => (
        <div key={p.id} className="space-y-1.5">
          <label className="text-xs text-gray-600">{p.label}</label>
          <input
            type="text"
            value={value[p.id] || ''}
            onChange={(e) => onChange({ ...value, [p.id]: e.target.value })}
            placeholder={p.placeholder}
            className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 placeholder:text-gray-400"
          />
          <p className="text-[10px] text-gray-500">{p.hint}</p>
        </div>
      ))}
    </div>
  );
}
