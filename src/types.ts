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

export type GolonganPramuka = 'siaga' | 'penggalang' | 'penegak' | 'pandega' | 'dewasa';

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
}

export interface ProfilKwarcab {
  id: string;
  visi: string;
  misi: string;
  sejarah: string;
  hero_mode: 'statis' | 'dinamis';
  banner_statis_url: string;
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
  created_at: string;
}

export interface KtaConfig {
  nama_ketua: string;
  tanda_tangan_url: string;
  stempel_url: string;
}
