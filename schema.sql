-- ====================================================================
-- SUPABASE / POSTGRES SCHEMA
-- Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka')),
  ref_id TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka'));

CREATE TABLE IF NOT EXISTS kwartir_ranting (
  id TEXT PRIMARY KEY,
  nama_kecamatan TEXT NOT NULL,
  ketua TEXT NOT NULL,
  sekretaris TEXT NOT NULL,
  bendahara TEXT NOT NULL,
  foto_ketua TEXT DEFAULT '',
  foto_sekretaris TEXT DEFAULT '',
  foto_bendahara TEXT DEFAULT '',
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'non-aktif', 'transisi')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gugus_depan (
  id TEXT PRIMARY KEY,
  nama_pangkalan TEXT NOT NULL,
  kwartir_ranting_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS satuan_karya (
  id TEXT PRIMARY KEY,
  nama_saka TEXT NOT NULL,
  ketua TEXT NOT NULL,
  sekretaris TEXT NOT NULL,
  bendahara TEXT NOT NULL,
  foto_ketua TEXT DEFAULT '',
  foto_sekretaris TEXT DEFAULT '',
  foto_bendahara TEXT DEFAULT '',
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'non-aktif', 'transisi')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anggota (
  id TEXT PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir TEXT NOT NULL,
  golongan TEXT NOT NULL CHECK (golongan IN ('siaga', 'penggalang', 'penegak', 'pandega', 'dewasa')),
  tingkatan TEXT NOT NULL,
  alamat_asal TEXT DEFAULT '',
  pangkalan TEXT DEFAULT '',
  kwartir_ranting_id TEXT NOT NULL,
  gudep_id TEXT,
  foto TEXT DEFAULT '',
  is_kta_printed BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anggota_saka (
  id TEXT PRIMARY KEY,
  anggota_id TEXT NOT NULL,
  saka_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  sumber TEXT DEFAULT 'diajukan' CHECK (sumber IN ('diajukan', 'ditarik_saka')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (anggota_id, saka_id)
);

CREATE TABLE IF NOT EXISTS berita (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  gambar_cover TEXT DEFAULT '',
  author_type TEXT NOT NULL CHECK (author_type IN ('kwarcab', 'kwarran', 'gudep', 'saka')),
  author_id TEXT NOT NULL,
  author_nama TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT DEFAULT '',
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  kategori TEXT DEFAULT 'mandiri' CHECK (kategori IN ('mandiri', 'partisipasi_daerah', 'partisipasi_nasional', 'partisipasi_internasional')),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('kwarcab', 'kwarran', 'gudep', 'saka')),
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifikasi (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tipe TEXT NOT NULL,
  pesan TEXT NOT NULL,
  referensi_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pimpinan_kwarcab (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  foto TEXT DEFAULT '',
  urutan INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS profil_kwarcab (
  id TEXT PRIMARY KEY,
  visi TEXT NOT NULL,
  misi TEXT NOT NULL,
  sejarah TEXT NOT NULL,
  hero_mode TEXT DEFAULT 'dinamis' CHECK (hero_mode IN ('statis', 'dinamis')),
  banner_statis_url TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS kampung_pramuka (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  foto TEXT DEFAULT '',
  sejarah TEXT NOT NULL,
  keunggulan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kta_config (
  id TEXT PRIMARY KEY DEFAULT 'kta_1',
  nama_ketua TEXT NOT NULL,
  tanda_tangan_url TEXT DEFAULT '',
  stempel_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO kta_config (id, nama_ketua, tanda_tangan_url, stempel_url)
VALUES ('kta_1', 'H. Agus Ridallah, S.H., M.H., M.Pd.', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profil_kwarcab (id, visi, misi, sejarah, hero_mode, banner_statis_url)
VALUES (
  'profil_1',
  'Terwujudnya Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya yang Edukatif, Mandiri, Berkarakter, dan Unggul Menuju Kabupaten Tasikmalaya yang Religius Islami.',
  '1. Meningkatkan kualitas pembinaan mental, spiritual, jasmani, dan moral anggota Gerakan Pramuka se-Kabupaten Tasikmalaya.',
  'Gerakan Pramuka di Kabupaten Tasikmalaya memiliki sejarah panjang yang mengakar kuat sejak masa kepanduan sebelum kemerdekaan Indonesia.',
  'dinamis',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop'
)
ON CONFLICT (id) DO NOTHING;
