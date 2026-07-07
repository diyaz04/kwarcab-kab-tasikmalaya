-- ====================================================================
-- SCHEMA MIGRATION: CLOUDFLARE D1 (SQLITE)
-- Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya
-- ====================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('kwarcab', 'kwarran', 'gudep', 'saka')) NOT NULL,
  ref_id TEXT, -- FK to kwartir_ranting, gugus_depan, or satuan_karya depending on role
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. kwartir_ranting
CREATE TABLE IF NOT EXISTS kwartir_ranting (
  id TEXT PRIMARY KEY,
  nama_kecamatan TEXT NOT NULL,
  ketua TEXT NOT NULL,
  sekretaris TEXT NOT NULL,
  bendahara TEXT NOT NULL,
  foto_ketua TEXT,
  foto_sekretaris TEXT,
  foto_bendahara TEXT,
  status TEXT CHECK(status IN ('aktif', 'non-aktif', 'transisi')) DEFAULT 'aktif',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. gugus_depan
CREATE TABLE IF NOT EXISTS gugus_depan (
  id TEXT PRIMARY KEY,
  nama_pangkalan TEXT NOT NULL,
  kwartir_ranting_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kwartir_ranting_id) REFERENCES kwartir_ranting(id) ON DELETE CASCADE
);

-- 4. satuan_karya
CREATE TABLE IF NOT EXISTS satuan_karya (
  id TEXT PRIMARY KEY,
  nama_saka TEXT NOT NULL,
  ketua TEXT NOT NULL,
  sekretaris TEXT NOT NULL,
  bendahara TEXT NOT NULL,
  foto_ketua TEXT,
  foto_sekretaris TEXT,
  foto_bendahara TEXT,
  status TEXT CHECK(status IN ('aktif', 'non-aktif', 'transisi')) DEFAULT 'aktif',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. anggota
CREATE TABLE IF NOT EXISTS anggota (
  id TEXT PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir TEXT NOT NULL,
  golongan TEXT CHECK(golongan IN ('siaga', 'penggalang', 'penegak', 'pandega', 'dewasa')) NOT NULL,
  tingkatan TEXT NOT NULL,
  alamat_asal TEXT,
  pangkalan TEXT,
  kwartir_ranting_id TEXT NOT NULL,
  gudep_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kwartir_ranting_id) REFERENCES kwartir_ranting(id) ON DELETE RESTRICT,
  FOREIGN KEY (gudep_id) REFERENCES gugus_depan(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6. anggota_saka (Junction table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS anggota_saka (
  id TEXT PRIMARY KEY,
  anggota_id TEXT NOT NULL,
  saka_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved')) DEFAULT 'pending',
  sumber TEXT CHECK(sumber IN ('diajukan', 'ditarik_saka')) DEFAULT 'diajukan',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
  FOREIGN KEY (saka_id) REFERENCES satuan_karya(id) ON DELETE CASCADE,
  UNIQUE(anggota_id, saka_id)
);

-- 7. berita
CREATE TABLE IF NOT EXISTS berita (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  gambar_cover TEXT,
  author_type TEXT CHECK(author_type IN ('kwarcab', 'kwarran', 'gudep', 'saka')) NOT NULL,
  author_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_featured INTEGER CHECK(is_featured IN (0, 1)) DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. agenda
CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  kategori TEXT CHECK(kategori IN ('mandiri', 'partisipasi_daerah', 'partisipasi_nasional', 'partisipasi_internasional')) DEFAULT 'mandiri',
  owner_type TEXT CHECK(owner_type IN ('kwarcab', 'kwarran', 'gudep', 'saka')) NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 9. notifikasi
CREATE TABLE IF NOT EXISTS notifikasi (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tipe TEXT NOT NULL,
  pesan TEXT NOT NULL,
  referensi_id TEXT,
  is_read INTEGER CHECK(is_read IN (0, 1)) DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. pimpinan_kwarcab
CREATE TABLE IF NOT EXISTS pimpinan_kwarcab (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  foto TEXT,
  urutan INTEGER DEFAULT 5
);

-- 11. profil_kwarcab
CREATE TABLE IF NOT EXISTS profil_kwarcab (
  id TEXT PRIMARY KEY,
  visi TEXT NOT NULL,
  misi TEXT NOT NULL,
  sejarah TEXT NOT NULL,
  hero_mode TEXT CHECK(hero_mode IN ('statis', 'dinamis')) DEFAULT 'dinamis',
  banner_statis_url TEXT
);

-- ====================================================================
-- INITIAL DATABASE SEED (DML)
-- ====================================================================

-- Insert default profil
INSERT OR REPLACE INTO profil_kwarcab (id, visi, misi, sejarah, hero_mode, banner_statis_url) VALUES (
  'profil_1',
  'Terwujudnya Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya yang Edukatif, Mandiri, Berkarakter, dan Unggul Menuju Kabupaten Tasikmalaya yang Religius Islami.',
  '1. Meningkatkan kualitas pembinaan mental, spiritual, jasmani, dan moral anggota Gerakan Pramuka se-Kabupaten Tasikmalaya.\n2. Mengoptimalkan tata kelola organisasi kwartir secara modern, transparan, dan akuntabel.\n3. Meningkatkan kompetensi pembina, pelatih, dan pamong saka secara berkelanjutan.\n4. Menyelenggarakan kegiatan kepramukaan yang inovatif, menarik, menantang, dan berbasis kearifan lokal.\n5. Memperkuat kolaborasi dengan pemerintah daerah, masyarakat, dan mitra gerakan kepramukaan dalam pembangunan pemuda.',
  'Gerakan Pramuka di Kabupaten Tasikmalaya memiliki sejarah panjang yang mengakar kuat sejak masa kepanduan sebelum kemerdekaan Indonesia. Melalui peleburan berbagai organisasi kepanduan pada tahun 1961 berdasarkan Keputusan Presiden No. 238 Tahun 1961, Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya resmi berdiri.\n\nSebagai salah satu kwartir cabang terbesar di wilayah Jawa Barat, Kwarcab Kabupaten Tasikmalaya secara konsisten melahirkan kader-kader pemimpin bangsa yang tangguh dan religius. Kantor Kwarcab Tasikmalaya yang saat ini berpusat di Singaparna terus menjadi episentrum pendidikan karakter non-formal bagi puluhan ribu peserta didik dari golongan Siaga, Penggalang, Penegak, hingga Pandega.',
  'dinamis',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600'
);

-- Insert default admin
INSERT OR REPLACE INTO users (id, nama, email, password_hash, role, ref_id) VALUES (
  'u_1',
  'Admin Kwarcab Tasikmalaya',
  'admin@kwarcabtasik.id',
  '$2a$10$tasikmalayasecretpasswordhashsimulation',
  'kwarcab',
  NULL
);
