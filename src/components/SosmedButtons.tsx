import React from 'react';
import { Instagram, Facebook, Youtube, Twitter, Music2, MessageCircle, Globe } from 'lucide-react';
import type { SosmedLinks, SosmedPlatform } from '../types';
import { SOSMED_PLATFORMS, sanitizeSosmed } from '../utils/sosmed';

const ICONS: Record<SosmedPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  x: Twitter,
  whatsapp: MessageCircle,
  website: Globe,
};

interface SosmedButtonsProps {
  links?: SosmedLinks | null;
  /** 'footer' = tombol bulat kecil, 'header' = tombol dengan label */
  variant?: 'footer' | 'header';
  className?: string;
}

/** Menampilkan tombol media sosial. Platform tanpa link tidak dirender; jika kosong semua, tidak render apa pun. */
export default function SosmedButtons({ links, variant = 'footer', className = '' }: SosmedButtonsProps) {
  // Sanitasi ulang di sisi klien supaya link aneh (mis. javascript:) tidak pernah jadi href.
  const clean = sanitizeSosmed(links);
  const items = SOSMED_PLATFORMS.filter(p => clean[p.id]);
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map(({ id, label }) => {
        const Icon = ICONS[id];
        return variant === 'footer' ? (
          <a
            key={id}
            href={clean[id]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-green-700 hover:text-green-800 hover:border-green-600 hover:bg-green-50 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Icon className="w-4 h-4" />
          </a>
        ) : (
          <a
            key={id}
            href={clean[id]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-[11px] font-bold text-gray-700 hover:text-green-800 hover:border-green-600 hover:bg-green-50 transition-all duration-200"
          >
            <Icon className="w-3.5 h-3.5 text-green-700" />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}
