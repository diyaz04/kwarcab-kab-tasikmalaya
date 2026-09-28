import type { SosmedLinks, SosmedPlatform } from '../types';

export const SOSMED_PLATFORMS: Array<{
  id: SosmedPlatform;
  label: string;
  placeholder: string;
  hint: string;
}> = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/kwarcab_tasik atau @kwarcab_tasik', hint: 'Boleh tempel link atau @username' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/nama.halaman', hint: 'Link halaman / profil' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@namachannel', hint: 'Link channel' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@namaakun atau @namaakun', hint: 'Boleh tempel link atau @username' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/namaakun atau @namaakun', hint: 'Boleh tempel link atau @username' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '08123456789 atau https://wa.me/628123456789', hint: 'Nomor WA (otomatis jadi link wa.me) atau link grup/channel' },
  { id: 'website', label: 'Website', placeholder: 'https://contoh.or.id', hint: 'Website resmi' },
];

const MAX_LEN = 300;

const USERNAME_BASE: Partial<Record<SosmedPlatform, string>> = {
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  x: 'https://x.com/',
};

/**
 * Ubah input admin jadi URL aman (hanya http/https) atau '' bila tidak valid.
 * - "@user" / "user" -> URL profil (instagram, tiktok, x)
 * - "0812..." / "+62812..." -> https://wa.me/62812...
 * - "instagram.com/abc" -> https://instagram.com/abc
 * - skema selain http/https (mis. javascript:) ditolak.
 */
export function normalizeSosmedUrl(platform: SosmedPlatform, raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value || value.length > MAX_LEN) return '';

  // WhatsApp: nomor telepon saja
  if (platform === 'whatsapp' && /^[+\d][\d\s\-().]{5,}$/.test(value)) {
    let digits = value.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
    return digits.length >= 8 ? `https://wa.me/${digits}` : '';
  }

  // Username saja (tanpa titik / slash / skema)
  const base = USERNAME_BASE[platform];
  if (base && /^@?[A-Za-z0-9_.]+$/.test(value) && !value.includes('://') && !/\.(com|id|co|net|org)$/i.test(value)) {
    return `${base}${value.replace(/^@/, '')}`;
  }

  // Tolak skema berbahaya / non-web
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return '';

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    if (!url.hostname.includes('.')) return '';
    return url.toString();
  } catch {
    return '';
  }
}

/** Bersihkan seluruh objek sosmed (dipakai di server sebelum disimpan & di klien sebelum dirender). */
export function sanitizeSosmed(input: unknown): SosmedLinks {
  const out: SosmedLinks = {};
  if (!input || typeof input !== 'object') return out;
  for (const { id } of SOSMED_PLATFORMS) {
    const url = normalizeSosmedUrl(id, (input as Record<string, unknown>)[id]);
    if (url) out[id] = url;
  }
  return out;
}
