import type React from 'react';

/** Foto siluet bawaan untuk semua foto orang (pimpinan, anggota, ketua, dll.) yang belum diisi. */
export const DEFAULT_AVATAR = '/img/avatar-default.jpg';

// Host foto stok / placeholder yang dulu dipasang otomatis oleh data contoh & server sebagai "foto orang".
// Foto asli yang diunggah admin tersimpan di Cloudinary, jadi semua URL dari host ini dianggap belum diisi.
const STOCK_PHOTO_HOSTS = [
  'images.unsplash.com',
  'i.pravatar.cc',
  'randomuser.me',
  'Portrait_Placeholder'
];

export const fotoOrDefault = (url?: string | null): string => {
  const u = (url || '').trim();
  if (!u || STOCK_PHOTO_HOSTS.some(k => u.includes(k))) return DEFAULT_AVATAR;
  return u;
};

/** Pasang di <img onError={onFotoError}> supaya link foto yang rusak juga jatuh ke siluet. */
export const onFotoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.endsWith(DEFAULT_AVATAR)) {
    img.onerror = null;
    img.src = DEFAULT_AVATAR;
  }
};
