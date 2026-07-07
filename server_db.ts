import fs from 'fs';
import path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { 
  User, KwartirRanting, GugusDepan, SatuanKarya, 
  Anggota, AnggotaSaka, Berita, Agenda, 
  Notifikasi, PimpinanKwarcab, ProfilKwarcab, KampungPramuka, KtaConfig 
} from './src/types';

const IS_SERVERLESS_RUNTIME = process.env.NETLIFY === 'true'
  || process.env.NETLIFY_DEV === 'true'
  || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const STORE_PATH = IS_SERVERLESS_RUNTIME
  ? path.join('/tmp', 'kwarcab-db-store.json')
  : path.join(process.cwd(), 'data', 'db_store.json');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export interface DbState {
  users: User[];
  kwartir_ranting: KwartirRanting[];
  gugus_depan: GugusDepan[];
  satuan_karya: SatuanKarya[];
  anggota: Anggota[];
  anggota_saka: AnggotaSaka[];
  berita: Berita[];
  agenda: Agenda[];
  notifikasi: Notifikasi[];
  pimpinan_kwarcab: PimpinanKwarcab[];
  profil_kwarcab: ProfilKwarcab[];
  kampung_pramuka: KampungPramuka[];
  kta_config: KtaConfig;
}

type ArrayTableName = Exclude<keyof DbState, 'kta_config'>;

const ARRAY_TABLES: ArrayTableName[] = [
  'users',
  'kwartir_ranting',
  'gugus_depan',
  'satuan_karya',
  'anggota',
  'anggota_saka',
  'berita',
  'agenda',
  'notifikasi',
  'pimpinan_kwarcab',
  'profil_kwarcab',
  'kampung_pramuka'
];

const DELETE_ORDER: ArrayTableName[] = [
  'notifikasi',
  'anggota_saka',
  'anggota',
  'berita',
  'agenda',
  'gugus_depan',
  'satuan_karya',
  'kwartir_ranting',
  'users',
  'pimpinan_kwarcab',
  'profil_kwarcab',
  'kampung_pramuka'
];

const DEFAULT_KTA_CONFIG: KtaConfig = {
  nama_ketua: 'H. Agus Ridallah, S.H., M.H., M.Pd.',
  tanda_tangan_url: '',
  stempel_url: ''
};

const DEFAULT_PROFIL: ProfilKwarcab = {
  id: 'profil_1',
  visi: 'Terwujudnya Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya yang Edukatif, Mandiri, Berkarakter, dan Unggul Menuju Kabupaten Tasikmalaya yang Religius Islami.',
  misi: '1. Meningkatkan kualitas pembinaan mental, spiritual, jasmani, dan moral anggota Gerakan Pramuka se-Kabupaten Tasikmalaya.\n2. Mengoptimalkan tata kelola organisasi kwartir secara modern, transparan, dan akuntabel.\n3. Meningkatkan kompetensi pembina, pelatih, dan pamong saka secara berkelanjutan.\n4. Menyelenggarakan kegiatan kepramukaan yang inovatif, menarik, menantang, dan berbasis kearifan lokal.\n5. Memperkuat kolaborasi dengan pemerintah daerah, masyarakat, dan mitra gerakan kepramukaan dalam pembangunan pemuda.',
  sejarah: 'Gerakan Pramuka di Kabupaten Tasikmalaya memiliki sejarah panjang yang mengakar kuat sejak masa kepanduan sebelum kemerdekaan Indonesia. Melalui peleburan berbagai organisasi kepanduan pada tahun 1961 berdasarkan Keputusan Presiden No. 238 Tahun 1961, Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya resmi berdiri.\n\nSebagai salah satu kwartir cabang terbesar di wilayah Jawa Barat, Kwarcab Kabupaten Tasikmalaya secara konsisten melahirkan kader-kader pemimpin bangsa yang tangguh dan religius. Kantor Kwarcab Tasikmalaya yang saat ini berpusat di Singaparna terus menjadi episentrum pendidikan karakter non-formal bagi puluhan ribu peserta didik dari golongan Siaga, Penggalang, Penegak, hingga Pandega.',
  hero_mode: 'dinamis',
  banner_statis_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop'
};

const DEFAULT_PIMPINAN: PimpinanKwarcab[] = [
  {
    id: 'p_1',
    nama: 'H. Cecep Nurul Yakin, S.Pd., M.A.P.',
    jabatan: 'Ketua Kwartir Cabang',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    urutan: 1
  },
  {
    id: 'p_2',
    nama: 'Drs. H. Ahmad Saefudin, M.Pd.',
    jabatan: 'Ketua Harian',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
    urutan: 2
  },
  {
    id: 'p_3',
    nama: 'Yayat Ruhiyat, S.Pd., M.Si.',
    jabatan: 'Sekretaris Umum',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    urutan: 3
  },
  {
    id: 'p_4',
    nama: 'Hj. Endah Nurhayati, S.E.',
    jabatan: 'Bendahara Umum',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    urutan: 4
  }
];

const DEFAULT_KWARRAN: KwartirRanting[] = [
  {
    id: 'kwarran_1',
    nama_kecamatan: 'Cisayong',
    ketua: 'Kak H. Maman Budiman, M.Pd.',
    sekretaris: 'Kak Ade Sukmana, S.Pd.',
    bendahara: 'Kak Nenden Nurjanah, S.Pd.',
    foto_ketua: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    status: 'aktif',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'kwarran_2',
    nama_kecamatan: 'Singaparna',
    ketua: 'Kak Dr. H. Tatang, M.Si.',
    sekretaris: 'Kak Dani Ramdani, S.Pd.',
    bendahara: 'Kak Imas Masriah, S.Ag.',
    foto_ketua: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200',
    status: 'aktif',
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'kwarran_3',
    nama_kecamatan: 'Ciawi',
    ketua: 'Kak Drs. Agus Junaedi',
    sekretaris: 'Kak Hendra Wijaya, S.Pd.',
    bendahara: 'Kak Siti Jubaedah',
    foto_ketua: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
    status: 'transisi',
    created_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'kwarran_4',
    nama_kecamatan: 'Manonjaya',
    ketua: 'Kak H. Endang, S.Pd.',
    sekretaris: 'Kak Nanang, S.Pd.',
    bendahara: 'Kak Erna, S.Pd.',
    foto_ketua: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
    status: 'aktif',
    created_at: '2026-02-10T00:00:00Z'
  }
];

const DEFAULT_GUDEP: GugusDepan[] = [
  {
    id: 'gudep_1',
    nama_pangkalan: 'SMAN 1 Cisayong (Pangkalan Kian Santang - Dyah Pitaloka)',
    kwartir_ranting_id: 'kwarran_1',
    created_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'gudep_2',
    nama_pangkalan: 'SMPN 1 Cisayong',
    kwartir_ranting_id: 'kwarran_1',
    created_at: '2026-01-14T00:00:00Z'
  },
  {
    id: 'gudep_3',
    nama_pangkalan: 'SMAN 1 Singaparna',
    kwartir_ranting_id: 'kwarran_2',
    created_at: '2026-01-20T00:00:00Z'
  },
  {
    id: 'gudep_4',
    nama_pangkalan: 'MAN 2 Tasikmalaya (Singaparna)',
    kwartir_ranting_id: 'kwarran_2',
    created_at: '2026-01-22T00:00:00Z'
  }
];

const DEFAULT_SAKA: SatuanKarya[] = [
  {
    id: 'saka_1',
    nama_saka: 'Saka Bhayangkara',
    ketua: 'Kak AKP H. Subarna (Polres Tasikmalaya)',
    sekretaris: 'Kak Bripka Heri, S.H.',
    bendahara: 'Kak Rina Marlina',
    foto_ketua: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
    status: 'aktif',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'saka_2',
    nama_saka: 'Saka Bakti Husada',
    ketua: 'Kak Dr. H. Heru (Dinas Kesehatan)',
    sekretaris: 'Kak Ns. Dian, S.Kep.',
    bendahara: 'Kak Lilis Herawati, S.ST.',
    foto_ketua: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200',
    status: 'aktif',
    created_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'saka_3',
    nama_saka: 'Saka Wira Kartika',
    ketua: 'Kak Mayor Inf. Sugeng (Kodim 0612)',
    sekretaris: 'Kak Serma Jajang',
    bendahara: 'Kak Astri Rahayu',
    foto_ketua: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
    status: 'aktif',
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'saka_4',
    nama_saka: 'Saka Wanabakti',
    ketua: 'Kak H. Wahyu (Perhutani Tasikmalaya)',
    sekretaris: 'Kak Irwan, S.Hut.',
    bendahara: 'Kak Linda, S.E.',
    foto_ketua: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200',
    foto_sekretaris: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_bendahara: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    status: 'transisi',
    created_at: '2026-01-20T00:00:00Z'
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'u_1',
    nama: 'Admin Kwarcab Tasikmalaya',
    email: 'admin@kwarcabtasik.id',
    password_hash: '$2a$10$tasikmalayasecretpasswordhashsimulation', // We can simulate login simply with raw comparison or mock hashes
    role: 'kwarcab',
    ref_id: null,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'u_2',
    nama: 'Kak Maman (Cisayong)',
    email: 'cisayong@kwarcabtasik.id',
    password_hash: '$2a$10$cisayongsecretpasswordhashsimulation',
    role: 'kwarran',
    ref_id: 'kwarran_1',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'u_3',
    nama: 'Pembina SMAN 1 Cisayong',
    email: 'gudep_sma1@kwarcabtasik.id',
    password_hash: '$2a$10$gudep1secretpasswordhashsimulation',
    role: 'gudep',
    ref_id: 'gudep_1',
    created_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'u_4',
    nama: 'Pamong Saka Bhayangkara',
    email: 'bhayangkara@kwarcabtasik.id',
    password_hash: '$2a$10$bhayankarasecretpasswordhashsimulation',
    role: 'saka',
    ref_id: 'saka_1',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'u_5',
    nama: 'Pamong Saka Bakti Husada',
    email: 'husada@kwarcabtasik.id',
    password_hash: '$2a$10$husadasecretpasswordhashsimulation',
    role: 'saka',
    ref_id: 'saka_2',
    created_at: '2026-01-12T00:00:00Z'
  }
];

const DEFAULT_BERITA: Berita[] = [
  {
    id: 'berita_1',
    judul: 'Raimuna Cabang Kabupaten Tasikmalaya 2026 Berlangsung Semarak di Cisayong',
    konten: 'Cisayong, Tasikmalaya — Ribuan Pramuka Penegak dan Pandega se-Kabupaten Tasikmalaya memadati Bumi Perkemahan Cisayong dalam rangka Raimuna Cabang (Raicab) 2026. Kegiatan ini dibuka langsung oleh Ketua Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya, Kak H. Cecep Nurul Yakin.\n\nDalam sambutannya, Kak Cecep menekankan pentingnya peran pramuka sebagai garda terdepan dalam menjaga keutuhan NKRI dan menjadi teladan moral yang mulia di tengah perkembangan era digital. "Adik-adik sekalian adalah pemimpin masa depan. Gunakan momen Raimuna ini untuk mengasah keterampilan, memperluas persaudaraan, dan menanamkan nilai luhur Pancasila dalam sanubari," ujarnya.\n\nBerbagai kegiatan menarik dilaksanakan selama lima hari, mulai dari workshop teknologi digital, bakti sosial masyarakat, simulasi tanggap bencana oleh Saka Bhayangkara, hingga festival kebudayaan lokal Tasikmalaya yang sangat dinamis.',
    gambar_cover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
    author_type: 'kwarcab',
    author_id: 'u_1',
    author_nama: 'Admin Kwarcab',
    status: 'approved',
    is_featured: true,
    created_at: '2026-06-28T09:00:00Z'
  },
  {
    id: 'berita_2',
    judul: 'Pelatihan Tanggap Darurat Bencana Saka Bhayangkara Bersama Polres Tasikmalaya',
    konten: 'Singaparna — Satuan Karya Pramuka (Saka) Bhayangkara Kwarcab Tasikmalaya menyelenggarakan Pelatihan Krida Penanggulangan Bencana alam bersama jajaran Satbinmas Polres Tasikmalaya di Lapangan Hitam Mapolres.\n\nKegiatan ini diikuti oleh 60 anggota perwakilan dari berbagai Kwartir Ranting. Materi utama yang disampaikan meliputi evakuasi korban bencana air (SAR), pertolongan pertama pada kecelakaan (PPPK), dan manajemen posko pengungsian. Instruktur pelatih dari Polres Tasikmalaya mengapresiasi semangat juang dan kedisiplinan yang ditunjukkan oleh adik-adik Saka Bhayangkara.',
    gambar_cover: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
    author_type: 'saka',
    author_id: 'saka_1',
    author_nama: 'Saka Bhayangkara',
    status: 'approved',
    is_featured: false,
    created_at: '2026-07-02T14:30:00Z'
  },
  {
    id: 'berita_3',
    judul: 'Gugus Depan SMAN 1 Cisayong Adakan Gelar Senopati dan Karya Pramuka',
    konten: 'Cisayong — Pangkalan Kian Santang - Dyah Pitaloka Gugus Depan SMAN 1 Cisayong menyelenggarakan kegiatan tahunan Gelar Senopati. Kegiatan ini diisi dengan pameran hasta karya daur ulang sampah organik, lomba ketangkasan baris-berbaris (LKBB), serta bakti bersih lingkungan di sekitar Kecamatan Cisayong.\n\nKegiatan ini mendapat apresiasi penuh dari Kwartir Ranting Cisayong yang turut hadir memonitoring jalannya acara.',
    gambar_cover: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop',
    author_type: 'gudep',
    author_id: 'gudep_1',
    author_nama: 'SMAN 1 Cisayong',
    status: 'approved',
    is_featured: false,
    created_at: '2026-07-04T08:00:00Z'
  },
  {
    id: 'berita_4',
    judul: 'Pengajuan Agenda Sehat Bersama Saka Bakti Husada Tasikmalaya',
    konten: 'Saka Bakti Husada berencana menyelenggarakan sosialisasi pola hidup bersih dan sehat (PHBS) serta pembagian masker medis di lingkungan pasar tradisional Singaparna. Kegiatan ini diinisiasi untuk mengedukasi masyarakat pasar akan pentingnya kesehatan pasca-pandemi.',
    gambar_cover: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop',
    author_type: 'saka',
    author_id: 'saka_2',
    author_nama: 'Saka Bakti Husada',
    status: 'pending',
    is_featured: false,
    created_at: '2026-07-05T01:00:00Z'
  }
];

const DEFAULT_AGENDA: Agenda[] = [
  {
    id: 'agenda_1',
    judul: 'Karya Bakti Lebaran & Pos Pengamanan Pramuka Kwarcab Tasikmalaya 2026',
    deskripsi: 'Partisipasi seluruh anggota Pramuka Penegak, Pandega, Saka Bhayangkara, dan Saka Bakti Husada dalam membantu pengamanan lalu lintas dan posko kesehatan mudik lebaran di jalur lingkar Gentong dan Singaparna.',
    tanggal_mulai: '2026-04-12',
    tanggal_selesai: '2026-04-20',
    kategori: 'mandiri',
    owner_type: 'kwarcab',
    owner_id: 'u_1',
    created_at: '2026-03-15T00:00:00Z'
  },
  {
    id: 'agenda_2',
    judul: 'Pengiriman Kontingen Kwarcab Tasikmalaya ke Raimuna Nasional XIII 2026',
    deskripsi: 'Pelepasan resmi dan pemberangkatan kontingen cabang terbaik Kabupaten Tasikmalaya untuk mengikuti Raimuna Nasional XIII di Bumi Perkemahan Cibubur, Jakarta.',
    tanggal_mulai: '2026-08-14',
    tanggal_selesai: '2026-08-21',
    kategori: 'partisipasi_nasional',
    owner_type: 'kwarcab',
    owner_id: 'u_1',
    created_at: '2026-05-10T00:00:00Z'
  },
  {
    id: 'agenda_3',
    judul: 'Lomba Tingkat III (LT-III) Penggalang Kwarcab Tasikmalaya',
    deskripsi: 'Pertemuan dan perlombaan regu penggalang terbaik utusan tiap Kwartir Ranting se-Kabupaten Tasikmalaya untuk merebut tiket mewakili cabang ke LT-IV tingkat Daerah Jawa Barat.',
    tanggal_mulai: '2026-07-15',
    tanggal_selesai: '2026-07-19',
    kategori: 'mandiri',
    owner_type: 'kwarcab',
    owner_id: 'u_1',
    created_at: '2026-06-01T00:00:00Z'
  }
];

const DEFAULT_ANGGOTA: Anggota[] = [
  {
    id: 'ang_1',
    nama_lengkap: 'Ahmad Fauzi',
    tempat_lahir: 'Tasikmalaya',
    tanggal_lahir: '2008-08-15',
    golongan: 'penegak',
    tingkatan: 'Bantara',
    alamat_asal: 'Kp. Sindangsari RT 02 RW 05, Desa Cisayong, Kecamatan Cisayong',
    pangkalan: 'SMAN 1 Cisayong',
    kwartir_ranting_id: 'kwarran_1',
    gudep_id: 'gudep_1',
    created_by: 'u_2',
    created_at: '2026-02-15T08:00:00Z'
  },
  {
    id: 'ang_2',
    nama_lengkap: 'Siti Rahmawati',
    tempat_lahir: 'Tasikmalaya',
    tanggal_lahir: '2009-04-12',
    golongan: 'penegak',
    tingkatan: 'Laksana',
    alamat_asal: 'Jl. Raya Singaparna No. 45, Singaparna',
    pangkalan: 'SMAN 1 Singaparna',
    kwartir_ranting_id: 'kwarran_2',
    gudep_id: 'gudep_3',
    created_by: 'u_1',
    created_at: '2026-02-20T10:00:00Z'
  },
  {
    id: 'ang_3',
    nama_lengkap: 'Dadan Wildan',
    tempat_lahir: 'Tasikmalaya',
    tanggal_lahir: '2007-11-22',
    golongan: 'pandega',
    tingkatan: 'Pandega',
    alamat_asal: 'Kp. Cikiray RT 04 RW 01, Desa Singaparna',
    pangkalan: 'Masyarakat Umum Singaparna',
    kwartir_ranting_id: 'kwarran_2',
    gudep_id: null,
    created_by: 'u_1',
    created_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'ang_4',
    nama_lengkap: 'Rizki Aditya',
    tempat_lahir: 'Tasikmalaya',
    tanggal_lahir: '2015-05-10',
    golongan: 'siaga',
    tingkatan: 'Bantu',
    alamat_asal: 'Kp. Cantigi, Cisayong',
    pangkalan: 'SDN 1 Cisayong',
    kwartir_ranting_id: 'kwarran_1',
    gudep_id: null,
    created_by: 'u_2',
    created_at: '2026-03-05T09:00:00Z'
  },
  {
    id: 'ang_5',
    nama_lengkap: 'Budi Santoso',
    tempat_lahir: 'Tasikmalaya',
    tanggal_lahir: '2008-01-20',
    golongan: 'penegak',
    tingkatan: 'Bantara',
    alamat_asal: 'Desa Ciawi, Kecamatan Ciawi',
    pangkalan: 'SMAN 1 Ciawi',
    kwartir_ranting_id: 'kwarran_3',
    gudep_id: null,
    created_by: 'u_1',
    created_at: '2026-03-10T14:00:00Z'
  }
];

const DEFAULT_ANGGOTA_SAKA: AnggotaSaka[] = [
  {
    id: 'as_1',
    anggota_id: 'ang_1',
    saka_id: 'saka_1',
    status: 'approved',
    sumber: 'diajukan',
    created_at: '2026-03-15T00:00:00Z'
  },
  {
    id: 'as_2',
    anggota_id: 'ang_2',
    saka_id: 'saka_2',
    status: 'pending',
    sumber: 'diajukan',
    created_at: '2026-04-01T00:00:00Z'
  }
];

const DEFAULT_NOTIFIKASI: Notifikasi[] = [
  {
    id: 'notif_1',
    user_id: 'u_1',
    tipe: 'berita_pengajuan',
    pesan: 'Saka Bakti Husada mengajukan berita baru: "Pengajuan Agenda Sehat Bersama Saka Bakti Husada Tasikmalaya"',
    referensi_id: 'berita_4',
    is_read: false,
    created_at: '2026-07-05T01:00:00Z'
  }
];

const DEFAULT_KAMPUNG_PRAMUKA: KampungPramuka[] = [
  {
    id: 'kp_1',
    nama: 'Kampung Pramuka Cisayong',
    kecamatan: 'Cisayong',
    latitude: -7.2858,
    longitude: 108.1472,
    foto: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800,https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800',
    sejarah: 'Kampung Pramuka Cisayong dirintis sejak pertengahan tahun 2024 sebagai kolaborasi strategis antara Kwartir Cabang Tasikmalaya dan Pemerintah Desa Cisayong. Kawasan ini didedikasikan untuk membangun desa wisata yang mengintegrasikan nilai-nilai kepramukaan, kemandirian pemuda, serta pelestarian lingkungan hidup dan agrobisnis pedesaan.',
    keunggulan: 'Bumi perkemahan mandiri bernuansa pinus, perkebunan organik terpadu yang dikelola pramuka penegak, pengolahan limbah organik berbasis maggot, dan kegiatan berkala edukasi konservasi air.',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'kp_2',
    nama: 'Kampung Pramuka Singaparna',
    kecamatan: 'Singaparna',
    latitude: -7.3508,
    longitude: 108.1122,
    foto: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800,https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800',
    sejarah: 'Kampung Pramuka Singaparna didirikan pada tahun 2025 dengan fokus utama pada pemberdayaan ekonomi kreatif remaja dan penguasaan IPTEK kepramukaan. Lokasi ini menjadi inkubator bisnis anyaman bambu dan media kreatif bagi pramuka golongan penegak dan pandega se-Singaparna.',
    keunggulan: 'Sentra pelatihan kerajinan anyaman bambu modern, ruang kreasi digital pemuda, kemitraan program gizi posyandu remaja, dan jaringan kewirausahaan mandiri.',
    created_at: '2026-02-15T00:00:00Z'
  }
];

function createDefaultState(): DbState {
  return {
    users: DEFAULT_USERS,
    kwartir_ranting: DEFAULT_KWARRAN,
    gugus_depan: DEFAULT_GUDEP,
    satuan_karya: DEFAULT_SAKA,
    anggota: DEFAULT_ANGGOTA,
    anggota_saka: DEFAULT_ANGGOTA_SAKA,
    berita: DEFAULT_BERITA,
    agenda: DEFAULT_AGENDA,
    notifikasi: DEFAULT_NOTIFIKASI,
    pimpinan_kwarcab: DEFAULT_PIMPINAN,
    profil_kwarcab: [DEFAULT_PROFIL],
    kampung_pramuka: DEFAULT_KAMPUNG_PRAMUKA,
    kta_config: DEFAULT_KTA_CONFIG
  };
}

export class DatabaseSim {
  private state: DbState;
  private syncTimer: NodeJS.Timeout | null = null;
  private supabaseConnected = false;
  public readonly ready: Promise<void>;

  constructor() {
    this.state = this.load();
    this.ready = this.bootstrapSupabase();
  }

  private load(): DbState {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        let modified = false;
        if (!parsed.kampung_pramuka) {
          parsed.kampung_pramuka = DEFAULT_KAMPUNG_PRAMUKA;
          modified = true;
        }
        if (!parsed.kta_config) {
          parsed.kta_config = DEFAULT_KTA_CONFIG;
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading database, reinitializing...', e);
    }

    // Default Initialization
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const defaultState: DbState = createDefaultState();

    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultState, null, 2), 'utf-8');
    return defaultState;
  }

  private async bootstrapSupabase(): Promise<void> {
    if (!supabase) {
      console.log('[Database] Supabase env not configured; using local JSON store.');
      return;
    }

    try {
      await this.pullFromSupabase();
      await this.flushToSupabase();
      this.persistLocalOnly();
      this.supabaseConnected = true;
      console.log('[Database] Supabase integration ready.');
    } catch (e) {
      this.supabaseConnected = false;
      console.error('[Database] Supabase bootstrap failed; continuing with local JSON store.', e);
    }
  }

  public isSupabaseConnected(): boolean {
    return this.supabaseConnected;
  }

  private async pullFromSupabase(): Promise<void> {
    if (!supabase) return;

    for (const table of ARRAY_TABLES) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`${table}: ${error.message}`);
      if (data && data.length > 0) {
        (this.state[table] as any[]) = data;
      }
    }

    const { data: ktaRows, error: ktaError } = await supabase
      .from('kta_config')
      .select('nama_ketua,tanda_tangan_url,stempel_url')
      .eq('id', 'kta_1')
      .limit(1);
    if (ktaError) throw new Error(`kta_config: ${ktaError.message}`);
    if (ktaRows && ktaRows.length > 0) {
      this.state.kta_config = {
        nama_ketua: ktaRows[0].nama_ketua || DEFAULT_KTA_CONFIG.nama_ketua,
        tanda_tangan_url: ktaRows[0].tanda_tangan_url || '',
        stempel_url: ktaRows[0].stempel_url || ''
      };
    }
  }

  private persistLocalOnly(): void {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database state', e);
    }
  }

  private queueSupabaseSync(): void {
    if (!supabase) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      void this.flushToSupabase();
    }, 150);
  }

  private async flushToSupabase(): Promise<void> {
    if (!supabase) return;

    try {
      for (const table of ARRAY_TABLES) {
        const rows = this.state[table] as any[];
        if (rows.length > 0) {
          const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
          if (error) throw new Error(`${table} upsert: ${error.message}`);
        }
      }

      const { error: ktaError } = await supabase.from('kta_config').upsert({
        id: 'kta_1',
        ...this.state.kta_config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (ktaError) throw new Error(`kta_config upsert: ${ktaError.message}`);

      for (const table of DELETE_ORDER) {
        const localIds = new Set((this.state[table] as any[]).map(row => row.id));
        const { data: remoteRows, error } = await supabase.from(table).select('id');
        if (error) throw new Error(`${table} select ids: ${error.message}`);

        const staleIds = (remoteRows || [])
          .map((row: any) => row.id)
          .filter((id: string) => !localIds.has(id));
        if (staleIds.length > 0) {
          const { error: deleteError } = await supabase.from(table).delete().in('id', staleIds);
          if (deleteError) throw new Error(`${table} delete stale: ${deleteError.message}`);
        }
      }
    } catch (e) {
      console.error('[Database] Supabase sync failed.', e);
    }
  }

  public save(): void {
    this.persistLocalOnly();
    this.queueSupabaseSync();
  }

  // Users CRUD
  public getUsers(): User[] { return this.state.users; }
  public addUser(user: User): void { this.state.users.push(user); this.save(); }
  public updateUser(id: string, updates: Partial<User>): void {
    this.state.users = this.state.users.map(u => u.id === id ? { ...u, ...updates } : u);
    this.save();
  }
  public deleteUser(id: string): void {
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.save();
  }

  // Kwartir Ranting CRUD
  public getKwarran(): KwartirRanting[] { return this.state.kwartir_ranting; }
  public addKwarran(kr: KwartirRanting): void { this.state.kwartir_ranting.push(kr); this.save(); }
  public updateKwarran(id: string, updates: Partial<KwartirRanting>): void {
    this.state.kwartir_ranting = this.state.kwartir_ranting.map(kr => kr.id === id ? { ...kr, ...updates } : kr);
    this.save();
  }
  public deleteKwarran(id: string): void {
    this.state.kwartir_ranting = this.state.kwartir_ranting.filter(kr => kr.id !== id);
    // Cascade delete gudep
    this.state.gugus_depan = this.state.gugus_depan.filter(gd => gd.kwartir_ranting_id !== id);
    this.save();
  }

  // Gugus Depan CRUD
  public getGudep(): GugusDepan[] { return this.state.gugus_depan; }
  public addGudep(gd: GugusDepan): void { this.state.gugus_depan.push(gd); this.save(); }
  public updateGudep(id: string, updates: Partial<GugusDepan>): void {
    this.state.gugus_depan = this.state.gugus_depan.map(gd => gd.id === id ? { ...gd, ...updates } : gd);
    this.save();
  }
  public deleteGudep(id: string): void {
    this.state.gugus_depan = this.state.gugus_depan.filter(gd => gd.id !== id);
    this.save();
  }

  // Satuan Karya CRUD
  public getSaka(): SatuanKarya[] { return this.state.satuan_karya; }
  public addSaka(sk: SatuanKarya): void { this.state.satuan_karya.push(sk); this.save(); }
  public updateSaka(id: string, updates: Partial<SatuanKarya>): void {
    this.state.satuan_karya = this.state.satuan_karya.map(sk => sk.id === id ? { ...sk, ...updates } : sk);
    this.save();
  }
  public deleteSaka(id: string): void {
    this.state.satuan_karya = this.state.satuan_karya.filter(sk => sk.id !== id);
    this.state.anggota_saka = this.state.anggota_saka.filter(as => as.saka_id !== id);
    this.save();
  }

  // Anggota CRUD
  public getAnggota(): Anggota[] { return this.state.anggota; }
  public addAnggota(a: Anggota): void { this.state.anggota.push(a); this.save(); }
  public updateAnggota(id: string, updates: Partial<Anggota>): void {
    this.state.anggota = this.state.anggota.map(a => a.id === id ? { ...a, ...updates } : a);
    this.save();
  }
  public deleteAnggota(id: string): void {
    this.state.anggota = this.state.anggota.filter(a => a.id !== id);
    this.state.anggota_saka = this.state.anggota_saka.filter(as => as.anggota_id !== id);
    this.save();
  }

  // Anggota Saka Junction CRUD
  public getAnggotaSaka(): AnggotaSaka[] { return this.state.anggota_saka; }
  public addAnggotaSaka(as: AnggotaSaka): void {
    // Check duplication
    const exists = this.state.anggota_saka.some(x => x.anggota_id === as.anggota_id && x.saka_id === as.saka_id);
    if (!exists) {
      this.state.anggota_saka.push(as);
      this.save();
    }
  }
  public updateAnggotaSaka(id: string, updates: Partial<AnggotaSaka>): void {
    this.state.anggota_saka = this.state.anggota_saka.map(as => as.id === id ? { ...as, ...updates } : as);
    this.save();
  }
  public deleteAnggotaSaka(id: string): void {
    this.state.anggota_saka = this.state.anggota_saka.filter(as => as.id !== id);
    this.save();
  }
  public removeAnggotaSakaRelation(anggotaId: string, sakaId: string): void {
    this.state.anggota_saka = this.state.anggota_saka.filter(as => !(as.anggota_id === anggotaId && as.saka_id === sakaId));
    this.save();
  }

  // Berita CRUD
  public getBerita(): Berita[] { return this.state.berita; }
  public addBerita(b: Berita): void { this.state.berita.push(b); this.save(); }
  public updateBerita(id: string, updates: Partial<Berita>): void {
    this.state.berita = this.state.berita.map(b => b.id === id ? { ...b, ...updates } : b);
    this.save();
  }
  public deleteBerita(id: string): void {
    this.state.berita = this.state.berita.filter(b => b.id !== id);
    this.save();
  }

  // Agenda CRUD
  public getAgenda(): Agenda[] { return this.state.agenda; }
  public addAgenda(ag: Agenda): void { this.state.agenda.push(ag); this.save(); }
  public updateAgenda(id: string, updates: Partial<Agenda>): void {
    this.state.agenda = this.state.agenda.map(ag => ag.id === id ? { ...ag, ...updates } : ag);
    this.save();
  }
  public deleteAgenda(id: string): void {
    this.state.agenda = this.state.agenda.filter(ag => ag.id !== id);
    this.save();
  }

  // Notifikasi CRUD
  public getNotifikasi(): Notifikasi[] { return this.state.notifikasi; }
  public addNotifikasi(n: Notifikasi): void { this.state.notifikasi.push(n); this.save(); }
  public markNotifRead(id: string): void {
    this.state.notifikasi = this.state.notifikasi.map(n => n.id === id ? { ...n, is_read: true } : n);
    this.save();
  }
  public deleteNotifikasi(id: string): void {
    this.state.notifikasi = this.state.notifikasi.filter(n => n.id !== id);
    this.save();
  }

  // Pimpinan Kwarcab CRUD
  public getPimpinan(): PimpinanKwarcab[] { return this.state.pimpinan_kwarcab; }
  public addPimpinan(p: PimpinanKwarcab): void { this.state.pimpinan_kwarcab.push(p); this.save(); }
  public updatePimpinan(id: string, updates: Partial<PimpinanKwarcab>): void {
    this.state.pimpinan_kwarcab = this.state.pimpinan_kwarcab.map(p => p.id === id ? { ...p, ...updates } : p);
    this.save();
  }
  public deletePimpinan(id: string): void {
    this.state.pimpinan_kwarcab = this.state.pimpinan_kwarcab.filter(p => p.id !== id);
    this.save();
  }

  // Profil Kwarcab CRUD
  public getProfil(): ProfilKwarcab { 
    if (this.state.profil_kwarcab.length === 0) {
      this.state.profil_kwarcab.push(DEFAULT_PROFIL);
      this.save();
    }
    return this.state.profil_kwarcab[0]; 
  }
  public updateProfil(updates: Partial<ProfilKwarcab>): void {
    if (this.state.profil_kwarcab.length === 0) {
      this.state.profil_kwarcab.push({ ...DEFAULT_PROFIL, ...updates });
    } else {
      this.state.profil_kwarcab[0] = { ...this.state.profil_kwarcab[0], ...updates };
    }
    this.save();
  }

  // Kampung Pramuka CRUD
  public getKampungPramuka(): KampungPramuka[] { 
    if (!this.state.kampung_pramuka) {
      this.state.kampung_pramuka = [];
    }
    return this.state.kampung_pramuka; 
  }
  public addKampungPramuka(kp: KampungPramuka): void { 
    if (!this.state.kampung_pramuka) {
      this.state.kampung_pramuka = [];
    }
    this.state.kampung_pramuka.push(kp); 
    this.save(); 
  }
  public updateKampungPramuka(id: string, updates: Partial<KampungPramuka>): void {
    if (!this.state.kampung_pramuka) {
      this.state.kampung_pramuka = [];
    }
    this.state.kampung_pramuka = this.state.kampung_pramuka.map(kp => kp.id === id ? { ...kp, ...updates } : kp);
    this.save();
  }
  public deleteKampungPramuka(id: string): void {
    if (!this.state.kampung_pramuka) {
      this.state.kampung_pramuka = [];
    }
    this.state.kampung_pramuka = this.state.kampung_pramuka.filter(kp => kp.id !== id);
    this.save();
  }

  // KTA Config
  public getKtaConfig(): KtaConfig {
    if (!this.state.kta_config) {
      this.state.kta_config = DEFAULT_KTA_CONFIG;
      this.save();
    }
    return this.state.kta_config;
  }

  public setKtaConfig(config: KtaConfig): void {
    this.state.kta_config = {
      nama_ketua: config.nama_ketua || DEFAULT_KTA_CONFIG.nama_ketua,
      tanda_tangan_url: config.tanda_tangan_url || '',
      stempel_url: config.stempel_url || ''
    };
    this.save();
  }
}
