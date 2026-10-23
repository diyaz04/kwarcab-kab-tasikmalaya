export type SosmedPlatform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'x' | 'whatsapp' | 'website';

// Link media sosial. Semua opsional; yang kosong tidak ditampilkan di landingpage.
export type SosmedLinks = Partial<Record<SosmedPlatform, string>>;

export type UserRole = 'kwarcab' | 'staff_kwarcab' | 'kwarran' | 'gudep' | 'saka';

export type AdminPermission =
  | 'anggota'
  | 'kta'
  | 'kwarran'
  | 'gudep'
  | 'saka'
  | 'kampung_pramuka'
  | 'berita'
  | 'agenda'
  | 'config';

export interface User {
  id: string;
  nama: string;
  email: string;
  password_hash: string;
  role: UserRole;
  ref_id: string | null; // ID of Kwarran, Gudep, or Saka
  permissions?: AdminPermission[]; // Scoped access for staff_kwarcab
  /** Foto profil akun; kosong = siluet bawaan. */
  foto?: string;
  /** 'pending' = pendaftaran mandiri yang belum disetujui (belum bisa login); kosong/'aktif' = normal. */
  status?: 'pending' | 'aktif';
  created_at: string;
}

export interface KwartirRanting {
  id: string;
  nama_kecamatan: string;
  ketua: string;
  sekretaris: string;
  bendahara: string;
  foto_ketua: string;
  foto_sekretaris: string;
  foto_bendahara: string;
  status: 'aktif' | 'non-aktif' | 'transisi';
  /** Periode kepengurusan, teks bebas, mis. "2023 - 2028". */
  masa_khidmat?: string;
  sosmed?: SosmedLinks;
  created_at: string;
}

export interface GugusDepan {
  id: string;
  nama_pangkalan: string;
  kwartir_ranting_id: string;
  created_at: string;
}

export interface SatuanKarya {
  id: string;
  nama_saka: string;
  ketua: string;
  sekretaris: string;
  bendahara: string;
  foto_ketua: string;
  foto_sekretaris: string;
  foto_bendahara: string;
  status: 'aktif' | 'non-aktif' | 'transisi';
  created_at: string;
}

export type GolonganPramuka = 'calon_siaga' | 'siaga' | 'penggalang' | 'penegak' | 'pandega' | 'dewasa';

export interface Anggota {
  id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  golongan: GolonganPramuka;
  tingkatan: string;
  alamat_asal: string;
  pangkalan: string;
  kwartir_ranting_id: string;
  gudep_id: string | null;
  foto?: string;
  is_kta_printed?: boolean;
  /** Hanya bermakna untuk golongan Dewasa dengan tingkatan KPD/KPL: true = tercatat sebagai Pelatih. */
  is_pelatih?: boolean;
  /** 'L' = Laki-laki, 'P' = Perempuan. Kosong pada data lama yang belum dilengkapi. */
  jenis_kelamin?: 'L' | 'P';
  /** Peran anggota Dewasa (boleh lebih dari satu), mis. ['pembina_siaga', 'pamong_saka']. */
  peran?: string[];
  created_by: string; // User ID
  created_at: string;
}

export interface AnggotaSaka {
  id: string;
  anggota_id: string;
  saka_id: string;
  status: 'pending' | 'approved';
  sumber: 'diajukan' | 'ditarik_saka';
  created_at: string;
}

export interface Berita {
  id: string;
  judul: string;
  konten: string;
  gambar_cover: string;
  author_type: UserRole;
  author_id: string; // Kwarran ID, Gudep ID, Saka ID, or Kwarcab (User ID)
  author_nama: string; // Helper for display
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
}

export type KategoriAgenda = 'mandiri' | 'partisipasi_daerah' | 'partisipasi_nasional' | 'partisipasi_internasional';

export interface Agenda {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kategori: KategoriAgenda;
  owner_type: UserRole;
  owner_id: string;
  created_at: string;
}

export interface Notifikasi {
  id: string;
  user_id: string;
  tipe: string;
  pesan: string;
  referensi_id: string;
  is_read: boolean;
  created_at: string;
}

export interface PimpinanKwarcab {
  id: string;
  nama: string;
  jabatan: string;
  foto: string;
  urutan: number;
  /** 'inti' = Pimpinan Inti; kosong / 'pengurus' = Pengurus Kwarcab. */
  kategori?: 'inti' | 'pengurus';
}

export interface ProfilKwarcab {
  id: string;
  visi: string;
  misi: string;
  sejarah: string;
  hero_mode: 'statis' | 'dinamis';
  banner_statis_url: string;
  sosmed?: SosmedLinks;
  ketua_kwarcab_nama?: string;
  ketua_kwarcab_foto?: string;
  ketua_harian_nama?: string;
  ketua_harian_foto?: string;
  sekretaris_nama?: string;
  sekretaris_foto?: string;
  bendahara_nama?: string;
  bendahara_foto?: string;
  ketua_pusdatin_nama?: string;
  ketua_pusdatin_foto?: string;
  /** Pendaftaran mandiri Admin Kwarran dibuka (true) atau ditutup (false/kosong). */
  registrasi_terbuka?: boolean;
  /** Info LT III (pengumuman, banner popup, juknis, klasemen). Kosong = belum pernah diatur. */
  lt3?: Lt3Data;
}

export type Lt3Jenis = 'putra' | 'putri';
export type Lt3Kelompok = 'utama' | 'penunjang' | 'tambahan';
/** diumumkan = juara 1-3 lomba ini ditampilkan di bagian Pengumuman Kejuaraan (publik). */
export interface Lt3Lomba { id: string; nama: string; kelompok: Lt3Kelompok; diumumkan?: boolean }
/** Poin yang diperoleh untuk masing-masing medali pada satu kelompok lomba. */
export interface Lt3PoinMedali { emas: number; perak: number; perunggu: number }
export type Lt3Poin = Record<Lt3Kelompok, Lt3PoinMedali>;
/** kwarran = nama Kwartir Ranting yang diwakili regu; asal = pangkalan/sekolah (opsional). */
export interface Lt3Regu { id: string; nama: string; kwarran: string; asal: string; jenis: Lt3Jenis }
export interface Lt3Data {
  /** Menu "Info LT III" tampil di landing page atau tidak. */
  aktif: boolean;
  judul: string;
  pengumuman: string;
  pengumuman_tanggal: string;
  banner: { url: string; judul: string; tampil: boolean; mulai: string; selesai: string };
  juknis: { url: string; nama: string };
  /** Poin medali per kelompok lomba (Utama, Penunjang, Tambahan). */
  poin: Lt3Poin;
  lomba: Lt3Lomba[];
  regu: Lt3Regu[];
  /** nilai[lombaId][reguId] */
  nilai: Record<string, Record<string, number>>;
}

export interface KampungPramuka {
  id: string;
  nama: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  foto: string; // Comma separated image URLs
  sejarah: string;
  keunggulan: string;
  /** 'aktif' = sudah ada (hijau), 'proses' = sedang diproses (kuning). Kosong dianggap 'aktif'. */
  status?: 'aktif' | 'proses';
  created_at: string;
}

export interface KtaConfig {
  nama_ketua: string;
  tanda_tangan_url: string;
  stempel_url: string;
}
