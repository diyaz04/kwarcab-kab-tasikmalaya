import React, { useState, useEffect } from 'react';
import { 
  Users, User, Compass, Calendar, BookOpen, Clock, ArrowUpRight, ArrowRight, Layers, MapPin, Award, Shield, 
  Trash2, Edit, Plus, Check, X, Bell, RefreshCw, CheckCircle2,
  AlertCircle, AlertTriangle, Key, Building, Eye, ChevronRight, FileText,
  Download, Printer, CreditCard, IdCard, Search, Menu, Globe, Sparkles, LogOut, Home, MoreHorizontal
} from 'lucide-react';
import { 
  User as UserType, UserRole, KwartirRanting, GugusDepan, SatuanKarya,
  Anggota, Berita, Agenda, Notifikasi, PimpinanKwarcab, ProfilKwarcab, GolonganPramuka, KampungPramuka, KtaConfig, AdminPermission, SosmedLinks
} from '../types';
import { mapSvg, pramukaSvg, jabarPng } from './ktaAssets';
import SosmedFields from './SosmedFields';
import { sanitizeSosmed } from '../utils/sosmed';

// Logo resmi website (sama dengan Navbar & landing page).
const LOGO_KWARCAB = 'https://lh3.googleusercontent.com/d/1LprUBW33eBc7zyJak0e8LkBfF8F1_b-z';
const LOGO_KWARCAB_FALLBACK = '/logo-source.png';

const KWARCAB_ACCESS_OPTIONS: Array<{ id: AdminPermission; label: string; description: string }> = [
  { id: 'anggota', label: 'Kelola Anggota', description: 'Data anggota, filter, dan ekspor dasar.' },
  { id: 'kta', label: 'Kelola KTA', description: 'Cetak KTA, legalitas, dan konfigurasi tanda tangan.' },
  { id: 'kwarran', label: 'Kwartir Ranting', description: 'Tambah, ubah, dan hapus data Kwarran.' },
  { id: 'gudep', label: 'Gugus Depan', description: 'Tambah, ubah, dan hapus data pangkalan.' },
  { id: 'saka', label: 'Satuan Karya', description: 'Kelola Saka dan persetujuan anggota Saka.' },
  { id: 'kampung_pramuka', label: 'Kampung Pramuka', description: 'Kelola titik, profil, dan dokumentasi kampung.' },
  { id: 'berita', label: 'Sinergi Berita', description: 'Tulis, review, dan atur berita sorotan.' },
  { id: 'agenda', label: 'Agenda Kegiatan', description: 'Kelola kalender kegiatan Kwarcab.' },
  { id: 'config', label: 'Profil Kwarcab', description: 'Ubah profil, pimpinan, visi, misi, dan hero.' }
];

interface AdminPortalProps {
  user: UserType;
  token: string;
  onRefreshData: () => void;
  allKwarran: KwartirRanting[];
  allSaka: SatuanKarya[];
  onBackToLanding: () => void;
  onLogout?: () => void;
}

export default function AdminPortal({
  user,
  token,
  onRefreshData,
  allKwarran,
  allSaka,
  onBackToLanding,
  onLogout
}: AdminPortalProps) {
  // Navigation inside Admin Dashboard
  const [activeTab, setActiveTab] = useState<string>('overview'); // overview, anggota, kwarran, gudep, saka, berita, agenda, config, users, notif
  const [stats, setStats] = useState<any>({
    totalAnggota: 0, siaga: 0, penggalang: 0, penegak: 0, pandega: 0, dewasa: 0, pendingBerita: 0, pendingSakaApproval: 0
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewingBeritaDetail, setViewingBeritaDetail] = useState<Berita | null>(null);
  const [viewingKwarranDetail, setViewingKwarranDetail] = useState<KwartirRanting | null>(null);
  const [viewingGudepDetail, setViewingGudepDetail] = useState<GugusDepan | null>(null);
  const [viewingSakaDetail, setViewingSakaDetail] = useState<SatuanKarya | null>(null);

  // Scoped Data Lists
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filterKwarran, setFilterKwarran] = useState('all');
  const [filterGudep, setFilterGudep] = useState('all');
  const [filterGolongan, setFilterGolongan] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gudepList, setGudepList] = useState<GugusDepan[]>([]);
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [agendaList, setAgendaList] = useState<Agenda[]>([]);
  const [notifList, setNotifList] = useState<Notifikasi[]>([]);
  const [userList, setUserList] = useState<UserType[]>([]);
  const [pimpinanList, setPimpinanList] = useState<PimpinanKwarcab[]>([]);
  const [ktaConfig, setKtaConfig] = useState<KtaConfig>({ nama_ketua: '', tanda_tangan_url: '', stempel_url: '' });
  const [ktaTab, setKtaTab] = useState<'belum' | 'sudah'>('belum');
  
  // Kampung Pramuka management states
  const [kpList, setKpList] = useState<KampungPramuka[]>([]);
  const [kpNama, setKpNama] = useState('');
  const [kpKecamatan, setKpKecamatan] = useState('');
  const [kpLatitude, setKpLatitude] = useState('');
  const [kpLongitude, setKpLongitude] = useState('');
  const [kpFoto, setKpFoto] = useState('');
  const [kpSejarah, setKpSejarah] = useState('');
  const [kpKeunggulan, setKpKeunggulan] = useState('');

  // Password Change Modal (Self)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selfNewPassword, setSelfNewPassword] = useState('');
  const [selfConfirmPassword, setSelfConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [formMode, setFormMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- FORM DATA FIELDS ---
  // Anggota Form Fields
  const [angNama, setAngNama] = useState('');
  const [angTempat, setAngTempat] = useState('');
  const [angTanggal, setAngTanggal] = useState('');
  const [angGolongan, setAngGolongan] = useState<GolonganPramuka>('penegak');
  const [angTingkatan, setAngTingkatan] = useState('Bantara');
  const [angAlamat, setAngAlamat] = useState('');
  const [angPangkalan, setAngPangkalan] = useState('');
  const [angKwarranId, setAngKwarranId] = useState('');
  const [angGudepId, setAngGudepId] = useState('');
  const [angAktifSaka, setAngAktifSaka] = useState(false);
  const [angSakaIds, setAngSakaIds] = useState<string[]>([]);
  const [angFoto, setAngFoto] = useState('');

  // Drill-down Anggota Mode
  const [anggotaViewMode, setAnggotaViewMode] = useState<'rekap_kwarran' | 'list'>(
    (user.role === 'kwarcab' || user.role === 'staff_kwarcab' || user.role === 'kwarran') ? 'rekap_kwarran' : 'list'
  );
  const [selectedRekapKwarranId, setSelectedRekapKwarranId] = useState<string | null>(
    user.role === 'kwarran' ? user.ref_id : null
  );

  // Berita Form Fields
  const [berJudul, setBerJudul] = useState('');
  const [berKonten, setBerKonten] = useState('');
  const [berCover, setBerCover] = useState('');
  const [berIsFeatured, setBerIsFeatured] = useState(false);

  // Agenda Form Fields
  const [ageJudul, setAgeJudul] = useState('');
  const [ageDeskripsi, setAgeDeskripsi] = useState('');
  const [ageMulai, setAgeMulai] = useState('');
  const [ageSelesai, setAgeSelesai] = useState('');
  const [ageKategori, setAgeKategori] = useState<'mandiri' | 'partisipasi_daerah' | 'partisipasi_nasional' | 'partisipasi_internasional'>('mandiri');

  // Config Form (Visi Misi Profil)
  const [confVisi, setConfVisi] = useState('');
  const [confMisi, setConfMisi] = useState('');
  const [confSejarah, setConfSejarah] = useState('');
  const [confHeroMode, setConfHeroMode] = useState<'statis' | 'dinamis'>('dinamis');
  const [confSosmed, setConfSosmed] = useState<SosmedLinks>({});
  const [confBanner, setConfBanner] = useState('');
  const [confKetuaKwarcabNama, setConfKetuaKwarcabNama] = useState('');
  const [confKetuaKwarcabFoto, setConfKetuaKwarcabFoto] = useState('');
  const [confKetuaHarianNama, setConfKetuaHarianNama] = useState('');
  const [confKetuaHarianFoto, setConfKetuaHarianFoto] = useState('');
  const [confSekretarisNama, setConfSekretarisNama] = useState('');
  const [confSekretarisFoto, setConfSekretarisFoto] = useState('');
  const [confBendaharaNama, setConfBendaharaNama] = useState('');
  const [confBendaharaFoto, setConfBendaharaFoto] = useState('');
  const [confKetuaPusdatinNama, setConfKetuaPusdatinNama] = useState('');
  const [confKetuaPusdatinFoto, setConfKetuaPusdatinFoto] = useState('');
  const [previewKtaHtml, setPreviewKtaHtml] = useState<{ html: string, anggotaId: string } | null>(null);

  // User Form Fields
  const [uNama, setUNama] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState<UserRole>('gudep');
  const [uRefId, setURefId] = useState('');
  const [uPermissions, setUPermissions] = useState<AdminPermission[]>([]);

  // Kwarran Form Fields
  const [kwNama, setKwNama] = useState('');
  const [kwKetua, setKwKetua] = useState('');
  const [kwSekretaris, setKwSekretaris] = useState('');
  const [kwBendahara, setKwBendahara] = useState('');
  const [kwStatus, setKwStatus] = useState<'aktif' | 'non-aktif' | 'transisi'>('aktif');

  // Media sosial Kwarran (diisi admin Kwarran dari dashboard-nya sendiri)
  const [kwSosmed, setKwSosmed] = useState<SosmedLinks>({});
  const ownKwarran = user.role === 'kwarran' ? allKwarran.find(k => k.id === user.ref_id) : undefined;
  const ownKwarranSosmedKey = JSON.stringify(ownKwarran?.sosmed || {});
  useEffect(() => {
    if (ownKwarran) setKwSosmed(ownKwarran.sosmed || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownKwarran?.id, ownKwarranSosmedKey]);

  // Gudep Form Fields
  const [gdNama, setGdNama] = useState('');
  const [gdKwarran, setGdKwarran] = useState('');

  // Saka Form Fields
  const [skNama, setSkNama] = useState('');
  const [skKetua, setSkKetua] = useState('');
  const [skSekretaris, setSkSekretaris] = useState('');
  const [skBendahara, setSkBendahara] = useState('');
  const [skStatus, setSkStatus] = useState<'aktif' | 'non-aktif' | 'transisi'>('aktif');

  // Path B: Pull Mode states
  const [pullSearchTerm, setPullSearchTerm] = useState('');
  const [candidatesList, setCandidatesList] = useState<Anggota[]>([]);
  const [showPullModal, setShowPullModal] = useState(false);

  // Export Data states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilterGolongan, setExportFilterGolongan] = useState<string>('all');

  const exportToExcel = () => {
    const filtered = exportFilterGolongan === 'all' 
      ? anggotaList 
      : anggotaList.filter(a => a.golongan === exportFilterGolongan);

    if (filtered.length === 0) {
      alert('Tidak ada data anggota untuk diekspor.');
      return;
    }

    const headers = [
      'ID Anggota',
      'Nama Lengkap',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Golongan',
      'Tingkatan',
      'Alamat Asal',
      'Pangkalan / Gudep',
      'Saka Afiliasi',
      'Tanggal Terdaftar'
    ];

    const rows = filtered.map(a => {
      const sakaNames = a.saka_list && a.saka_list.length > 0
        ? a.saka_list.map((j: any) => `${j.nama_saka} (${j.status})`).join('; ')
        : 'Non-Saka';
      
      return [
        a.id,
        a.nama_lengkap,
        a.tempat_lahir,
        a.tanggal_lahir,
        a.golongan.toUpperCase(),
        a.tingkatan,
        a.alamat_asal.replace(/"/g, '""'),
        a.pangkalan.replace(/"/g, '""'),
        sakaNames,
        new Date(a.created_at).toLocaleDateString('id-ID')
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DATA_ANGGOTA_KWARCAB_TASIKMALAYA_${exportFilterGolongan.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Spreadsheet data anggota berhasil diunduh!');
  };

  const exportToPDF = () => {
    const filtered = exportFilterGolongan === 'all' 
      ? anggotaList 
      : anggotaList.filter(a => a.golongan === exportFilterGolongan);

    if (filtered.length === 0) {
      alert('Tidak ada data anggota untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak.');
      return;
    }

    const tableRows = filtered.map((a, index) => {
      const sakaNames = a.saka_list && a.saka_list.length > 0
        ? a.saka_list.map((j: any) => `${j.nama_saka} (${j.status.toUpperCase()})`).join(', ')
        : '-';
      return `
        <tr>
          <td style="text-align: center; padding: 6px; border: 1px solid #111;">${index + 1}</td>
          <td style="padding: 6px; border: 1px solid #111; font-weight: bold;">${a.nama_lengkap}</td>
          <td style="padding: 6px; border: 1px solid #111;">${a.tempat_lahir}, ${a.tanggal_lahir}</td>
          <td style="padding: 6px; border: 1px solid #111; text-transform: uppercase;">${a.golongan}</td>
          <td style="padding: 6px; border: 1px solid #111;">${a.tingkatan}</td>
          <td style="padding: 6px; border: 1px solid #111;">${a.pangkalan}</td>
          <td style="padding: 6px; border: 1px solid #111;">${a.alamat_asal}</td>
          <td style="padding: 6px; border: 1px solid #111;">${sakaNames}</td>
        </tr>
      `;
    }).join('');

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Data Anggota Pramuka - Kwarcab Tasikmalaya</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif, sans-serif;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
          }
          .kop-surat {
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 4px double #000;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .kop-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-right: 20px;
          }
          .kop-text {
            text-align: center;
          }
          .kop-text h1 {
            font-size: 18px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .kop-text h2 {
            font-size: 20px;
            margin: 2px 0 0 0;
            font-weight: 900;
            text-transform: uppercase;
            color: #000;
          }
          .kop-text p {
            font-size: 11px;
            margin: 4px 0 0 0;
            font-style: italic;
          }
          .title-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .title-container h3 {
            font-size: 16px;
            margin: 0;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .title-container p {
            font-size: 12px;
            margin: 4px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 30px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
            padding: 8px 6px;
            border: 1px solid #111;
            text-transform: uppercase;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .signature-col {
            width: 250px;
            text-align: center;
            font-size: 12px;
          }
          .signature-space {
            height: 80px;
          }
          .signature-name {
            font-weight: bold;
            text-decoration: underline;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 15mm;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 5px solid #111; padding-bottom: 5px; margin-bottom: 2px;">
          <div style="width: 100px; text-align: left;">
            <img src="/tunas.png" alt="Tunas Kelapa" style="width: 55px; height: auto;" />
          </div>
          <div style="text-align: center; flex: 1;">
            <h2 style="font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 1px; color: #222;">GERAKAN PRAMUKA</h2>
            <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 34px; font-weight: 900; margin: 2px 0; letter-spacing: -0.5px; color: #111;">KWARTIR CABANG KAB. TASIKMALAYA</h1>
            <p style="font-family: 'Times New Roman', Times, serif; font-size: 15px; font-style: italic; margin: 0; color: #111;">Jln. Dalem Wirawangsa KM 1 Tasikmalaya 46462</p>
          </div>
          <div style="width: 100px; text-align: right;">
            <img src="/wosm.png" alt="WOSM" style="width: 75px; height: auto;" />
          </div>
        </div>
        <div style="border-bottom: 1.5px solid #111; margin-bottom: 24px;"></div>

        <div class="title-container">
          <h3>Daftar Anggota Gerakan Pramuka Terdaftar</h3>
          <p>Golongan: ${exportFilterGolongan.toUpperCase()} | Dicetak pada: ${today}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 18%;">Nama Lengkap</th>
              <th style="width: 15%;">Tempat, Tanggal Lahir</th>
              <th style="width: 10%;">Golongan</th>
              <th style="width: 10%;">Tingkatan</th>
              <th style="width: 15%;">Pangkalan</th>
              <th style="width: 15%;">Alamat Asal</th>
              <th style="width: 13%;">Afiliasi Saka</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-col">
            <p>Mengetahui,</p>
            <p style="font-weight: bold; text-transform: uppercase;">Kwartir Ranting / Gugus Depan</p>
            <div class="signature-space"></div>
            <p class="signature-name">......................................................</p>
            <p>NTA / NIP</p>
          </div>
          <div class="signature-col">
            <p>Tasikmalaya, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="font-weight: bold;">Sekretariat Kwartir Cabang</p>
            <div class="signature-space"></div>
            <p class="signature-name">${confSekretarisNama || 'Sekretaris Kwarcab'}</p>
            <p>Sekretaris Kwartir Cabang</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportToKTA = async (singleAnggota: Anggota) => {
    // Ambil background sebagai base64 agar pasti ter-load di popup about:blank
    let ktaBgDataUrl = '';
    let ktaBackDataUrl = '';
    try {
      const response = await fetch('/kta-bg.png');
      const blob = await response.blob();
      ktaBgDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const responseBack = await fetch('/kta-back.png');
      if (responseBack.ok) {
        const blobBack = await responseBack.blob();
        ktaBackDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blobBack);
        });
      }
    } catch (e) {
      console.error('Gagal mengambil background KTA', e);
      ktaBgDataUrl = ''; 
      ktaBackDataUrl = '';
    }

    const a = singleAnggota;
    const fotoSrc = a.foto || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
    const mockNta = "09.01." + a.id.replace('ang_', '').padStart(5, '0');

    const htmlContent = `
      <html>
        <head>
          <title>Preview KTA - ${a.nama_lengkap}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@500;700;900&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            
            @page {
              size: 85.6mm 53.98mm; /* Ukuran pas KTP */
              margin: 0;
            }
            
            body {
              font-family: 'Inter', sans-serif; margin: 0; padding: 20px;
              display: flex; flex-direction: column; align-items: center; gap: 20px;
              background-color: #555;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            
            .kta-card {
              width: 85.6mm; height: 53.98mm;
              background-size: 100% 100%; background-position: center; background-repeat: no-repeat;
              border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              position: relative; overflow: hidden; box-sizing: border-box; background-color: white;
            }
            
            .kta-front {
              background-image: url('${ktaBgDataUrl}');
              page-break-after: always;
              break-after: page;
            }
            
            .kta-back {
              background-image: url('${ktaBackDataUrl}');
            }
            
            /* Photo Area */
            .photo {
              position: absolute; left: 5mm; top: 21mm;
              width: 19.5mm; height: 26mm;
              background-color: #e0e0e0; border-radius: 4px; overflow: hidden;
              border: 1px solid #999; z-index: 5;
            }
            .photo img { width: 100%; height: 100%; object-fit: cover; }
            
            /* Data Diri */
            .data-diri {
              position: absolute; left: 27mm; top: 22mm; z-index: 5;
            }
            .nama { font-size: 12px; font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 2px; }
            .gol { font-size: 10px; font-weight: 700; color: #222; text-transform: uppercase; margin-bottom: 2px; }
            .nta { font-size: 10px; font-weight: 700; color: #222; }
            
            /* QR Code */
            .qr-box {
              position: absolute; right: 5mm; top: 23mm;
              width: 12mm; height: 12mm; z-index: 5;
            }
            .qr-box img { width: 100%; height: 100%; }
            
            /* Footer Area */
            .pangkalan { position: absolute; left: 27mm; bottom: 8.5mm; font-size: 7.5px; font-weight: 600; color: #333; z-index: 5; text-transform: uppercase; max-width: 35mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .berlaku { 
              position: absolute; left: 5mm; bottom: 3mm; 
              font-size: 6.5px; font-weight: 700; color: #000;
              border: 1.5px solid #000; border-radius: 4px; padding: 2px 4px;
              background-color: white; z-index: 5;
            }
            
            .ttd-box { position: absolute; right: 3mm; bottom: 2mm; width: 35mm; text-align: center; z-index: 5; }
            .ttd-date { font-size: 6px; color: #111; }
            .ttd-title { font-size: 6px; color: #111; line-height: 1.2; margin-bottom: 8mm; }
            .ttd-name { font-size: 6px; font-weight: 800; text-decoration: underline; color: #000; margin-top: -1mm; position: relative; z-index: 10; }
            
            .stempel { position: absolute; left: 0mm; bottom: 3.5mm; width: 18mm; height: 18mm; opacity: 0.6; z-index: 4; }
            .signature { position: absolute; right: 2mm; bottom: 4mm; width: 16mm; height: 6mm; z-index: 6; }
            
            .action-bar {
              margin-bottom: 10px;
              display: flex;
              gap: 10px;
            }
            
            .btn-print {
              padding: 10px 20px; font-size: 14px; font-weight: bold;
              background-color: #007bff; color: white; border: none; border-radius: 4px;
              cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .btn-print:hover { background-color: #0056b3; }
            
            @media print { 
              body { background-color: transparent; padding: 0; } 
              .kta-card { box-shadow: none; border: none; border-radius: 0; } 
              .action-bar { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <button class="btn-print" onclick="window.print()">Cetak KTA (PDF / Printer)</button>
          </div>
          
          <!-- Halaman Depan -->
          <div class="kta-card kta-front">
            <div class="photo"><img src="${fotoSrc}" alt="Foto" /></div>
            
            <div class="data-diri">
              <div class="nama">${a.nama_lengkap}</div>
              <div class="gol">${a.golongan}</div>
              <div class="nta">${mockNta}</div>
            </div>
            
            <div class="qr-box"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/validasi-kta/' + a.id)}" alt="QR" /></div>
            
            <div class="pangkalan">${a.pangkalan || 'PANGKALAN'}</div>
            
            <div class="berlaku">Berlaku s.d. Akhir Masa Golongan</div>
            
            <div class="ttd-box">
              <div class="ttd-date">Tasikmalaya, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
              <div class="ttd-title">Kwartir Cabang Kab. Tasikmalaya<br>Ketua,</div>
              <div class="ttd-name">${ktaConfig.nama_ketua || ''}</div>
              
              ${ktaConfig.stempel_url 
                ? `<img class="stempel" src="${ktaConfig.stempel_url}" alt="Stempel" style="object-fit: contain;" />` 
                : ``
              }
              
              ${ktaConfig.tanda_tangan_url 
                ? `<img class="signature" src="${ktaConfig.tanda_tangan_url}" alt="Tanda Tangan" style="object-fit: contain;" />` 
                : ``
              }
            </div>
          </div>
          
          <!-- Halaman Belakang -->
          <div class="kta-card kta-back"></div>
        </body>
      </html>
    `;

    setPreviewKtaHtml({ html: htmlContent, anggotaId: a.id });

    try {
      await fetch(`/api/admin/anggota/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...a, is_kta_printed: true })
      });
      setAnggotaList(prev => prev.map(ang => ang.id === a.id ? { ...ang, is_kta_printed: true } : ang));
      await loadDashboardData(); 
    } catch (err) {
      console.error('Gagal update status KTA', err);
    }
  };

  const exportToSuratLegalitas = (singleAnggota?: Anggota) => {
    if (!canManage('kta')) {
      alert('Maaf, Surat Keterangan Legalitas hanya dapat diterbitkan oleh Kwartir Cabang (Kwarcab).');
      return;
    }

    const filtered = singleAnggota
      ? [singleAnggota]
      : (exportFilterGolongan === 'all' 
          ? anggotaList 
          : anggotaList.filter(a => a.golongan === exportFilterGolongan));

    if (filtered.length === 0) {
      alert('Tidak ada data anggota untuk mencetak surat legalitas.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak surat keterangan.');
      return;
    }

    const getIndonesianDate = () => {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const d = new Date();
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const currentIndoDate = getIndonesianDate();
    const currentYear = new Date().getFullYear();

    const suratHtml = filtered.map((a, idx) => {
      const uniqueRegNo = `REG-${a.golongan.substring(0,3).toUpperCase()}-${a.id.substring(0, 8).toUpperCase()}`;
      const kwObj = allKwarran.find(k => k.id === a.kwartir_ranting_id);
      const kwarranNama = kwObj ? `Kwarran ${kwObj.nama_kecamatan}` : 'Tidak Diketahui';
      
      // Verification Link
      const verificationUrl = `${window.location.origin}?verify=${a.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

      return `
        <div class="skl-page" style="${idx > 0 ? 'page-break-before: always;' : ''}">
          <!-- Letterhead (KOP SURAT) -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 5px solid #111; padding-bottom: 5px; margin-bottom: 2px;">
            <div style="width: 100px; text-align: left;">
              <img src="/tunas.png" alt="Tunas Kelapa" style="width: 55px; height: auto;" />
            </div>
            <div style="text-align: center; flex: 1;">
              <h2 style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; margin: 0; letter-spacing: 1px; color: #222;">GERAKAN PRAMUKA</h2>
              <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 32px; font-weight: 900; margin: 2px 0; letter-spacing: -0.5px; color: #111;">KWARTIR CABANG KAB. TASIKMALAYA</h1>
              <p style="font-family: 'Times New Roman', Times, serif; font-size: 14px; font-style: italic; margin: 0; color: #111;">Jln. Dalem Wirawangsa KM 1 Tasikmalaya 46462</p>
            </div>
            <div style="width: 100px; text-align: right;">
              <img src="/wosm.png" alt="WOSM" style="width: 75px; height: auto;" />
            </div>
          </div>
          <div style="border-bottom: 1.5px solid #111; margin-bottom: 24px;"></div>

          <!-- Title -->
          <div class="surat-title">
            <h2>SURAT KETERANGAN LEGALITAS ANGGOTA AKTIF</h2>
            <p>Nomor: Pusdatin-KC/SKL/${a.id.substring(0, 6).toUpperCase()}/${currentYear}</p>
          </div>

          <!-- Body intro -->
          <div class="surat-body">
            <p class="intro-text">
              Kepala Pusat Data dan Informasi (Pusdatin) Kwartir Cabang Gerakan Pramuka Kabupaten Tasikmalaya, Jawa Barat, menerangkan dan mengabsahkan dengan sesungguhnya bahwa:
            </p>

            <!-- Member details table -->
            <table class="detail-table">
              <tr>
                <td class="label-col">Nama Lengkap</td>
                <td class="separator">:</td>
                <td class="val-col font-bold text-uppercase">${a.nama_lengkap.toUpperCase()}</td>
              </tr>
              <tr>
                <td class="label-col">Nomor Registrasi Anggota</td>
                <td class="separator">:</td>
                <td class="val-col font-mono font-bold font-amber">${uniqueRegNo}</td>
              </tr>
              <tr>
                <td class="label-col">Golongan / Tingkatan</td>
                <td class="separator">:</td>
                <td class="val-col text-uppercase font-medium">${a.golongan} / ${a.tingkatan}</td>
              </tr>
              <tr>
                <td class="label-col">Tempat / Tanggal Lahir</td>
                <td class="separator">:</td>
                <td class="val-col">${a.tempat_lahir}, ${a.tanggal_lahir}</td>
              </tr>
              <tr>
                <td class="label-col">Pangkalan (Gugus Depan)</td>
                <td class="separator">:</td>
                <td class="val-col font-medium">${a.pangkalan}</td>
              </tr>
              <tr>
                <td class="label-col">Kwartir Ranting (Kwarran)</td>
                <td class="separator">:</td>
                <td class="val-col">${kwarranNama}</td>
              </tr>
              <tr>
                <td class="label-col">Status Keanggotaan</td>
                <td class="separator">:</td>
                <td class="val-col"><span class="badge-aktif">AKTIF & RECORDED</span></td>
              </tr>
            </table>

            <p class="declaration-text">
              Nama di atas dinyatakan <strong>BENAR</strong> tercatat secara sah dan aktif sebagai anggota Gerakan Pramuka di bawah naungan Kwartir Cabang Kabupaten Tasikmalaya, serta telah terdaftar secara resmi di dalam sistem basis data terpadu <strong>Pusdatin Kwarcab Tasikmalaya</strong>.
            </p>
            <p class="declaration-text">
              Surat Keterangan Legalitas ini dikeluarkan secara resmi melalui sistem untuk dipergunakan sebagai bukti keabsahan keanggotaan dan pemenuhan administrasi kepramukaan yang sah.
            </p>
          </div>

          <!-- Bottom Footer Area -->
          <div class="surat-footer">
            <div class="footer-qr">
              <div class="qr-box">
                <img src="${qrCodeUrl}" alt="QR Validation" />
              </div>
              <div class="qr-caption">
                <strong>VERIFIKASI DIGITAL</strong>
                <p>Pindai QR Code di atas menggunakan smartphone untuk memvalidasi legalitas surat ini secara langsung dari sistem Pusdatin Kwarcab.</p>
              </div>
            </div>

            <div class="footer-signature">
              <p class="sig-date">Tasikmalaya, ${currentIndoDate}</p>
              <p class="sig-dept">Kwartir Cabang Kabupaten Tasikmalaya</p>
              <p class="sig-title">Kepala Pusdatin,</p>
              
              <div class="stamp-container">
                <div class="official-stamp">
                  <div class="stamp-inner">
                    <span>PUSDATIN</span>
                    <span>KWARCAB</span>
                    <span>TASIKMALAYA</span>
                  </div>
                </div>
                <div class="sig-line"></div>
              </div>
              
              <p class="sig-name">${confKetuaPusdatinNama || 'Pusdatin Kwarcab Tasikmalaya'}</p>
              <p class="sig-nip">ID Pusdatin: 32.06-PUSD-2026</p>
            </div>
          </div>
          
          <div class="surat-bottom-decor font-mono">
            SATYAKU KUDARMAKAN, DARMAKU KUBAKTIKAN - PUSDATIN KWARCAB TASIKMALAYA
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Keterangan Legalitas Anggota - Pusdatin Kwarcab Tasikmalaya</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
          
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 40px;
          }

          .skl-page {
            box-sizing: border-box;
            width: 210mm;
            height: 297mm;
            padding: 20mm 15mm;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #1f2937;
            overflow: hidden;
          }

          /* Kop Surat Styles */
          .kop-surat {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            position: relative;
            z-index: 10;
          }

          .kop-logo-left img {
            width: 24mm;
            height: 24mm;
            object-fit: contain;
          }

          .kop-logo-right img {
            width: 23mm;
            height: 23mm;
            object-fit: contain;
          }

          .kop-text {
            text-align: center;
            flex-grow: 1;
          }

          .kop-text h2 {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #4b5563;
          }

          .kop-text h1 {
            margin: 4px 0 0 0;
            font-size: 18px;
            font-weight: 900;
            color: #7c3aed;
            letter-spacing: 0.2px;
          }

          .kop-text h3 {
            margin: 4px 0 0 0;
            font-size: 13px;
            font-weight: 800;
            color: #D4AF37;
            letter-spacing: 1px;
          }

          .kop-text p {
            margin: 6px 0 0 0;
            font-size: 10px;
            color: #6b7280;
            line-height: 1.4;
          }

          .kop-divider {
            height: 3px;
            border-top: 2.5px solid #1f2937;
            border-bottom: 0.5px solid #1f2937;
            margin-top: 12px;
            margin-bottom: 24px;
            position: relative;
            z-index: 10;
          }

          /* Title area */
          .surat-title {
            text-align: center;
            margin-bottom: 24px;
            position: relative;
            z-index: 10;
          }

          .surat-title h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 900;
            color: #111827;
            letter-spacing: 0.5px;
            text-decoration: underline;
            text-underline-offset: 4px;
          }

          .surat-title p {
            margin: 6px 0 0 0;
            font-size: 12px;
            font-weight: 600;
            color: #4b5563;
            font-family: 'JetBrains Mono', monospace;
          }

          /* Body structure */
          .surat-body {
            flex-grow: 1;
            padding: 0 10mm;
            position: relative;
            z-index: 10;
          }

          .intro-text {
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #374151;
            text-align: justify;
          }

          /* Table detail styling */
          .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            background-color: #faf5ff;
            border: 1px solid #e9d5ff;
            border-radius: 8px;
            overflow: hidden;
          }

          .detail-table tr {
            border-bottom: 1px solid #f3e8ff;
          }

          .detail-table tr:last-child {
            border-bottom: none;
          }

          .detail-table td {
            padding: 12px 16px;
            font-size: 13px;
            color: #374151;
          }

          .label-col {
            width: 33%;
            font-weight: 600;
            color: #5b21b6;
          }

          .separator {
            width: 2%;
            font-weight: bold;
            color: #7c3aed;
          }

          .val-col {
            width: 65%;
            color: #111827;
          }

          .font-bold {
            font-weight: 700 !important;
          }

          .font-medium {
            font-weight: 600 !important;
          }

          .font-mono {
            font-family: 'JetBrains Mono', monospace;
          }

          .text-uppercase {
            text-transform: uppercase;
          }

          .font-amber {
            color: #b45309 !important;
          }

          .badge-aktif {
            display: inline-block;
            background-color: #d1fae5;
            color: #065f46;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 900;
            font-size: 11px;
            letter-spacing: 0.5px;
            border: 1px solid #10b981;
          }

          .declaration-text {
            font-size: 13px;
            line-height: 1.7;
            margin-top: 16px;
            color: #374151;
            text-align: justify;
          }

          /* Footer styling */
          .surat-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 30px;
            padding: 0 10mm;
            position: relative;
            z-index: 10;
          }

          .footer-qr {
            width: 50%;
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .qr-box {
            width: 32mm;
            height: 32mm;
            border: 2px solid #D4AF37;
            padding: 2px;
            background-color: #fff;
            border-radius: 6px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          }

          .qr-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .qr-caption {
            flex-grow: 1;
          }

          .qr-caption strong {
            display: block;
            font-size: 11px;
            color: #7c3aed;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .qr-caption p {
            margin: 0;
            font-size: 9px;
            color: #6b7280;
            line-height: 1.4;
          }

          /* Signature block */
          .footer-signature {
            width: 45%;
            text-align: left;
            padding-left: 20px;
            position: relative;
          }

          .sig-date {
            font-size: 12px;
            color: #374151;
            margin: 0 0 4px 0;
          }

          .sig-dept {
            font-size: 11px;
            font-weight: 700;
            color: #4b5563;
            margin: 0;
            line-height: 1.3;
          }

          .sig-title {
            font-size: 12px;
            font-weight: 800;
            color: #7c3aed;
            margin: 2px 0 0 0;
          }

          .stamp-container {
            height: 22mm;
            position: relative;
            display: flex;
            align-items: center;
          }

          .official-stamp {
            position: absolute;
            left: -15px;
            top: -10px;
            width: 25mm;
            height: 25mm;
            border-radius: 50%;
            border: 2px dashed rgba(212, 175, 55, 0.45);
            background-color: rgba(212, 175, 55, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-15deg);
            z-index: 5;
          }

          .stamp-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 1.1;
          }

          .stamp-inner span {
            font-size: 6px;
            font-weight: 900;
            color: rgba(212, 175, 55, 0.7);
            letter-spacing: 0.5px;
          }

          .sig-line {
            width: 100%;
            height: 1px;
            background-color: transparent;
          }

          .sig-name {
            font-size: 13px;
            font-weight: 900;
            color: #111827;
            text-decoration: underline;
            margin: 4px 0 0 0;
          }

          .sig-nip {
            font-size: 10px;
            color: #6b7280;
            margin: 2px 0 0 0;
            font-family: 'JetBrains Mono', monospace;
          }

          .surat-bottom-decor {
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            letter-spacing: 1px;
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 24px;
            position: relative;
            z-index: 10;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }

            body {
              background-color: #ffffff;
              padding: 0;
              margin: 0;
            }

            .skl-page {
              box-shadow: none;
              padding: 20mm 15mm;
              page-break-inside: avoid;
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        ${suratHtml}
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Mapping Golongan to Tingkatan (Modul 3.2 mapping)
  const TINGKATAN_MAP: Record<GolonganPramuka, string[]> = {
    siaga: ['Mula', 'Bantu', 'Tata'],
    penggalang: ['Ramu', 'Rakit', 'Terap'],
    penegak: ['Bantara', 'Laksana'],
    pandega: ['Pandega'],
    dewasa: ['Pembina Mahir Dasar (KMD)', 'Pembina Mahir Lanjutan (KML)', 'Pelatih Dasar', 'Pelatih Lanjutan']
  };

  useEffect(() => {
    // Reset tingkatan when golongan changes
    if (TINGKATAN_MAP[angGolongan]) {
      setAngTingkatan(TINGKATAN_MAP[angGolongan][0]);
    }
  }, [angGolongan]);

  // Load Dashboard Stats & scoped lists
  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Stats
      const statRes = await fetch('/api/admin/stats', { headers });
      const statData = await statRes.json();
      setStats(statData);

      // Anggota Scoped
      const angRes = await fetch('/api/admin/anggota', { headers });
      const angData = await angRes.json();
      setAnggotaList(angData);

      // Gudep Scoped
      const gdRes = await fetch('/api/admin/gudep', { headers });
      const gdData = await gdRes.json();
      setGudepList(gdData);

      // Berita Scoped
      const berRes = await fetch('/api/admin/berita', { headers });
      const berData = await berRes.json();
      setBeritaList(berData);

      // Agenda Scoped
      const ageRes = await fetch('/api/admin/agenda', { headers });
      const ageData = await ageRes.json();
      setAgendaList(ageData);

      // Notifikasi Scoped
      const notRes = await fetch('/api/admin/notifikasi', { headers });
      const notData = await notRes.json();
      setNotifList(notData);

      // Superadmin and Kwarran account management
      if (isKwarcabAdmin || user.role === 'kwarran') {
        const uRes = await fetch('/api/admin/users', { headers });
        const uData = await uRes.json();
        if (Array.isArray(uData)) {
          setUserList(uData);
        } else {
          setUserList([]);
        }
      }

      if (canManage('config')) {
        const profRes = await fetch('/api/public/profil');
        const profData = await profRes.json();
        setConfVisi(profData.visi);
        setConfMisi(profData.misi);
        setConfSejarah(profData.sejarah);
        setConfHeroMode(profData.hero_mode);
        setConfBanner(profData.banner_statis_url);
        setConfSosmed(profData.sosmed || {});
        setConfKetuaKwarcabNama(profData.ketua_kwarcab_nama || '');
        setConfKetuaKwarcabFoto(profData.ketua_kwarcab_foto || '');
        setConfKetuaHarianNama(profData.ketua_harian_nama || '');
        setConfKetuaHarianFoto(profData.ketua_harian_foto || '');
        setConfSekretarisNama(profData.sekretaris_nama || '');
        setConfSekretarisFoto(profData.sekretaris_foto || '');
        setConfBendaharaNama(profData.bendahara_nama || '');
        setConfBendaharaFoto(profData.bendahara_foto || '');
        setConfKetuaPusdatinNama(profData.ketua_pusdatin_nama || '');
        setConfKetuaPusdatinFoto(profData.ketua_pusdatin_foto || '');

        const pimRes = await fetch('/api/public/pimpinan');
        const pimData = await pimRes.json();
        setPimpinanList(pimData);
      }

      if (canManage('kampung_pramuka')) {
        const kpRes = await fetch('/api/admin/kampung-pramuka', { headers });
        const kpData = await kpRes.json();
        setKpList(kpData);
      }

      if (canManage('kta')) {
        const ktaCfgRes = await fetch('/api/admin/kta-config', { headers });
        if (ktaCfgRes.ok) {
          setKtaConfig(await ktaCfgRes.json());
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal memuat data dari server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, user.id, token]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  type CompressionOptions = {
    maxDimension?: number;
    quality?: number;
    filenamePrefix?: string;
    successMessage?: string;
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('File gambar tidak valid'));
      img.src = src;
    });
  };

  const compressImageFile = async (file: File, options: CompressionOptions = {}) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('File harus berupa gambar');
    }

    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const maxDimension = options.maxDimension ?? 1000;
    const quality = options.quality ?? 0.48;
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let contentType = 'image/webp';
    let compressedDataUrl = canvas.toDataURL(contentType, quality);
    if (!compressedDataUrl.startsWith('data:image/webp')) {
      contentType = 'image/jpeg';
      compressedDataUrl = canvas.toDataURL(contentType, quality);
    }

    const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
    const originalName = file.name.replace(/\.[^.]+$/, '');
    return {
      base64Data: compressedDataUrl.split(',')[1],
      contentType,
      filename: `${options.filenamePrefix || ''}${originalName}.${extension}`
    };
  };

  const uploadCompressedImage = async (
    file: File,
    callback: (url: string) => void,
    options: CompressionOptions = {}
  ) => {
    const compressed = await compressImageFile(file, options);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...compressed, compressed: true })
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Unggah gagal');
    }
    callback(data.url);
    showSuccess(options.successMessage || 'Gambar berhasil dikompresi maksimal dan diunggah!');
  };

  const handleBase64Upload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void,
    options: CompressionOptions = {}
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCompressedImage(file, callback, options);
    } catch (err: any) {
      setErrorMsg('Error upload: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleCompressedUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    await handleBase64Upload(e, callback, {
      maxDimension: 420,
      quality: 0.42,
      filenamePrefix: 'kta_',
      successMessage: 'Foto profil berhasil dikompresi maksimal dan diunggah!'
    });
  };

  // --- ACTIONS: ANGGOTA CRUD ---
  const handleSaveAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Set appropriate kwarran and gudep based on role
    let kwId = angKwarranId;
    let gdId = angGudepId;
    if (user.role === 'kwarran') {
      kwId = user.ref_id!;
    } else if (user.role === 'gudep') {
      const parentGudep = gudepList.find(x => x.id === user.ref_id);
      kwId = parentGudep ? parentGudep.kwartir_ranting_id : '';
      gdId = user.ref_id!;
    }

    const payload = {
      nama_lengkap: angNama,
      tempat_lahir: angTempat,
      tanggal_lahir: angTanggal,
      golongan: angGolongan,
      tingkatan: angTingkatan,
      alamat_asal: angAlamat,
      pangkalan: angPangkalan,
      kwartir_ranting_id: kwId,
      gudep_id: gdId,
      foto: angFoto,
      aktif_saka: angAktifSaka,
      saka_ids: angAktifSaka ? angSakaIds : [],
    };

    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/anggota' : `/api/admin/anggota/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');

      showSuccess(formMode === 'add' ? 'Anggota berhasil ditambahkan!' : 'Data anggota berhasil diperbarui!');
      setFormMode('list');
      loadDashboardData();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteAnggota = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) return;
    try {
      const res = await fetch(`/api/admin/anggota/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess('Anggota berhasil dihapus');
        loadDashboardData();
        onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- PATH A: SAKA persetujuan ---
  const handleReviewSakaJunction = async (juncId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/saka/approve-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ junction_id: juncId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showSuccess(`Keanggotaan Saka berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}`);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- PATH B: SAKA direct pull ---
  const handleOpenPullModal = async () => {
    setShowPullModal(true);
    setLoading(true);
    try {
      // Fetch penegak and pandega se-kabupaten
      const res = await fetch('/api/admin/anggota?searchMode=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCandidatesList(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePullMember = async (angId: string) => {
    try {
      const res = await fetch('/api/admin/saka/pull-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ anggota_id: angId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showSuccess(data.message);
      setShowPullModal(false);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: BERITA CRUD & REVIEW ---
  const handleSaveBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/berita' : `/api/admin/berita/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          judul: berJudul,
          konten: berKonten,
          gambar_cover: berCover,
          is_featured: berIsFeatured
        })
      });
      if (res.ok) {
        showSuccess(canManage('berita') ? 'Berita berhasil dipublish!' : 'Pengajuan berita berhasil dikirim, menunggu peninjauan Kwarcab.');
        setFormMode('list');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReviewBerita = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/berita/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, is_featured: true })
      });
      if (res.ok) {
        showSuccess(`Status berita berhasil diubah ke ${action === 'approve' ? 'Disetujui & Unggulan' : 'Ditolak'}`);
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteBerita = async (id: string) => {
    if (!window.confirm('Yakin hapus berita?')) return;
    try {
      const res = await fetch(`/api/admin/berita/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess('Berita berhasil dihapus');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleFeaturedBerita = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/berita/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: !currentFeatured })
      });
      if (res.ok) {
        showSuccess(`Status Hero Landing Page berita berhasil ${!currentFeatured ? 'diaktifkan' : 'dinonaktifkan'}`);
        loadDashboardData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal mengubah status Hero');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: AGENDA CRUD ---
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/agenda' : `/api/admin/agenda/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          judul: ageJudul,
          deskripsi: ageDeskripsi,
          tanggal_mulai: ageMulai,
          tanggal_selesai: ageSelesai,
          kategori: ageKategori
        })
      });
      if (res.ok) {
        showSuccess('Agenda kegiatan berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!window.confirm('Yakin hapus agenda?')) return;
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess('Agenda berhasil dihapus');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: CONFIG / PROFIL (KWARCAB) ---
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/profil-kwarcab', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visi: confVisi,
          misi: confMisi,
          sejarah: confSejarah,
          hero_mode: confHeroMode,
          banner_statis_url: confBanner,
          sosmed: confSosmed,
          ketua_kwarcab_nama: confKetuaKwarcabNama,
          ketua_kwarcab_foto: confKetuaKwarcabFoto,
          ketua_harian_nama: confKetuaHarianNama,
          ketua_harian_foto: confKetuaHarianFoto,
          sekretaris_nama: confSekretarisNama,
          sekretaris_foto: confSekretarisFoto,
          bendahara_nama: confBendaharaNama,
          bendahara_foto: confBendaharaFoto,
          ketua_pusdatin_nama: confKetuaPusdatinNama,
          ketua_pusdatin_foto: confKetuaPusdatinFoto
        })
      });
      if (res.ok) {
        setConfSosmed(sanitizeSosmed(confSosmed));
        showSuccess('Konfigurasi Profil Kwarcab berhasil disimpan!');
        onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: USER ACCOUNTS (KWARCAB) ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uRole === 'staff_kwarcab' && uPermissions.length === 0) {
      setErrorMsg('Pilih minimal satu akses pengelolaan untuk Staf Admin Kwarcab.');
      return;
    }
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/users' : `/api/admin/users/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama: uNama,
          email: uEmail,
          password: uPassword,
          role: uRole,
          ref_id: uRole === 'staff_kwarcab' ? null : (uRefId || null),
          permissions: uRole === 'staff_kwarcab' ? uPermissions : []
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan akun user');
      }
      if (res.ok) {
        showSuccess('Akun user berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user.id) {
      setErrorMsg('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }
    if (!window.confirm('Yakin hapus akun user ini?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess('Akun berhasil dihapus');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSelfChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selfNewPassword !== selfConfirmPassword) {
      showError('Konfirmasi password tidak cocok');
      return;
    }
    if (selfNewPassword.length < 6) {
      showError('Password minimal 6 karakter');
      return;
    }
    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: selfNewPassword })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal mengubah password');
      }
      showSuccess('Password berhasil diubah!');
      setIsChangePasswordOpen(false);
      setSelfNewPassword('');
      setSelfConfirmPassword('');
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- ACTIONS: KAMPUNG PRAMUKA CRUD (KWARCAB) ---
  const handleSaveKampungPramuka = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/kampung-pramuka' : `/api/admin/kampung-pramuka/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama: kpNama,
          kecamatan: kpKecamatan,
          latitude: Number(kpLatitude),
          longitude: Number(kpLongitude),
          foto: kpFoto,
          sejarah: kpSejarah,
          keunggulan: kpKeunggulan
        })
      });
      if (res.ok) {
        showSuccess('Kampung Pramuka berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal menyimpan Kampung Pramuka');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteKampungPramuka = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus Kampung Pramuka ini?')) return;
    try {
      const res = await fetch(`/api/admin/kampung-pramuka/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess('Kampung Pramuka berhasil dihapus');
        loadDashboardData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal menghapus Kampung Pramuka');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: KWARRAN CRUD (KWARCAB) ---
  const handleSaveKwarran = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/kwarran' : `/api/admin/kwarran/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_kecamatan: kwNama,
          ketua: kwKetua,
          sekretaris: kwSekretaris,
          bendahara: kwBendahara,
          status: kwStatus
        })
      });
      if (res.ok) {
        showSuccess('Kwartir Ranting berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
        onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: MEDIA SOSIAL KWARRAN (ADMIN KWARRAN) ---
  const handleSaveKwarranSosmed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.ref_id) return;
    try {
      const res = await fetch(`/api/admin/kwarran/${user.ref_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sosmed: kwSosmed })
      });
      if (res.ok) {
        setKwSosmed(sanitizeSosmed(kwSosmed));
        showSuccess('Link media sosial Kwarran berhasil disimpan!');
        onRefreshData();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Gagal menyimpan media sosial Kwarran');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: GUDEP CRUD (KWARCAB/KWARRAN) ---
  const handleSaveGudep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/gudep' : `/api/admin/gudep/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_pangkalan: gdNama,
          kwartir_ranting_id: gdKwarran
        })
      });
      if (res.ok) {
        showSuccess('Gugus Depan berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS: SAKA CRUD (KWARCAB) ---
  const handleSaveSaka = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formMode === 'add' ? 'POST' : 'PUT';
      const url = formMode === 'add' ? '/api/admin/saka' : `/api/admin/saka/${selectedItem.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_saka: skNama,
          ketua: skKetua,
          sekretaris: skSekretaris,
          bendahara: skBendahara,
          status: skStatus
        })
      });
      if (res.ok) {
        showSuccess('Satuan Karya berhasil disimpan!');
        setFormMode('list');
        loadDashboardData();
        onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- READ NOTIF ---
  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifikasi/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (e) {}
  };


  // Helpers
  const isKwarcabAdmin = user.role === 'kwarcab';
  const isKwarcabStaff = user.role === 'staff_kwarcab';
  const userPermissions = user.permissions || [];
  const canManage = (permission: AdminPermission) => {
    return isKwarcabAdmin || (isKwarcabStaff && userPermissions.includes(permission));
  };
  const hasAnyStaffAccess = isKwarcabAdmin || userPermissions.length > 0;
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'kwarcab': return 'Superadmin Kwarcab';
      case 'staff_kwarcab': return 'Staf Admin Kwarcab';
      case 'kwarran': return 'Admin Kwarran';
      case 'gudep': return 'Admin Gudep';
      case 'saka': return 'Pamong Saka';
      default: return role;
    }
  };
  const getPermissionLabel = (permission: AdminPermission) => {
    return KWARCAB_ACCESS_OPTIONS.find(option => option.id === permission)?.label || permission;
  };
  const adminMenuItems = [
    { id: 'overview', label: 'Ringkasan Ikhtisar', icon: Compass, roles: ['kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka'] as UserRole[] },
    { id: 'anggota', label: 'Kelola Anggota', icon: Users, roles: ['kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka'] as UserRole[], permission: 'anggota' as AdminPermission },
    { id: 'kta', label: 'Kelola KTA', icon: IdCard, roles: ['kwarcab', 'staff_kwarcab'] as UserRole[], permission: 'kta' as AdminPermission },
    { id: 'kwarran', label: 'Kwartir Ranting', icon: MapPin, roles: ['kwarcab', 'staff_kwarcab', 'kwarran'] as UserRole[], permission: 'kwarran' as AdminPermission },
    { id: 'kwarran_sosmed', label: 'Media Sosial Kwarran', icon: Globe, roles: ['kwarran'] as UserRole[] },
    { id: 'gudep', label: 'Gugus Depan', icon: Building, roles: ['kwarcab', 'staff_kwarcab', 'kwarran'] as UserRole[], permission: 'gudep' as AdminPermission },
    { id: 'saka', label: 'Satuan Karya (Saka)', icon: Award, roles: ['kwarcab', 'staff_kwarcab'] as UserRole[], permission: 'saka' as AdminPermission },
    { id: 'kampung_pramuka', label: 'Kampung Pramuka', icon: Globe, roles: ['kwarcab', 'staff_kwarcab'] as UserRole[], permission: 'kampung_pramuka' as AdminPermission },
    { id: 'berita', label: 'Sinergi Berita', icon: Shield, roles: ['kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka'] as UserRole[], permission: 'berita' as AdminPermission },
    { id: 'agenda', label: 'Agenda Kegiatan', icon: Calendar, roles: ['kwarcab', 'staff_kwarcab', 'kwarran', 'saka'] as UserRole[], permission: 'agenda' as AdminPermission },
    { id: 'config', label: 'Profil Kwarcab', icon: BookOpen, roles: ['kwarcab', 'staff_kwarcab'] as UserRole[], permission: 'config' as AdminPermission },
    { id: 'users', label: 'Akun Pengguna', icon: Key, roles: ['kwarcab', 'kwarran'] as UserRole[] },
    { id: 'notif', label: 'Notifikasi', icon: Bell, badge: notifList.filter(n => !n.is_read).length, roles: ['kwarcab', 'staff_kwarcab', 'kwarran', 'gudep', 'saka'] as UserRole[] },
  ];
  const visibleMenuItems = adminMenuItems.filter(item => {
    if (!item.roles.includes(user.role)) return false;
    if (item.id === 'overview') return !isKwarcabStaff || hasAnyStaffAccess;
    if (item.permission && isKwarcabStaff) return canManage(item.permission);
    return true;
  });

  // --- Agenda Mendatang di Ringkasan (real dari database, bukan data contoh) ---
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const AGENDA_KATEGORI: Record<string, { label: string; color: string }> = {
    mandiri: { label: 'Mandiri', color: 'bg-green-600' },
    partisipasi_daerah: { label: 'Partisipasi Daerah', color: 'bg-blue-600' },
    partisipasi_nasional: { label: 'Partisipasi Nasional', color: 'bg-amber-500' },
    partisipasi_internasional: { label: 'Partisipasi Internasional', color: 'bg-purple-600' },
  };
  const parseYmd = (value?: string) => {
    const [y, m, d] = (value || '').slice(0, 10).split('-').map(Number);
    return { y, m, d, valid: Boolean(y && m && d) };
  };
  const formatTanggalSingkat = (value?: string) => {
    const { y, m, d, valid } = parseYmd(value);
    return valid ? `${d} ${BULAN_SINGKAT[m - 1]} ${y}` : '-';
  };
  const upcomingAgenda = [...agendaList]
    .filter(a => (a.tanggal_selesai || a.tanggal_mulai || '').slice(0, 10) >= todayStr)
    .sort((a, b) => (a.tanggal_mulai || '').localeCompare(b.tanggal_mulai || ''))
    .slice(0, 4);
  const canOpenAgenda = visibleMenuItems.some(item => item.id === 'agenda');
  const goToAgenda = () => {
    setActiveTab('agenda');
    setFormMode('list');
    setSelectedItem(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'kwarcab': return 'bg-green-100 text-gray-600 border-green-200';
      case 'staff_kwarcab': return 'bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-500/35';
      case 'kwarran': return 'bg-blue-900/60 text-blue-200 border-blue-500/35';
      case 'gudep': return 'bg-emerald-900/60 text-emerald-200 border-emerald-500/35';
      case 'saka': return 'bg-amber-900/60 text-green-700 border-amber-500/35';
      default: return 'bg-slate-900/60 text-slate-200 border-slate-500/35';
    }
  };

  const getSakaStatusColor = (status: string) => {
    return status === 'approved' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  // Filtered and Paginated Anggota calculations
  const filteredAnggotaList = anggotaList.filter((a) => {
    // 1. Filter by Kwartir Ranting (only for kwarcab/superadmin)
    if (canManage('anggota')) {
      if (filterKwarran !== 'all' && a.kwartir_ranting_id !== filterKwarran) {
        return false;
      }
    }
    // Note: Other roles are already filtered/scoped inside their respective loadData API queries, 
    // but we double-check or keep "menghilangkan kwaran untuk role yang lainnya".

    // 2. Filter by Pangkalan/Gudep (for kwarcab, kwarran, and saka. gudep itself is already single-pangkalan)
    if (user.role !== 'gudep') {
      if (filterGudep !== 'all' && a.gudep_id !== filterGudep) {
        return false;
      }
    }

    // 3. Filter by Golongan
    if (filterGolongan !== 'all' && a.golongan !== filterGolongan) {
      return false;
    }

    // 4. Filter by text search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const namaMatch = a.nama_lengkap?.toLowerCase().includes(q);
      const pangkalanMatch = a.pangkalan?.toLowerCase().includes(q);
      const tingkatanMatch = a.tingkatan?.toLowerCase().includes(q);
      if (!namaMatch && !pangkalanMatch && !tingkatanMatch) {
        return false;
      }
    }

    return true;
  });

  const totalAnggotaCount = filteredAnggotaList.length;
  const totalPages = Math.ceil(totalAnggotaCount / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const displayedAnggotaList = filteredAnggotaList.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="flex h-screen bg-[#F4F7F6] font-sans relative">
      {/* Toast Messages */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-green-50 text-green-800 border border-green-200 shadow-2xl animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-red-50 text-red-800 border border-red-200 shadow-2xl animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold pl-2 underline text-red-900">Tutup</button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* ========== MOBILE DRAWER SIDEBAR ========== */}
      {/* Completely separate element for mobile, fixed positioned */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo area */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0 gap-3">
          <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            <img
              src={LOGO_KWARCAB}
              alt="Logo Kwarcab"
              className="w-full h-full object-cover scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = LOGO_KWARCAB_FALLBACK;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[10px] font-black text-gray-900 uppercase tracking-wide leading-none">Kwartir Cabang</h1>
            <p className="text-[8px] text-green-700 font-bold uppercase mt-0.5">Kab. Tasikmalaya</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setFormMode('list');
                  setSelectedItem(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-green-50 text-green-700 border border-green-100/50'
                    : 'text-gray-500 hover:text-green-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-sm font-bold mb-2"
          >
            <Key className="w-4 h-4" />
            <span>Ganti Password</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* ========== DESKTOP SIDEBAR (in-flow) ========== */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-full flex-shrink-0">
        {/* Logo area */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden p-1">
              <img
                src={LOGO_KWARCAB}
                alt="Logo Kwarcab"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = LOGO_KWARCAB_FALLBACK;
                }}
              />
            </div>
            <div>
              <h1 className="text-[11px] font-black text-gray-900 uppercase tracking-wide leading-tight">Kwartir Cabang<br/>Kab. Tasikmalaya</h1>
              <p className="text-[8px] text-gray-500 font-medium">Gerakan Pramuka Indonesia</p>
            </div>
          </div>
        </div>

        {/* Scrollable menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-none">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setFormMode('list');
                  setSelectedItem(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-green-50 text-green-700 shadow-sm border border-green-100/50'
                    : 'text-gray-500 hover:text-green-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id !== 'overview' && (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-green-600' : 'text-gray-300'}`} />
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Promo banner and actions */}
        <div className="p-4 flex-shrink-0 space-y-3">
          <button
             onClick={() => setIsChangePasswordOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 border border-gray-100 transition-all text-xs font-bold"
          >
            <Key className="w-4 h-4" />
            <span>Ganti Password</span>
          </button>
          <button
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-100 transition-all text-xs font-bold"
          >
             <LogOut className="w-4 h-4" />
             <span>Keluar</span>
          </button>
          
          <div className="rounded-2xl overflow-hidden relative shadow-sm border border-green-100 bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
              <img src={LOGO_KWARCAB} className="w-32 h-32 object-contain" alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mb-3 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-sm font-black text-green-900 leading-tight">Satyaku Kudarmakan<br/>Darmaku Kubaktikan</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 flex flex-col flex-shrink-0 sticky top-0 z-30">
          <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile menu button (Hidden if using bottom nav 'Lainnya', but keeping it for flexibility) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:text-green-700 hover:bg-gray-50"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Mobile Logo */}
              <div className="flex lg:hidden items-center gap-2">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={LOGO_KWARCAB}
                    alt="Logo Kwarcab"
                    className="w-full h-full object-cover scale-110"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = LOGO_KWARCAB_FALLBACK;
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[10px] font-black text-gray-900 uppercase tracking-wide leading-none">Kwartir Cabang</h1>
                  <p className="text-[7px] text-green-700 font-bold uppercase mt-0.5">Kab. Tasikmalaya</p>
                </div>
              </div>

              {/* Desktop Search Bar */}
              <div className="hidden lg:flex items-center relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-4" />
                <input 
                  type="text" 
                  placeholder="Cari menu, kegiatan, atau informasi..." 
                  className="pl-11 pr-4 py-2.5 w-80 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                />
                <div className="absolute right-3 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white border border-gray-200 rounded text-gray-400">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white border border-gray-200 rounded text-gray-400">K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to Landing Page (Desktop Only) */}
              <button
                type="button"
                onClick={onBackToLanding}
                title="Kembali ke halaman utama"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all text-xs font-semibold"
              >
                <Home className="w-4 h-4" />
                <span>Beranda</span>
              </button>

              {/* Divider */}
              <div className="hidden sm:block h-8 w-px bg-gray-200"></div>

              {/* Bell notification */}
              <button type="button" className="relative p-2 rounded-full text-gray-500 hover:text-green-700 transition-colors hover:bg-gray-50">
                <Bell className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* User info */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-gray-900">{user.nama}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{getRoleLabel(user.role)}</div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-bold text-xs sm:text-sm overflow-hidden shadow-sm flex-shrink-0 relative">
                  <img src="https://i.pravatar.cc/150?u=admin" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 hidden sm:block rotate-90" />
              </div>
            </div>
          </div>
          
          {/* Mobile Search Bar (Only visible on mobile below the header) */}
          <div className="lg:hidden px-4 pb-3">
             <div className="relative w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cari menu, kegiatan, atau informasi..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-sm"
                />
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative bg-[#F4F7F6] pb-24 lg:pb-8">
          
          {/* --- TAB CONTENT: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
              
              {/* Top Row: Welcome Banner & Profile Card */}
              <div className="grid lg:grid-cols-3 gap-2 sm:gap-3">
                <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-white shadow-sm min-h-[90px] sm:min-h-[110px] flex flex-col justify-center p-3 sm:p-4 border border-gray-100">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-[url('/img/admin_hero.jpg')] bg-center bg-cover bg-no-repeat"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-full sm:w-3/4"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent sm:hidden"></div>
                  </div>
                  
                  <div className="relative z-10 max-w-xs sm:max-w-md">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">Selamat Datang,</span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 font-heading mb-0.5 sm:mb-1">{user.nama}</h2>
                    <p className="text-[9px] sm:text-[10px] text-gray-700 font-medium leading-tight">
                      Di Sistem Informasi Kwartir Cabang Kabupaten Tasikmalaya. 
                      <span className="italic block mt-0.5 text-gray-500 font-normal">"Pramuka selalu hadir di setiap langkah, untuk membangun generasi yang lebih baik."</span>
                    </p>
                    
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5">
                      <div className="px-2 py-1 rounded-lg bg-green-700 text-white text-[8px] sm:text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-200" />
                        <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-green-800 text-white text-[8px] sm:text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-200" />
                        <span>Waktu Sistem</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 opacity-5 pointer-events-none">
                    <img src={LOGO_KWARCAB} className="w-24 h-24 sm:w-32 sm:h-32 object-contain" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-1.5 sm:mb-2 shadow-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mb-1">Kwartir Cabang<br/>Kab. Tasikmalaya</h3>
                    <div className="inline-block px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-green-100">Admin Area</div>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-light leading-tight hidden sm:block">Kelola seluruh data dan kegiatan kepramukaan di wilayah Kabupaten Tasikmalaya.</p>
                  </div>
                  <button className="relative z-10 mt-1.5 sm:mt-2 w-full py-1.5 sm:py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-[9px] sm:text-[10px] font-bold transition-colors flex items-center justify-between px-2 sm:px-3 shadow-sm shadow-green-700/20">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3 h-3" />
                      <span>Pengaturan Sistem</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Stats Row */}
              {(() => {
                let gudepCount = 0;
                let anggotaCount = 0;
                let agendaCount = 0;
                let beritaCount = 0;
            
                if (isKwarcabAdmin || user.role === 'kwarcab') {
                  gudepCount = gudepList.length || 56;
                  anggotaCount = stats?.totalAnggota || anggotaList.length || 1;
                  agendaCount = agendaList.length || 18;
                  beritaCount = beritaList.length || 42;
                } else if (user.role === 'kwarran') {
                  gudepCount = gudepList.filter(g => g.kwartir_ranting_id === user.ref_id).length;
                  anggotaCount = anggotaList.filter(a => a.kwartir_ranting_id === user.ref_id).length;
                  agendaCount = agendaList.filter(a => (a.owner_type === 'kwarran' && a.owner_id === user.ref_id) || a.owner_id === user.id).length;
                  beritaCount = beritaList.filter(b => (b.author_type === 'kwarran' && b.author_id === user.ref_id) || b.author_id === user.id).length;
                } else if (user.role === 'gudep') {
                  gudepCount = 1;
                  anggotaCount = anggotaList.filter(a => a.gudep_id === user.ref_id).length;
                  agendaCount = agendaList.filter(a => (a.owner_type === 'gudep' && a.owner_id === user.ref_id) || a.owner_id === user.id).length;
                  beritaCount = beritaList.filter(b => (b.author_type === 'gudep' && b.author_id === user.ref_id) || b.author_id === user.id).length;
                } else {
                  // staff_kwarcab, saka, etc
                  gudepCount = 0;
                  anggotaCount = anggotaList.filter(a => a.created_by === user.id).length;
                  agendaCount = agendaList.filter(a => a.owner_id === user.id || a.owner_id === user.ref_id).length;
                  beritaCount = beritaList.filter(b => b.author_id === user.id || b.author_id === user.ref_id).length;
                }

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Anggota', value: anggotaCount, trend: '+12%', color: 'text-green-600', bg: 'bg-green-50', icon: Users, line: 'stroke-green-500' },
                      { label: 'Satuan / Gugus Depan', value: gudepCount, trend: '+8%', color: 'text-blue-600', bg: 'bg-blue-50', icon: Building, line: 'stroke-blue-500' },
                      { label: 'Kegiatan Tahun Ini', value: agendaCount, trend: '+25%', color: 'text-green-700', bg: 'bg-purple-50', icon: Calendar, line: 'stroke-purple-500' },
                      { label: 'Berita & Publikasi', value: beritaCount, trend: '+18%', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText, line: 'stroke-amber-500' },
                      ...(isKwarcabAdmin || user.role === 'kwarran' ? [{ label: 'Akun Pengguna', value: isKwarcabAdmin ? (userList?.length || 24) : userList.filter(u => u.role === 'gudep' && gudepList.some(g => g.id === u.ref_id && g.kwartir_ranting_id === user.ref_id)).length, trend: '+5%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: User, line: 'stroke-emerald-500' }] : []),
                    ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-gray-200 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold mb-0.5 leading-tight">{stat.label}</div>
                        <div className="text-xl font-black text-gray-900 font-heading leading-none">{stat.value.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-600 z-10">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{stat.trend} dari bulan lalu</span>
                    </div>
                    {/* Mock Sparkline SVG */}
                    <svg className="absolute bottom-0 left-0 w-full h-12 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,10 T100,15 L100,30 L0,30 Z" className={`${stat.color.replace('text-', 'fill-').replace('600', '100')} opacity-30`} />
                      <path d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,10 T100,15" fill="none" strokeWidth="1.5" className={stat.line} />
                    </svg>
                  </div>
                ))}
                  </div>
                );
              })()}

              {/* Chart & Agenda Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Statistik Kegiatan</h3>
                        <p className="text-[10px] text-gray-500">Data kegiatan dalam 6 bulan terakhir</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-600 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                      <span>6 Bulan Terakhir</span>
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-4 mb-4 text-[10px] font-bold text-gray-500">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Kegiatan</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Anggota</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Saka</div>
                  </div>

                  {/* Mock Line Chart */}
                  <div className="flex-1 relative min-h-[200px] w-full border-b border-l border-gray-100 pb-2 pl-2">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 pl-2">
                      {[20,15,10,5,0].map(val => (
                        <div key={val} className="w-full border-t border-gray-100 flex items-center">
                          <span className="absolute -left-5 text-[9px] text-gray-400">{val}</span>
                        </div>
                      ))}
                    </div>
                    {/* SVG Chart Lines */}
                    <svg className="absolute inset-0 w-full h-full pt-4 pb-2 pl-2" preserveAspectRatio="none" viewBox="0 0 100 100">
                       <polyline points="0,80 20,70 40,75 60,70 80,60 100,55" fill="none" stroke="#8B5CF6" strokeWidth="1.5" />
                       <polyline points="0,70 20,60 40,65 60,65 80,50 100,45" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
                       <polyline points="0,60 20,50 40,50 60,45 80,40 100,30" fill="none" stroke="#22C55E" strokeWidth="2" />
                       
                       {/* Data points (green line) */}
                       <circle cx="0" cy="60" r="1.5" fill="#22C55E" />
                       <circle cx="20" cy="50" r="1.5" fill="#22C55E" />
                       <circle cx="40" cy="50" r="1.5" fill="#22C55E" />
                       <circle cx="60" cy="45" r="1.5" fill="#22C55E" />
                       <circle cx="80" cy="40" r="1.5" fill="#22C55E" />
                       <circle cx="100" cy="30" r="1.5" fill="#22C55E" />
                    </svg>
                    {/* X-Axis labels */}
                    <div className="absolute bottom-[-16px] left-0 w-full flex justify-between text-[9px] text-gray-400 pl-2">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span>
                    </div>
                  </div>
                </div>

                {/* Agenda Mendatang */}
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Agenda Mendatang</h3>
                        <p className="text-[10px] text-gray-500">Jadwal kegiatan & agenda penting</p>
                      </div>
                    </div>
                    {canOpenAgenda && (
                      <button onClick={goToAgenda} className="text-[10px] font-bold text-gray-500 flex items-center gap-1 hover:text-green-700">
                        Lihat Semua <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    {upcomingAgenda.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <Calendar className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-xs font-bold text-gray-500">Belum ada agenda mendatang</p>
                        <p className="text-[10px] mt-1 max-w-[220px]">Agenda yang belum lewat akan tampil di sini otomatis dari menu Agenda Kegiatan.</p>
                      </div>
                    ) : upcomingAgenda.map((ag) => {
                      const kat = AGENDA_KATEGORI[ag.kategori] || AGENDA_KATEGORI.mandiri;
                      const mulai = parseYmd(ag.tanggal_mulai);
                      const sedangBerlangsung = (ag.tanggal_mulai || '').slice(0, 10) <= todayStr;
                      const sameDay = (ag.tanggal_selesai || '').slice(0, 10) === (ag.tanggal_mulai || '').slice(0, 10) || !ag.tanggal_selesai;
                      return (
                        <div
                          key={ag.id}
                          className={`flex gap-3 group ${canOpenAgenda ? 'cursor-pointer' : ''}`}
                          onClick={canOpenAgenda ? goToAgenda : undefined}
                        >
                          <div className={`w-12 h-12 rounded-xl ${kat.color} text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                            <span className="text-sm font-black leading-none">{mulai.valid ? String(mulai.d).padStart(2, '0') : '--'}</span>
                            <span className="text-[9px] uppercase tracking-wider">{mulai.valid ? BULAN_SINGKAT[mulai.m - 1] : ''}</span>
                          </div>
                          <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-green-700 transition-colors">{ag.judul}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border flex-shrink-0 ${sedangBerlangsung ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-100'}`}>
                                {sedangBerlangsung ? 'Berlangsung' : 'Terjadwal'}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {sameDay ? formatTanggalSingkat(ag.tanggal_mulai) : `${formatTanggalSingkat(ag.tanggal_mulai)} - ${formatTanggalSingkat(ag.tanggal_selesai)}`}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {kat.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Info Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Informasi Terbaru</h4>
                    <p className="text-[10px] text-gray-500">Jadwal kegiatan dan pengumuman penting dapat diakses melalui menu Agenda Kegiatan.</p>
                  </div>
                </div>
                {canOpenAgenda && (
                  <button onClick={goToAgenda} className="px-4 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm">
                    Lihat Agenda <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* WRAPPER FOR OLD DARK TABS TO NOT BREAK THE UI */}
          <div className={activeTab !== 'overview' ? 'block' : 'hidden'}>
            {/* Page title banner */}
            {(() => {
              const tabMeta: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
                anggota:   { title: 'Kelola Anggota', subtitle: 'Manajemen data keanggotaan Pramuka Kabupaten Tasikmalaya', icon: <Users className="w-5 h-5 text-white" /> },
                kta:       { title: 'Kelola KTA', subtitle: 'Penerbitan Kartu Tanda Anggota (KTA) Pramuka', icon: <IdCard className="w-5 h-5 text-white" /> },
                kwarran:   { title: 'Kwartir Ranting', subtitle: 'Data Kwartir Ranting se-Kabupaten Tasikmalaya', icon: <MapPin className="w-5 h-5 text-white" /> },
                gudep:     { title: 'Gugus Depan', subtitle: 'Data Gugus Depan / Pangkalan Pramuka', icon: <Shield className="w-5 h-5 text-white" /> },
                saka:      { title: 'Satuan Karya (Saka)', subtitle: 'Manajemen Satuan Karya Pramuka se-Kabupaten Tasikmalaya', icon: <Award className="w-5 h-5 text-white" /> },
                berita:    { title: 'Berita & Konten', subtitle: 'Kelola artikel, berita, dan publikasi Kwarcab', icon: <FileText className="w-5 h-5 text-white" /> },
                agenda:    { title: 'Agenda Kegiatan', subtitle: 'Jadwal dan kegiatan kepramukaan Kabupaten Tasikmalaya', icon: <Calendar className="w-5 h-5 text-white" /> },
                kampung:   { title: 'Kampung Pramuka', subtitle: 'Data lokasi dan titik Kampung Pramuka', icon: <MapPin className="w-5 h-5 text-white" /> },
                sosmed:    { title: 'Pengaturan Sosial Media', subtitle: 'Kelola tautan media sosial dan kontak resmi Kwarcab', icon: <Globe className="w-5 h-5 text-white" /> },
                users:     { title: 'Manajemen Pengguna', subtitle: 'Kelola akun dan hak akses pengguna portal', icon: <Users className="w-5 h-5 text-white" /> },
                permissions: { title: 'Hak Akses (Permissions)', subtitle: 'Kelola izin dan otorisasi per peran pengguna', icon: <Key className="w-5 h-5 text-white" /> },
                profil:    { title: 'Profil Kwarcab', subtitle: 'Informasi dan identitas resmi Kwartir Cabang Kabupaten Tasikmalaya', icon: <Building className="w-5 h-5 text-white" /> },
                pimpinan:  { title: 'Pimpinan Kwarcab', subtitle: 'Data pengurus dan pimpinan Kwartir Cabang', icon: <User className="w-5 h-5 text-white" /> },
              };
              const meta = tabMeta[activeTab];
              if (!meta) return null;
              return (
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    {meta.icon}
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">{meta.title}</h1>
                    <p className="text-xs text-gray-500">{meta.subtitle}</p>
                  </div>
                </div>
              );
            })()}
          {/* --- TAB CONTENT: ANGGOTA MANAGEMENT --- */}
          {activeTab === 'anggota' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  {/* View Mode Toggle (Only for Kwarcab/Staff or Kwarran to see Gudeps) */}
                  {(user.role === 'kwarcab' || user.role === 'staff_kwarcab' || user.role === 'kwarran') && (
                    <div className="flex border-b border-gray-200">
                      <button
                        onClick={() => {
                          setAnggotaViewMode('rekap_kwarran');
                          if (user.role === 'kwarran') setSelectedRekapKwarranId(user.ref_id);
                        }}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                          anggotaViewMode === 'rekap_kwarran' 
                            ? 'text-green-700 border-b-2 border-green-700' 
                            : 'text-gray-500 hover:text-green-600'
                        }`}
                      >
                        Rekapitulasi Anggota
                      </button>
                      <button
                        onClick={() => setAnggotaViewMode('list')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                          anggotaViewMode === 'list' 
                            ? 'text-green-700 border-b-2 border-green-700' 
                            : 'text-gray-500 hover:text-green-600'
                        }`}
                      >
                        Daftar Anggota Lengkap
                      </button>
                    </div>
                  )}

                  {/* Top bar with actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {anggotaViewMode === 'list' ? `Daftar Anggota : ${anggotaList.length} baris` : 'Rekapitulasi Data Keanggotaan'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-600 hover:text-white text-green-700 border border-green-300 text-xs font-bold tracking-wide uppercase active:scale-95 transition-all duration-200"
                      >
                        <Download className="w-4 h-4 text-green-700" />
                        <span>Ekspor Data</span>
                      </button>

                      {user.role === 'saka' ? (
                        <button
                          onClick={handleBase64Upload && handleOpenPullModal}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#D4AF37] text-[#0F0A1A] text-xs font-extrabold tracking-wide uppercase hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tarik Anggota (Path B)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setFormMode('add');
                            setAngNama('');
                            setAngTempat('');
                            setAngTanggal('');
                            setAngAlamat('');
                            setAngPangkalan('');
                            setAngFoto('');
                            setAngAktifSaka(false);
                            setAngSakaIds([]);
                          }}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold tracking-wide uppercase active:scale-95 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4 text-white" />
                           <span>Input Anggota Baru</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ========================================= */}
                  {/* REKAPITULASI KWARRAN & GUDEP (ACCORDION)  */}
                  {/* ========================================= */}
                  {anggotaViewMode === 'rekap_kwarran' && (
                    <div className="space-y-4">
                      {allKwarran.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 font-medium italic text-sm">
                          Belum ada data Kwartir Ranting.
                        </div>
                      ) : (
                        allKwarran.map(kw => {
                          const isExpanded = selectedRekapKwarranId === kw.id;
                          const anggotaKwarran = anggotaList.filter(a => a.kwartir_ranting_id === kw.id);
                          const totalKwarran = anggotaKwarran.length;
                          const siagaCount = anggotaKwarran.filter(a => a.golongan === 'siaga').length;
                          const penggalangCount = anggotaKwarran.filter(a => a.golongan === 'penggalang').length;
                          const penegakCount = anggotaKwarran.filter(a => a.golongan === 'penegak').length;
                          const pandegaCount = anggotaKwarran.filter(a => a.golongan === 'pandega').length;
                          const dewasaCount = anggotaKwarran.filter(a => a.golongan === 'dewasa').length;
                          
                          const gudeps = gudepList.filter(g => g.kwartir_ranting_id === kw.id);
                          return (
                            <div key={kw.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                              {/* Kwarran Header */}
                              <div 
                                onClick={() => setSelectedRekapKwarranId(isExpanded ? null : kw.id)}
                                className={`flex items-start sm:items-center justify-between p-4 cursor-pointer hover:bg-green-50 transition-colors ${isExpanded ? 'bg-green-50/50' : ''}`}
                              >
                                <div className="flex items-start sm:items-center space-x-4">
                                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                                    <MapPin className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1.5">Kecamatan {kw.nama_kecamatan}</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md text-[10px] font-black border border-gray-200">
                                        Total: {totalKwarran}
                                      </span>
                                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-green-100">
                                        Siaga: {siagaCount}
                                      </span>
                                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-red-100">
                                        Penggalang: {penggalangCount}
                                      </span>
                                      <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-yellow-100">
                                        Penegak: {penegakCount}
                                      </span>
                                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-amber-100">
                                        Pandega: {pandegaCount}
                                      </span>
                                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-purple-100">
                                        Dewasa: {dewasaCount}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-green-600' : ''}`} />
                                </div>
                              </div>
                              
                              {/* Gudep List (Accordion Content) */}
                              {isExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50/70 p-4 md:p-5">
                                  {gudeps.length === 0 ? (
                                    <div className="text-center text-gray-500 text-xs italic py-4 bg-white rounded-xl border border-gray-100">
                                      Belum ada Gugus Depan di Kwartir Ranting ini.
                                    </div>
                                  ) : (
                                    <div className="space-y-2 md:pl-14">
                                      {gudeps.map(gudep => {
                                        const totalGudep = anggotaList.filter(a => a.gugus_depan_id === gudep.id).length;
                                        return (
                                          <div key={gudep.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-200 transition-colors gap-3">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                                <Building className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">{gudep.nama_pangkalan}</h4>
                                                <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5">Gudep: {gudep.no_gudep_putra} / {gudep.no_gudep_putri}</p>
                                              </div>
                                            </div>
                                            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold self-start sm:self-auto flex items-center space-x-1 shrink-0">
                                              <Users className="w-3.5 h-3.5" />
                                              <span>{totalGudep} Anggota</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* ========================================= */}
                  {/* DAFTAR ANGGOTA LENGKAP VIEW               */}
                  {/* ========================================= */}
                  {anggotaViewMode === 'list' && (
                    <>
                      {/* Path A Pending list for Saka specifically */}
                      {user.role === 'saka' && anggotaList.some(a => a.saka_list?.some((j: any) => j.saka_id === user.ref_id && j.status === 'pending')) && (
                    <div className="bg-white shadow-sm rounded-2xl border border-green-200 p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-4 flex items-center space-x-2 animate-pulse">
                        <AlertCircle className="w-4 h-4 text-green-700" />
                        <span>Antrean Pengajuan Keanggotaan (Path A)</span>
                      </h3>

                      <div className="space-y-3">
                        {anggotaList.filter(a => a.saka_list?.some((j: any) => j.saka_id === user.ref_id && j.status === 'pending')).map(a => {
                          const junction = a.saka_list.find((j: any) => j.saka_id === user.ref_id && j.status === 'pending');
                          return (
                            <div key={a.id} className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{a.nama_lengkap}</div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                  Pangkalan: {a.pangkalan} &bull; Golongan: {a.golongan.toUpperCase()} ({a.tingkatan})
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                <button
                                  onClick={() => handleReviewSakaJunction(junction.junction_id, 'approve')}
                                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition-all duration-200"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  onClick={() => handleReviewSakaJunction(junction.junction_id, 'reject')}
                                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-[10px] uppercase tracking-wider transition-all duration-200"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak &amp; Lepas</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Filter Panel (Adhering to strict role filter conditions) */}
                  <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 space-y-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                      <Search className="w-4 h-4 text-green-700" />
                      <span>Filter & Pencarian Anggota</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search Input (All Roles) */}
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Nama / Tingkatan
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari nama anggota..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-900 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400/50 focus:border-green-400 placeholder-gray-400 transition"
                          />
                          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Kwartir Ranting Filter - ONLY FOR SUPERADMIN (kwarcab) */}
                      {canManage('anggota') && (
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Kwartir Ranting
                          </label>
                          <div className="relative">
                            <select
                              value={filterKwarran}
                              onChange={(e) => {
                                setFilterKwarran(e.target.value);
                                setFilterGudep('all'); // reset pangkalan when kwarran changes
                                setCurrentPage(1);
                              }}
                              className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-900 text-xs rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400/50 focus:border-green-400 transition cursor-pointer"
                            >
                              <option value="all">Semua Kwartir Ranting</option>
                              {allKwarran.map((kw) => (
                                <option key={kw.id} value={kw.id}>
                                  Kwarran {kw.nama_kecamatan}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Pangkalan Filter - FOR ALL EXCEPT GUDEP (since Gudep is single-pangkalan) */}
                      {user.role !== 'gudep' && (
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Pangkalan (Gudep)
                          </label>
                          <div className="relative">
                            <select
                              value={filterGudep}
                              onChange={(e) => {
                                setFilterGudep(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-900 text-xs rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400/50 focus:border-green-400 transition cursor-pointer"
                            >
                              <option value="all">Semua Pangkalan</option>
                              {gudepList
                                .filter((g) => {
                                  if (canManage('anggota') && filterKwarran !== 'all') {
                                    return g.kwartir_ranting_id === filterKwarran;
                                  }
                                  if (user.role === 'kwarran') {
                                    return g.kwartir_ranting_id === user.ref_id;
                                  }
                                  return true;
                                })
                                .map((gd) => (
                                  <option key={gd.id} value={gd.id}>
                                    {gd.nama_pangkalan}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Golongan Filter - ALWAYS SHOWN FOR ALL ROLES */}
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Golongan
                        </label>
                        <div className="relative">
                          <select
                            value={filterGolongan}
                            onChange={(e) => {
                              setFilterGolongan(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-900 text-xs rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400/50 focus:border-green-400 transition cursor-pointer"
                          >
                            <option value="all">Semua Golongan</option>
                            <option value="siaga">Siaga</option>
                            <option value="penggalang">Penggalang</option>
                            <option value="penegak">Penegak</option>
                            <option value="pandega">Pandega</option>
                            <option value="dewasa">Dewasa</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Members Table */}
                  <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                            <th className="p-4">Nama Lengkap</th>
                            <th className="p-4">Golongan / Tingkat</th>
                            <th className="p-4">Alamat &amp; Pangkalan</th>
                            <th className="p-4">Saka Afiliasi</th>
                            {user.role !== 'saka' && <th className="p-4 text-right">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                          {displayedAnggotaList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400 font-light">
                                Belum ada data anggota terdaftar.
                              </td>
                            </tr>
                          ) : (
                            displayedAnggotaList.map((a) => (
                              <tr key={a.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="p-4">
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    {a.nama_lengkap}
                                    {a.is_kta_printed && (
                                      <span title="KTA Sudah Dicetak" className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 uppercase tracking-widest font-black">KTA</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">{a.tempat_lahir}, {a.tanggal_lahir}</div>
                                </td>
                                <td className="p-4">
                                  <span className="font-bold uppercase tracking-wider text-[10px] text-green-700">{a.golongan}</span>
                                  <div className="text-[10px] text-gray-500 mt-0.5">{a.tingkatan}</div>
                                </td>
                                <td className="p-4 max-w-[200px]">
                                  <div className="truncate font-light">{a.pangkalan}</div>
                                  <div className="text-[10px] text-gray-500 truncate mt-0.5">{a.alamat_asal}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {a.saka_list && a.saka_list.length > 0 ? (
                                      a.saka_list.map((j: any, i: number) => (
                                        <span 
                                          key={i} 
                                          title={`Sumber: ${j.sumber}`}
                                          className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSakaStatusColor(j.status)}`}
                                        >
                                          {j.nama_saka} ({j.status.toUpperCase()})
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-300 font-light italic text-[10px]">Non-Saka</span>
                                    )}
                                  </div>
                                </td>
                                {user.role !== 'saka' && (
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => exportToSuratLegalitas(a)}
                                        title="Cetak Surat Keterangan Legalitas"
                                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-green-800 border border-gray-200 text-green-700 hover:text-gray-900 transition-all duration-150"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setFormMode('edit');
                                          setSelectedItem(a);
                                          setAngNama(a.nama_lengkap);
                                          setAngTempat(a.tempat_lahir);
                                          setAngTanggal(a.tanggal_lahir);
                                          setAngGolongan(a.golongan);
                                          setAngTingkatan(a.tingkatan);
                                          setAngAlamat(a.alamat_asal);
                                          setAngPangkalan(a.pangkalan);
                                          setAngKwarranId(a.kwartir_ranting_id);
                                          setAngGudepId(a.gudep_id || '');
                                          setAngFoto(a.foto || '');
                                          setAngAktifSaka(a.saka_list?.length > 0);
                                          setAngSakaIds(a.saka_list?.map((sl: any) => sl.saka_id) || []);
                                        }}
                                        className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all duration-150"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAnggota(a.id)}
                                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/10 text-red-400 hover:text-gray-900 transition-all duration-150"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination Section (Identical to User Image) */}
                  <div className="bg-[#130E26]/60 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left: Tampilkan [dropdown] [count] siswa */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Tampilkan</span>
                      <div className="relative">
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-gray-900 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400/50 focus:border-green-400 transition cursor-pointer"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 px-1">{totalAnggotaCount}</span>
                      <span>siswa</span>
                    </div>

                    {/* Right: [<-] page / total [->] */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={activePage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-white border border-gray-100 shadow-sm disabled:opacity-20 disabled:pointer-events-none active:scale-95 transition-all duration-150 cursor-pointer"
                      >
                        &larr;
                      </button>
                      <span className="font-semibold text-gray-900/90">
                        {activePage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={activePage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-green-700 hover:text-gray-900 hover:bg-white border border-gray-100 shadow-sm disabled:opacity-20 disabled:pointer-events-none active:scale-95 transition-all duration-150 cursor-pointer"
                      >
                        &rarr;
                      </button>
                    </div>
                  </div>
                    </>
                  )}
                </>
              ) : (
                /* ADD / EDIT ANGGOTA FORM (Modul 3.1) */
                <form onSubmit={handleSaveAnggota} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6">
                  <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider border-b border-white/5 pb-2 mb-6">
                    {formMode === 'add' ? 'Input Data Anggota Baru' : `Sunting Data Anggota: ${selectedItem?.nama_lengkap}`}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Nama Lengkap */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        value={angNama}
                        onChange={(e) => setAngNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition"
                        placeholder="Masukkan nama lengkap sesuai identitas"
                      />
                    </div>

                    {/* Foto (Upload with compression) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Foto Profil KTA *</label>
                      <div className="flex items-center gap-4">
                        {angFoto && (
                          <div className="w-16 h-20 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={angFoto} alt="Preview Foto" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCompressedUpload(e, setAngFoto)}
                            className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-gray-500 hover:file:bg-green-100"
                          />
                          <p className="text-[10px] text-gray-400 font-light mt-1">
                            Pilih gambar dari perangkat Anda. Gambar akan otomatis dikompresi sebelum diunggah ke Cloudinary.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tempat Lahir */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Tempat Lahir *</label>
                      <input
                        type="text"
                        required
                        value={angTempat}
                        onChange={(e) => setAngTempat(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition"
                        placeholder="Tempat lahir (Kota/Kabupaten)"
                      />
                    </div>

                    {/* Tanggal Lahir */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Tanggal Lahir *</label>
                      <input
                        type="date"
                        required
                        value={angTanggal}
                        onChange={(e) => setAngTanggal(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition"
                      />
                    </div>

                    {/* Golongan Pramuka */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Golongan Pramuka *</label>
                      <select
                        value={angGolongan}
                        onChange={(e) => setAngGolongan(e.target.value as GolonganPramuka)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-400/40 focus:outline-none transition"
                      >
                        <option value="siaga">Siaga (SD / 7-10 Th)</option>
                        <option value="penggalang">Penggalang (SMP / 11-15 Th)</option>
                        <option value="penegak">Penegak (SMA / 16-20 Th)</option>
                        <option value="pandega">Pandega (Perguruan Tinggi / 21-25 Th)</option>
                        <option value="dewasa">Dewasa / Pembina (26+ Th)</option>
                      </select>
                    </div>

                    {/* Tingkatan (Dependent) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Tingkatan Pramuka *</label>
                      <select
                        value={angTingkatan}
                        onChange={(e) => setAngTingkatan(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-400/40 focus:outline-none transition"
                      >
                        {TINGKATAN_MAP[angGolongan]?.map((ting) => (
                          <option key={ting} value={ting}>{ting}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pangkalan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Pangkalan / Gugus Depan *</label>
                      <input
                        type="text"
                        required
                        value={angPangkalan}
                        onChange={(e) => setAngPangkalan(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition"
                        placeholder="Contoh: SMAN 1 Cisayong atau Pangkalan RT"
                      />
                    </div>

                    {/* Kwarran (If superadmin can choose, otherwise auto-scoped) */}
                    {canManage('anggota') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Kwartir Ranting *</label>
                        <select
                          value={angKwarranId}
                          onChange={(e) => setAngKwarranId(e.target.value)}
                          required
                          className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-400/40 focus:outline-none transition"
                        >
                          <option value="">-- Pilih Kwarran --</option>
                          {allKwarran.map((kw) => (
                            <option key={kw.id} value={kw.id}>Kecamatan {kw.nama_kecamatan}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Gudep selection (Scoped to selected Kwarran) */}
                    {canManage('anggota') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Gugus Depan Pangkalan (Opsional)</label>
                        <select
                          value={angGudepId}
                          onChange={(e) => setAngGudepId(e.target.value)}
                          className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-400/40 focus:outline-none transition"
                        >
                          <option value="">-- Pilih Gudep (Jika Ada) --</option>
                          {gudepList.filter(g => g.kwartir_ranting_id === angKwarranId).map((gd) => (
                            <option key={gd.id} value={gd.id}>{gd.nama_pangkalan}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Alamat Asal */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Alamat Lengkap Asal</label>
                    <textarea
                      value={angAlamat}
                      onChange={(e) => setAngAlamat(e.target.value)}
                      rows={3}
                      className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition"
                      placeholder="Masukkan alamat lengkap rumah tinggal"
                    />
                  </div>

                  {/* MANY-TO-MANY SAKA INTEGRATION (Modul 3.3 Relasi Many-to-Many) */}
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Apakah Aktif sebagai Anggota Saka?</h4>
                        <p className="text-[10px] text-gray-500">Hubungkan anggota dengan 1 atau lebih Satuan Karya Pramuka (Saka) se-Tasikmalaya.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAngAktifSaka(!angAktifSaka)}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${angAktifSaka ? 'bg-[#D4AF37]' : 'bg-gray-50'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${angAktifSaka ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {angAktifSaka && (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                        <label className="text-xs font-bold text-gray-500">Pilih Satuan Karya (Bisa multi-select) :</label>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {allSaka.map((sk) => {
                            const isChecked = angSakaIds.includes(sk.id);
                            return (
                              <button
                                type="button"
                                key={sk.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setAngSakaIds(angSakaIds.filter(id => id !== sk.id));
                                  } else {
                                    setAngSakaIds([...angSakaIds, sk.id]);
                                  }
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all duration-200 ${
                                  isChecked
                                    ? 'bg-green-50 border-green-500 text-green-900 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <span>{sk.nama_saka}</span>
                                {isChecked && <Check className="w-4 h-4 text-green-700" />}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-start gap-1 mt-2 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-green-700 flex-shrink-0" />
                          <span>PENTING (PATH A): Pengisian dari Kwarran/Gudep akan masuk ke antrean persetujuan dewan saka yang bersangkutan terlebih dahulu sebelum resmi aktif.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-4 border-t border-gray-200 pt-6">
                    <button
                      type="button"
                      onClick={() => setFormMode('list')}
                      className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs uppercase transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-xs uppercase border border-green-200 transition-all duration-200"
                    >
                      Simpan Data Anggota
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: KELOLA KTA (KWARCAB) --- */}
          {activeTab === 'kta' && canManage('kta') && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-heading">Kelola Kartu Tanda Anggota</h2>
                  <p className="text-sm text-gray-500">Konfigurasi KTA & Daftar Anggota</p>
                </div>
              </div>

              {/* Konfigurasi KTA */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-6 rounded-2xl border border-gray-200 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                <h3 className="text-lg font-bold text-green-700 mb-4 border-b border-gray-200 pb-2">Konfigurasi Pengesahan KTA</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Nama Ketua Kwarcab</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-green-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-400 transition-colors outline-none"
                      value={ktaConfig.nama_ketua}
                      onChange={(e) => setKtaConfig({...ktaConfig, nama_ketua: e.target.value})}
                      placeholder="Contoh: H. Agus Ridallah, S.H., M.H."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Tanda Tangan (Transparan)</label>
                    <input
                      type="file"
                      accept="image/png"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-800/50 file:text-green-700 hover:file:bg-purple-800/80 cursor-pointer"
                      onChange={(e) => handleBase64Upload(e, (url) => setKtaConfig({...ktaConfig, tanda_tangan_url: url}), {
                        maxDimension: 700,
                        quality: 0.42,
                        filenamePrefix: 'ttd_',
                        successMessage: 'Tanda tangan berhasil dikompresi maksimal dan diunggah!'
                      })}
                    />
                    {ktaConfig.tanda_tangan_url && <img src={ktaConfig.tanda_tangan_url} alt="TTD" className="h-12 object-contain bg-white border border-gray-100 shadow-sm border border-gray-200 rounded-lg p-1" />}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Stempel Kwarcab (Transparan)</label>
                    <input
                      type="file"
                      accept="image/png"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-800/50 file:text-green-700 hover:file:bg-purple-800/80 cursor-pointer"
                      onChange={(e) => handleBase64Upload(e, (url) => setKtaConfig({...ktaConfig, stempel_url: url}), {
                        maxDimension: 700,
                        quality: 0.42,
                        filenamePrefix: 'stempel_',
                        successMessage: 'Stempel berhasil dikompresi maksimal dan diunggah!'
                      })}
                    />
                    {ktaConfig.stempel_url && <img src={ktaConfig.stempel_url} alt="Stempel" className="h-12 object-contain bg-white border border-gray-100 shadow-sm border border-gray-200 rounded-lg p-1" />}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/kta-config', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify(ktaConfig)
                        });
                        if (res.ok) {
                          showSuccess('Konfigurasi KTA berhasil disimpan!');
                        } else {
                          setErrorMsg('Gagal menyimpan konfigurasi');
                        }
                      } catch (err: any) {
                        setErrorMsg(err.message);
                      }
                    }}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Simpan Konfigurasi
                  </button>
                </div>
              </div>

              {/* Tab Belum/Sudah Cetak */}
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-2xl">
                <div className="flex border-b border-gray-200 bg-white">
                  <button 
                    type="button"
                    onClick={() => setKtaTab('belum')}
                    className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-widest transition-all duration-300 ${ktaTab === 'belum' ? 'text-green-700 border-b-2 border-[#D4AF37] bg-white/[0.03]' : 'text-gray-400 hover:text-gray-500 hover:bg-white/[0.01]'}`}
                  >
                    Belum Cetak KTA ({anggotaList.filter(a => !a.is_kta_printed).length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setKtaTab('sudah')}
                    className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-widest transition-all duration-300 ${ktaTab === 'sudah' ? 'text-emerald-700 border-b-2 border-emerald-400 bg-white/[0.03]' : 'text-gray-400 hover:text-gray-500 hover:bg-white/[0.01]'}`}
                  >
                    Sudah Cetak KTA ({anggotaList.filter(a => a.is_kta_printed).length})
                  </button>
                </div>
                
                <div className="p-0 overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm border-b border-gray-200">
                      <tr className="text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-green-200">
                        <th className="p-4 rounded-tl-xl whitespace-nowrap">Identitas Anggota</th>
                        <th className="p-4 whitespace-nowrap">Pangkalan / Gudep</th>
                        <th className="p-4 text-right rounded-tr-xl whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-gray-800 divide-y divide-gray-100">
                      {anggotaList.filter(a => ktaTab === 'belum' ? !a.is_kta_printed : a.is_kta_printed).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <IdCard className="w-12 h-12 mb-3 opacity-50" />
                              <p>Tidak ada anggota di tab ini.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        anggotaList.filter(a => ktaTab === 'belum' ? !a.is_kta_printed : a.is_kta_printed).map(a => (
                          <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                {a.foto ? (
                                  <img src={a.foto} className="w-12 h-16 rounded object-cover border border-gray-200" alt="foto" />
                                ) : (
                                  <div className="w-12 h-16 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-black text-gray-900 uppercase tracking-wide">{a.nama_lengkap}</div>
                                  <div className="text-xs text-green-700 font-mono mt-0.5 font-bold">NTA: 09.01.{a.id.replace('ang_','').padStart(5,'0')}</div>
                                  <div className="text-[10px] text-gray-500 uppercase mt-1 px-2 py-0.5 bg-green-50 rounded inline-block border border-green-200">
                                    {a.golongan} - {a.tingkatan}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-top pt-5">
                              <div className="font-bold text-gray-800">{a.pangkalan}</div>
                              <div className="text-xs text-gray-500 mt-1">Kwarran: {a.kwartir_ranting_id}</div>
                            </td>
                            <td className="p-4 text-right align-middle">
                              <button
                                type="button"
                                onClick={() => exportToKTA(a)}
                                className={`px-4 py-2 font-bold rounded-lg text-xs flex items-center justify-center ml-auto transition-all ${ktaTab === 'belum' ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:-translate-y-0.5' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'}`}
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                {ktaTab === 'belum' ? 'Cetak KTA Baru' : 'Cetak Ulang KTA'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB CONTENT: KWARTRAN LIST (KWARCAB) --- */}
          {activeTab === 'kwarran' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Kwartir Ranting se-Kabupaten</span>
                    {canManage('kwarran') && (
                      <button
                        onClick={() => {
                          setFormMode('add');
                          setKwNama('');
                          setKwKetua('');
                          setKwSekretaris('');
                          setKwBendahara('');
                          setKwStatus('aktif');
                        }}
                        className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Tambah Kwarran</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-100 text-gray-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-5">Kwartir Ranting</th>
                          <th className="py-4 px-5">Ketua Kwarran</th>
                          <th className="py-4 px-5">Sekretaris</th>
                          <th className="py-4 px-5">Bendahara</th>
                          <th className="py-4 px-5 text-center">Status</th>
                          <th className="py-4 px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {allKwarran.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-5 text-center text-gray-500 font-medium italic">
                              Belum ada Kwartir Ranting yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          allKwarran
                            .filter(kw => isKwarcabAdmin || isKwarcabStaff || (user.role === 'kwarran' && kw.id === user.ref_id))
                            .map((kw) => (
                            <tr key={kw.id} className="hover:bg-gray-50 transition">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 text-green-700">
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <div className="font-bold text-gray-900">
                                    Kecamatan {kw.nama_kecamatan}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-medium text-gray-800">
                                {kw.ketua}
                              </td>
                              <td className="py-3.5 px-5 text-gray-600">
                                {kw.sekretaris}
                              </td>
                              <td className="py-3.5 px-5 text-gray-600">
                                {kw.bendahara}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                  kw.status === 'aktif' 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                    : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                  {kw.status ? kw.status.toUpperCase() : 'AKTIF'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setViewingKwarranDetail(kw)}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-green-700" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFormMode('edit');
                                      setSelectedItem(kw);
                                      setKwNama(kw.nama_kecamatan);
                                      setKwKetua(kw.ketua);
                                      setKwSekretaris(kw.sekretaris);
                                      setKwBendahara(kw.bendahara);
                                      setKwStatus(kw.status);
                                    }}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Edit Kwarran"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-white/5">
                      {allKwarran.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 font-medium italic text-xs">
                          Belum ada Kwartir Ranting yang terdaftar.
                        </div>
                      ) : (
                        allKwarran
                          .filter(kw => isKwarcabAdmin || isKwarcabStaff || (user.role === 'kwarran' && kw.id === user.ref_id))
                          .map((kw) => (
                          <div key={kw.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">Kecamatan {kw.nama_kecamatan}</h4>
                                <p className="text-[10px] text-gray-500/70 mt-0.5">Ketua: {kw.ketua}</p>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                kw.status === 'aktif' 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}>
                                {kw.status ? kw.status.toUpperCase() : 'AKTIF'}
                              </span>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => setViewingKwarranDetail(kw)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 transition"
                              >
                                <Eye className="w-3 h-3 text-green-700" />
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => {
                                  setFormMode('edit');
                                  setSelectedItem(kw);
                                  setKwNama(kw.nama_kecamatan);
                                  setKwKetua(kw.ketua);
                                  setKwSekretaris(kw.sekretaris);
                                  setKwBendahara(kw.bendahara);
                                  setKwStatus(kw.status);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-500 transition"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Kwarran Detail Modal */}
                  {viewingKwarranDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                      <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-6 sm:p-8 space-y-6">
                        <button
                          onClick={() => setViewingKwarranDetail(null)}
                          className="absolute top-5 right-5 z-50 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5 text-green-700" />
                        </button>

                        <div className="flex items-center space-x-3 border-b border-gray-200 pb-4">
                          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                            <Building className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-gray-900">Profil Kwartir Ranting</h3>
                            <p className="text-xs text-gray-500">Kecamatan {viewingKwarranDetail.nama_kecamatan}</p>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Ketua Kwarran</span>
                            <span className="col-span-2 font-bold text-gray-900">{viewingKwarranDetail.ketua}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Sekretaris</span>
                            <span className="col-span-2 text-gray-800">{viewingKwarranDetail.sekretaris}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Bendahara</span>
                            <span className="col-span-2 text-gray-800">{viewingKwarranDetail.bendahara}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Status Layanan</span>
                            <span className="col-span-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                                viewingKwarranDetail.status === 'aktif' 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}>
                                {viewingKwarranDetail.status ? viewingKwarranDetail.status.toUpperCase() : 'AKTIF'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setFormMode('edit');
                              setSelectedItem(viewingKwarranDetail);
                              setKwNama(viewingKwarranDetail.nama_kecamatan);
                              setKwKetua(viewingKwarranDetail.ketua);
                              setKwSekretaris(viewingKwarranDetail.sekretaris);
                              setKwBendahara(viewingKwarranDetail.bendahara);
                              setKwStatus(viewingKwarranDetail.status);
                              setViewingKwarranDetail(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition flex items-center space-x-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sunting Data</span>
                          </button>
                          <button
                            onClick={() => setViewingKwarranDetail(null)}
                            className="px-4 py-2 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSaveKwarran} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    {formMode === 'add' ? 'Registrasi Kwartir Ranting Baru' : 'Sunting Data Kwarran'}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Nama Kecamatan *</label>
                      <input
                        type="text"
                        required
                        disabled={user.role === 'kwarran'}
                        value={kwNama}
                        onChange={(e) => setKwNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Ketua Kwarran {user.role === 'kwarcab' || user.role === 'staff_kwarcab' ? '(Opsional)' : '*'}</label>
                      <input
                        type="text"
                        required={user.role === 'kwarran'}
                        value={kwKetua}
                        onChange={(e) => setKwKetua(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Sekretaris {user.role === 'kwarcab' || user.role === 'staff_kwarcab' ? '(Opsional)' : '*'}</label>
                      <input
                        type="text"
                        required={user.role === 'kwarran'}
                        value={kwSekretaris}
                        onChange={(e) => setKwSekretaris(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Bendahara {user.role === 'kwarcab' || user.role === 'staff_kwarcab' ? '(Opsional)' : '*'}</label>
                      <input
                        type="text"
                        required={user.role === 'kwarran'}
                        value={kwBendahara}
                        onChange={(e) => setKwBendahara(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                    {/* Status Kwarran (Hanya bisa diubah Kwarcab) */}
                    {(user.role === 'kwarcab' || user.role === 'staff_kwarcab') && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600">Status Layanan *</label>
                        <select
                          value={kwStatus}
                          onChange={(e) => setKwStatus(e.target.value as any)}
                          className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer"
                        >
                          <option value="aktif">AKTIF</option>
                          <option value="transisi">TRANSISI</option>
                          <option value="non-aktif">NON-AKTIF</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: GUDEP LIST --- */}
          {activeTab === 'gudep' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Gugus Depan Pangkalan</span>
                    {(canManage('gudep') || user.role === 'kwarran') && (
                      <button
                        onClick={() => {
                          setFormMode('add');
                          setGdNama('');
                          setGdKwarran(user.role === 'kwarran' ? (user.ref_id || '') : '');
                        }}
                        className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      <span>Tambah Gudep</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-100 text-gray-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-5">Nama Pangkalan / Gugus Depan</th>
                          <th className="py-4 px-5">Kwartir Ranting Induk</th>
                          <th className="py-4 px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {gudepList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 px-5 text-center text-gray-500 font-medium italic">
                              Belum ada Gugus Depan yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          gudepList.map((gd) => {
                            const kw = allKwarran.find(x => x.id === gd.kwartir_ranting_id);
                            return (
                              <tr key={gd.id} className="hover:bg-gray-50 transition">
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 text-green-700">
                                      <Award className="w-4 h-4" />
                                    </div>
                                    <div className="font-bold text-gray-900">
                                      {gd.nama_pangkalan}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5 text-gray-800 font-medium">
                                  Kecamatan {kw ? kw.nama_kecamatan : 'Tasikmalaya'}
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                  <button
                                    onClick={() => setViewingGudepDetail(gd)}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-green-700" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-white/5">
                      {gudepList.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 font-medium italic text-xs">
                          Belum ada Gugus Depan yang terdaftar.
                        </div>
                      ) : (
                        gudepList.map((gd) => {
                          const kw = allKwarran.find(x => x.id === gd.kwartir_ranting_id);
                          return (
                            <div key={gd.id} className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900">{gd.nama_pangkalan}</h4>
                                  <p className="text-[10px] text-gray-500/70 mt-0.5">
                                    Kwarran: Kecamatan {kw ? kw.nama_kecamatan : 'Tasikmalaya'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-end pt-2 border-t border-white/5">
                                <button
                                  onClick={() => setViewingGudepDetail(gd)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 transition"
                                >
                                  <Eye className="w-3 h-3 text-green-700" />
                                  <span>Detail</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Gugus Depan Detail Modal */}
                  {viewingGudepDetail && (() => {
                    const kw = allKwarran.find(x => x.id === viewingGudepDetail.kwartir_ranting_id);
                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-6 sm:p-8 space-y-6">
                          <button
                            onClick={() => setViewingGudepDetail(null)}
                            className="absolute top-5 right-5 z-50 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                          >
                            <X className="w-5 h-5 text-green-700" />
                          </button>

                          <div className="flex items-center space-x-3 border-b border-gray-200 pb-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                              <Award className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-gray-900">Gugus Depan Pangkalan</h3>
                              <p className="text-xs text-gray-500">{viewingGudepDetail.nama_pangkalan}</p>
                            </div>
                          </div>

                          <div className="space-y-4 text-xs">
                            <div className="bg-gray-900/20 rounded-xl p-4 border border-gray-200 space-y-2.5">
                              <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Kwartir Ranting Induk</h4>
                              <div className="grid grid-cols-3">
                                <span className="text-gray-500">Kecamatan</span>
                                <span className="col-span-2 font-bold text-gray-900">{kw ? kw.nama_kecamatan : 'Tasikmalaya'}</span>
                              </div>
                              {kw && (
                                <>
                                  <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Ketua Kwarran</span>
                                    <span className="col-span-2 text-gray-800">{kw.ketua}</span>
                                  </div>
                                  <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Sekretaris</span>
                                    <span className="col-span-2 text-gray-800">{kw.sekretaris}</span>
                                  </div>
                                  <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Bendahara</span>
                                    <span className="col-span-2 text-gray-800">{kw.bendahara}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => setViewingGudepDetail(null)}
                              className="px-5 py-2 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <form onSubmit={handleSaveGudep} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    Registrasi Gugus Depan Pangkalan Baru
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Nama Pangkalan / Gudep *</label>
                      <input
                        type="text"
                        required
                        value={gdNama}
                        onChange={(e) => setGdNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Contoh: SMAN 1 Cisayong"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Kwartir Ranting Induk *</label>
                      <select
                        required
                        value={gdKwarran}
                        onChange={(e) => setGdKwarran(e.target.value)}
                        className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      >
                        <option value="">-- Pilih Kwarran --</option>
                        {allKwarran
                          .filter(kw => isKwarcabAdmin || (user.role === 'kwarran' && kw.id === user.ref_id))
                          .map(kw => (
                          <option key={kw.id} value={kw.id}>Kecamatan {kw.nama_kecamatan}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: SAKA LIST (KWARCAB) --- */}
          {activeTab === 'saka' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Satuan Karya Pramuka se-Kabupaten</span>
                    <button
                      onClick={() => {
                        setFormMode('add');
                        setSkNama('');
                        setSkKetua('');
                        setSkSekretaris('');
                        setSkBendahara('');
                        setSkStatus('aktif');
                      }}
                      className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Tambah Saka</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-100 text-gray-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-5">Nama Satuan Karya</th>
                          <th className="py-4 px-5">Pamong / Ketua Harian</th>
                          <th className="py-4 px-5">Sekretaris</th>
                          <th className="py-4 px-5">Bendahara</th>
                          <th className="py-4 px-5 text-center">Status</th>
                          <th className="py-4 px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {allSaka.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-5 text-center text-gray-500 font-medium italic">
                              Belum ada Satuan Karya Pramuka yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          allSaka.map((sk) => (
                            <tr key={sk.id} className="hover:bg-gray-50 transition">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 text-green-700">
                                    <Compass className="w-4 h-4" />
                                  </div>
                                  <div className="font-bold text-gray-900">
                                    {sk.nama_saka}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-medium text-gray-800">
                                {sk.ketua}
                              </td>
                              <td className="py-3.5 px-5 text-gray-600">
                                {sk.sekretaris}
                              </td>
                              <td className="py-3.5 px-5 text-gray-600">
                                {sk.bendahara}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                  sk.status === 'aktif' 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                    : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                  {sk.status ? sk.status.toUpperCase() : 'AKTIF'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setViewingSakaDetail(sk)}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-green-700" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFormMode('edit');
                                      setSelectedItem(sk);
                                      setSkNama(sk.nama_saka);
                                      setSkKetua(sk.ketua);
                                      setSkSekretaris(sk.sekretaris);
                                      setSkBendahara(sk.bendahara);
                                      setSkStatus(sk.status);
                                    }}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Edit Saka"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-white/5">
                      {allSaka.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 font-medium italic text-xs">
                          Belum ada Satuan Karya Pramuka yang terdaftar.
                        </div>
                      ) : (
                        allSaka.map((sk) => (
                          <div key={sk.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">{sk.nama_saka}</h4>
                                <p className="text-[10px] text-gray-500/70 mt-0.5">Pamong: {sk.ketua}</p>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                sk.status === 'aktif' 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}>
                                {sk.status ? sk.status.toUpperCase() : 'AKTIF'}
                              </span>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => setViewingSakaDetail(sk)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 transition"
                              >
                                <Eye className="w-3 h-3 text-green-700" />
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => {
                                  setFormMode('edit');
                                  setSelectedItem(sk);
                                  setSkNama(sk.nama_saka);
                                  setSkKetua(sk.ketua);
                                  setSkSekretaris(sk.sekretaris);
                                  setSkBendahara(sk.bendahara);
                                  setSkStatus(sk.status);
                                }}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-500 transition"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Saka Detail Modal */}
                  {viewingSakaDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                      <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-6 sm:p-8 space-y-6">
                        <button
                          onClick={() => setViewingSakaDetail(null)}
                          className="absolute top-5 right-5 z-50 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5 text-green-700" />
                        </button>

                        <div className="flex items-center space-x-3 border-b border-gray-200 pb-4">
                          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                            <Compass className="w-6 h-6 animate-spin-slow" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-gray-900">Profil Satuan Karya Pramuka</h3>
                            <p className="text-xs text-gray-500">{viewingSakaDetail.nama_saka}</p>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Pamong / Ketua Harian</span>
                            <span className="col-span-2 font-bold text-gray-900">{viewingSakaDetail.ketua}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Sekretaris</span>
                            <span className="col-span-2 text-gray-800">{viewingSakaDetail.sekretaris}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Bendahara</span>
                            <span className="col-span-2 text-gray-800">{viewingSakaDetail.bendahara}</span>
                          </div>
                          <div className="grid grid-cols-3 py-2 border-b border-white/5">
                            <span className="text-gray-500 font-medium">Status</span>
                            <span className="col-span-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                                viewingSakaDetail.status === 'aktif' 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}>
                                {viewingSakaDetail.status ? viewingSakaDetail.status.toUpperCase() : 'AKTIF'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setFormMode('edit');
                              setSelectedItem(viewingSakaDetail);
                              setSkNama(viewingSakaDetail.nama_saka);
                              setSkKetua(viewingSakaDetail.ketua);
                              setSkSekretaris(viewingSakaDetail.sekretaris);
                              setSkBendahara(viewingSakaDetail.bendahara);
                              setSkStatus(viewingSakaDetail.status);
                              setViewingSakaDetail(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition flex items-center space-x-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sunting Data</span>
                          </button>
                          <button
                            onClick={() => setViewingSakaDetail(null)}
                            className="px-4 py-2 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSaveSaka} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    {formMode === 'add' ? 'Registrasi Satuan Karya (Saka) Baru' : 'Sunting Data Saka'}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Nama Saka *</label>
                      <input
                        type="text"
                        required
                        value={skNama}
                        onChange={(e) => setSkNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Contoh: Saka Bhayangkara"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Pamong / Ketua Harian *</label>
                      <input
                        type="text"
                        required
                        value={skKetua}
                        onChange={(e) => setSkKetua(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Sekretaris *</label>
                      <input
                        type="text"
                        required
                        value={skSekretaris}
                        onChange={(e) => setSkSekretaris(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Bendahara *</label>
                      <input
                        type="text"
                        required
                        value={skBendahara}
                        onChange={(e) => setSkBendahara(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: BERITA SYNERGY --- */}
          {activeTab === 'berita' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">Daftar warta berita kepramukaan se-kabupaten</span>
                    <button
                      onClick={() => {
                        setFormMode('add');
                        setBerJudul('');
                        setBerKonten('');
                        setBerCover('');
                        setBerIsFeatured(false);
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                    >
                      <Plus className="w-4.5 h-4.5 text-green-700" />
                      <span>Tulis Warta</span>
                    </button>
                  </div>

                  {/* Kwarcab superadmin Review section */}
                  {canManage('berita') && beritaList.some(b => b.status === 'pending') && (
                    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-2xl p-5 border border-amber-500/30 space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-green-700 animate-pulse" />
                        <span>Pengajuan Warta Pending Menunggu Review (Superadmin Only)</span>
                      </h3>
                      <div className="space-y-3.5">
                        {beritaList.filter(b => b.status === 'pending').map((b) => (
                          <div key={b.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs">
                            <div className="max-w-xl space-y-1">
                              <span className="inline-block bg-green-800 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded">
                                Oleh: {b.author_nama} ({b.author_type.toUpperCase()})
                              </span>
                              <h4 className="text-sm font-bold text-gray-900">{b.judul}</h4>
                              <p className="text-gray-500 font-light line-clamp-1 leading-relaxed">{b.konten}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              {/* 1. Lihat Detail before approve */}
                              <button
                                onClick={() => setViewingBeritaDetail(b)}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 font-bold uppercase text-[9px] tracking-wide flex items-center space-x-1 transition"
                              >
                                <Eye className="w-3 h-3 text-green-700" />
                                <span>Lihat Detail</span>
                              </button>
                              
                              {/* 2. Edit sebelum approve */}
                              <button
                                onClick={() => {
                                  setFormMode('edit');
                                  setSelectedItem(b);
                                  setBerJudul(b.judul);
                                  setBerKonten(b.konten);
                                  setBerCover(b.gambar_cover);
                                  setBerIsFeatured(b.is_featured);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/20 text-amber-300 hover:text-amber-200 font-bold uppercase text-[9px] tracking-wide flex items-center space-x-1 transition"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Sunting</span>
                              </button>

                              <button
                                onClick={() => handleReviewBerita(b.id, 'approve')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-900 font-bold uppercase text-[9px] tracking-wide transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewBerita(b.id, 'reject')}
                                className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-900 font-bold uppercase text-[9px] tracking-wide transition"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clean List View (Row / Table style instead of cards) */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                     {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-100 text-gray-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-5">Warta Berita</th>
                          <th className="py-4 px-5">Penulis & Peran</th>
                          <th className="py-4 px-5">Tanggal Dibuat</th>
                          <th className="py-4 px-5 text-center">Hero Landing</th>
                          <th className="py-4 px-5 text-center">Status</th>
                          <th className="py-4 px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {beritaList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-5 text-center text-gray-500 font-medium italic">
                              Belum ada rilis berita kepramukaan yang dibuat.
                            </td>
                          </tr>
                        ) : (
                          beritaList.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50 transition">
                              <td className="py-3.5 px-5 max-w-xs lg:max-w-md">
                                <div className="flex items-center space-x-3">
                                  {b.gambar_cover ? (
                                    <img src={b.gambar_cover} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 text-green-700">
                                      <BookOpen className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 
                                      onClick={() => setViewingBeritaDetail(b)}
                                      className="font-bold text-gray-900 truncate hover:text-green-700 cursor-pointer transition"
                                    >
                                      {b.judul}
                                    </h4>
                                    <p className="text-gray-400 font-light truncate mt-0.5">{b.konten}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-900">{b.author_nama}</div>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${getRoleBadge(b.author_type)}`}>
                                    {b.author_type.toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-gray-600">
                                {new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                {b.status === 'approved' ? (
                                  <button
                                    disabled={!canManage('berita')}
                                    onClick={() => handleToggleFeaturedBerita(b.id, b.is_featured)}
                                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                      b.is_featured
                                        ? 'bg-green-50 border-purple-400 text-gray-500 hover:bg-green-100'
                                        : 'bg-white border border-gray-100 shadow-sm border-gray-200 text-gray-600/50 hover:bg-gray-50'
                                    } ${canManage('berita') ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                    title={canManage('berita') ? 'Klik untuk mengubah status Tampil di Hero' : 'Hanya Kwarcab yang dapat menyetel Hero'}
                                  >
                                    <Sparkles className={`w-3.5 h-3.5 ${b.is_featured ? 'text-green-700 fill-[#D4AF37]' : 'text-gray-500/30'}`} />
                                    <span>{b.is_featured ? 'Aktif' : 'Non-aktif'}</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-600/30 text-[10px] font-light italic">Belum Approved</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                  b.status === 'approved' 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                    : b.status === 'pending'
                                    ? 'bg-amber-950/80 border border-amber-500/20 text-amber-300'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                  {b.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  {/* Detail Button */}
                                  <button
                                    onClick={() => setViewingBeritaDetail(b)}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-green-700" />
                                  </button>

                                  {/* Edit/Hapus Actions */}
                                  {(canManage('berita') || b.author_id === user.ref_id) && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setFormMode('edit');
                                          setSelectedItem(b);
                                          setBerJudul(b.judul);
                                          setBerKonten(b.konten);
                                          setBerCover(b.gambar_cover);
                                          setBerIsFeatured(b.is_featured);
                                        }}
                                        className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
                                        title="Edit Warta"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBerita(b.id)}
                                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:text-red-300 hover:bg-red-950/60 transition"
                                        title="Hapus"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Mobile stacked row list layout */}
                    <div className="md:hidden divide-y divide-white/5">
                      {beritaList.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 font-medium italic text-xs">
                          Belum ada rilis berita kepramukaan yang dibuat.
                        </div>
                      ) : (
                        beritaList.map((b) => (
                          <div key={b.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${getRoleBadge(b.author_type)} mb-1`}>
                                  {b.author_type.toUpperCase()}
                                </span>
                                <h4 
                                  onClick={() => setViewingBeritaDetail(b)}
                                  className="text-xs font-bold text-gray-900 hover:text-green-700"
                                >
                                  {b.judul}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Oleh: {b.author_nama} &mdash; {new Date(b.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`flex-shrink-0 inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                                b.status === 'approved' 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                  : b.status === 'pending'
                                  ? 'bg-amber-950/80 border border-amber-500/20 text-amber-300'
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}>
                                {b.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Mobile action row */}
                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => setViewingBeritaDetail(b)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-600 transition"
                              >
                                <Eye className="w-3 h-3 text-green-700" />
                                <span>Detail</span>
                              </button>
                              {b.status === 'approved' && (
                                <button
                                  disabled={!canManage('berita')}
                                  onClick={() => handleToggleFeaturedBerita(b.id, b.is_featured)}
                                  className={`flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border text-[10px] font-bold transition ${
                                    b.is_featured
                                      ? 'border-purple-400 text-green-700 bg-green-800/20'
                                      : 'border-gray-200 text-gray-600/50'
                                  } ${canManage('berita') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                >
                                  <Sparkles className={`w-3 h-3 ${b.is_featured ? 'text-green-700 fill-[#D4AF37]' : 'text-gray-500/30'}`} />
                                  <span>Hero: {b.is_featured ? 'On' : 'Off'}</span>
                                </button>
                              )}
                              {(canManage('berita') || b.author_id === user.ref_id) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setFormMode('edit');
                                      setSelectedItem(b);
                                      setBerJudul(b.judul);
                                      setBerKonten(b.konten);
                                      setBerCover(b.gambar_cover);
                                      setBerIsFeatured(b.is_featured);
                                    }}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-gray-100 shadow-sm border border-gray-200 text-[10px] font-bold text-gray-500 transition"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBerita(b.id)}
                                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-950/40 text-[10px] font-bold text-red-400 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveBerita} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    {formMode === 'add' ? 'Tulis Warta Baru' : 'Sunting Warta'}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Judul Berita *</label>
                      <input
                        type="text"
                        required
                        value={berJudul}
                        onChange={(e) => setBerJudul(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Contoh: Raimuna Cabang Tasikmalaya Berlangsung Semarak"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Konten / Isi Warta Lengkap *</label>
                      <textarea
                        required
                        value={berKonten}
                        onChange={(e) => setBerKonten(e.target.value)}
                        rows={6}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Ketik rilis berita kepramukaan lengkap di sini..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Gambar Cover (Opsional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBase64Upload(e, setBerCover, {
                          maxDimension: 1200,
                          quality: 0.46,
                          filenamePrefix: 'cover_',
                          successMessage: 'Cover berita berhasil dikompresi maksimal dan diunggah!'
                        })}
                        className="w-full bg-white text-xs text-gray-900 px-4 py-2 rounded-xl border border-gray-200"
                      />
                      {berCover && (
                        <img src={berCover} alt="Preview Cover" className="w-32 h-20 object-cover mt-2 rounded-lg border border-gray-200" />
                      )}
                    </div>

                    {canManage('berita') && (
                      <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-gray-900/20 border border-green-500/10">
                        <input
                          id="is_featured"
                          type="checkbox"
                          checked={berIsFeatured}
                          onChange={(e) => setBerIsFeatured(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-green-200 text-green-700 focus:ring-purple-500/20 cursor-pointer bg-white"
                        />
                        <label htmlFor="is_featured" className="text-xs text-gray-600 select-none cursor-pointer">
                          <span className="block font-bold text-gray-900 mb-0.5">Tampilkan di Hero Landing Page (Sorotan Utama)</span>
                          <span className="text-gray-500/70 font-light block">Jika diaktifkan, warta berita ini akan menjadi slide banner utama di halaman beranda.</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}

              {/* --- NEWS DETAIL MODAL --- */}
              {viewingBeritaDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                  <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-5 sm:p-8 space-y-6">
                    {/* Close button */}
                    <button
                      onClick={() => setViewingBeritaDetail(null)}
                      className="absolute top-5 right-5 z-50 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5 text-green-700" />
                    </button>

                    {/* Cover image */}
                    {viewingBeritaDetail.gambar_cover ? (
                      <img 
                        src={viewingBeritaDetail.gambar_cover} 
                        alt="Cover Warta" 
                        className="w-full h-56 sm:h-64 object-cover rounded-2xl border border-gray-200 shadow-md"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                        <BookOpen className="w-10 h-10 text-green-700 mb-2" />
                        <span className="text-[10px] font-bold text-gray-600">Warta berita tidak memiliki gambar cover</span>
                      </div>
                    )}

                    {/* Meta labels */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-extrabold border ${getRoleBadge(viewingBeritaDetail.author_type)}`}>
                        {viewingBeritaDetail.author_type.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-extrabold border ${
                        viewingBeritaDetail.status === 'approved' 
                          ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300' 
                          : viewingBeritaDetail.status === 'pending'
                          ? 'bg-amber-950/80 border border-amber-500/30 text-amber-300'
                          : 'bg-red-950/80 border border-red-500/30 text-red-300'
                      }`}>
                        {viewingBeritaDetail.status.toUpperCase()}
                      </span>
                      <span className="text-gray-500 ml-auto font-medium">
                        Dibuat: {new Date(viewingBeritaDetail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                        {viewingBeritaDetail.judul}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Penulis: <span className="text-green-700 font-bold">{viewingBeritaDetail.author_nama}</span>
                      </p>
                    </div>

                    {/* Content text */}
                    <div className="text-xs sm:text-sm text-gray-800/90 leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-4">
                      {viewingBeritaDetail.konten}
                    </div>

                    {/* Action buttons footer */}
                    <div className="border-t border-gray-200 pt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {canManage('berita') && viewingBeritaDetail.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                handleReviewBerita(viewingBeritaDetail.id, 'approve');
                                setViewingBeritaDetail(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-gray-900 text-[10px] font-bold uppercase tracking-wider transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                handleReviewBerita(viewingBeritaDetail.id, 'reject');
                                setViewingBeritaDetail(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-gray-900 text-[10px] font-bold uppercase tracking-wider transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Edit option inside the viewer */}
                        {(canManage('berita') || viewingBeritaDetail.author_id === user.ref_id) && (
                          <button
                            onClick={() => {
                              setFormMode('edit');
                              setSelectedItem(viewingBeritaDetail);
                              setBerJudul(viewingBeritaDetail.judul);
                              setBerKonten(viewingBeritaDetail.konten);
                              setBerCover(viewingBeritaDetail.gambar_cover);
                              setViewingBeritaDetail(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-green-300 text-green-700 hover:bg-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider transition flex items-center space-x-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sunting</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setViewingBeritaDetail(null)}
                        className="px-4 py-2 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition"
                      >
                        Tutup
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: AGENDA ACTIVITIES --- */}
          {activeTab === 'agenda' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Agenda Kegiatan</span>
                    <button
                      onClick={() => {
                        setFormMode('add');
                        setAgeJudul('');
                        setAgeDeskripsi('');
                        setAgeMulai('');
                        setAgeSelesai('');
                        setAgeKategori('mandiri');
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                    >
                      <Plus className="w-4 h-4 text-green-700" />
                      <span>Buat Agenda</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {agendaList.map((ag) => (
                      <div key={ag.id} className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-extrabold text-green-700 uppercase tracking-wider">{ag.kategori}</span>
                          <h3 className="text-sm font-bold text-gray-900 mt-1.5">{ag.judul}</h3>
                          <p className="text-xs text-gray-500 font-light line-clamp-2 mt-1">{ag.deskripsi}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[10px] text-gray-500">
                          <span>Mulai: {ag.tanggal_mulai} s/d {ag.tanggal_selesai}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setFormMode('edit');
                                setSelectedItem(ag);
                                setAgeJudul(ag.judul);
                                setAgeDeskripsi(ag.deskripsi);
                                setAgeMulai(ag.tanggal_mulai);
                                setAgeSelesai(ag.tanggal_selesai);
                                setAgeKategori(ag.kategori);
                              }}
                              className="p-1 rounded bg-white border border-gray-100 shadow-sm"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteAgenda(ag.id)} className="p-1 rounded bg-red-950/40 text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveAgenda} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    {formMode === 'add' ? 'Buat Agenda Kegiatan Baru' : 'Sunting Agenda'}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Judul Kegiatan *</label>
                      <input
                        type="text"
                        required
                        value={ageJudul}
                        onChange={(e) => setAgeJudul(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Deskripsi Agenda</label>
                      <textarea
                        value={ageDeskripsi}
                        onChange={(e) => setAgeDeskripsi(e.target.value)}
                        rows={3}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600">Tanggal Mulai *</label>
                        <input
                          type="date"
                          required
                          value={ageMulai}
                          onChange={(e) => setAgeMulai(e.target.value)}
                          className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600">Tanggal Selesai *</label>
                        <input
                          type="date"
                          required
                          value={ageSelesai}
                          onChange={(e) => setAgeSelesai(e.target.value)}
                          className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600">Kategori Agenda *</label>
                        <select
                          value={ageKategori}
                          onChange={(e) => setAgeKategori(e.target.value as any)}
                          className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        >
                          <option value="mandiri">Mandiri</option>
                          <option value="partisipasi_daerah">Partisipasi Daerah</option>
                          <option value="partisipasi_nasional">Partisipasi Nasional</option>
                          <option value="partisipasi_internasional">Partisipasi Internasional</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: CONFIG PROFILE (KWARCAB) --- */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                Konfigurasi Profil Utama Kwartir Cabang Tasikmalaya
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-600">Visi Kwarcab *</label>
                  <textarea
                    required
                    value={confVisi}
                    onChange={(e) => setConfVisi(e.target.value)}
                    rows={2}
                    className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-600">Misi Kwarcab (Satu misi per baris) *</label>
                  <textarea
                    required
                    value={confMisi}
                    onChange={(e) => setConfMisi(e.target.value)}
                    rows={5}
                    className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-600">Sejarah Kwarcab *</label>
                  <textarea
                    required
                    value={confSejarah}
                    onChange={(e) => setConfSejarah(e.target.value)}
                    rows={6}
                    className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-600">Mode Hero Landingpage *</label>
                    <select
                      value={confHeroMode}
                      onChange={(e) => setConfHeroMode(e.target.value as any)}
                      className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                    >
                      <option value="statis">Statis (1 Banner Gambar)</option>
                      <option value="dinamis">Dinamis (Carousel Berita Featured)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-600">Banner Statis URL (Jika Mode Statis)</label>
                    <input
                      type="text"
                      value={confBanner}
                      onChange={(e) => setConfBanner(e.target.value)}
                      className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">Media Sosial Kwarcab (Footer Landingpage)</h4>
                  <p className="text-[11px] text-gray-500/70 mt-1">
                    Tempel link akun resmi Kwarcab. Yang dikosongkan tidak akan ditampilkan sebagai tombol di footer.
                  </p>
                </div>
                <SosmedFields value={confSosmed} onChange={setConfSosmed} />
              </div>

              {/* CORE LEADERS PROFILES */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">Pimpinan Inti Kwartir Cabang</h4>
                  <p className="text-[11px] text-gray-500/70 mt-1">
                    Masukkan nama beserta gelar dan URL foto (opsional) untuk 4 Pimpinan Inti Kwarcab.
                  </p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Ketua */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h5 className="text-xs font-bold text-green-700">Ketua Kwarcab</h5>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Nama & Gelar Lengkap</label>
                      <input type="text" value={confKetuaKwarcabNama} onChange={(e) => setConfKetuaKwarcabNama(e.target.value)} className="w-full bg-white text-sm px-3 py-2 rounded-lg border border-gray-300" placeholder="Cth: H. Cecep Nurul Yakin, S.Pd., M.A.P." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Foto Profil</label>
                      <div className="flex items-center gap-3">
                        {confKetuaKwarcabFoto && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={confKetuaKwarcabFoto} alt="Ketua" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleCompressedUpload(e, setConfKetuaKwarcabFoto)} className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ketua Harian */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h5 className="text-xs font-bold text-green-700">Ketua Harian</h5>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Nama & Gelar Lengkap</label>
                      <input type="text" value={confKetuaHarianNama} onChange={(e) => setConfKetuaHarianNama(e.target.value)} className="w-full bg-white text-sm px-3 py-2 rounded-lg border border-gray-300" placeholder="Cth: Drs. H. Ahmad Saefudin, M.Pd." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Foto Profil</label>
                      <div className="flex items-center gap-3">
                        {confKetuaHarianFoto && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={confKetuaHarianFoto} alt="Ketua Harian" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleCompressedUpload(e, setConfKetuaHarianFoto)} className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sekretaris */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h5 className="text-xs font-bold text-green-700">Sekretaris Kwarcab</h5>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Nama & Gelar Lengkap</label>
                      <input type="text" value={confSekretarisNama} onChange={(e) => setConfSekretarisNama(e.target.value)} className="w-full bg-white text-sm px-3 py-2 rounded-lg border border-gray-300" placeholder="Cth: Asep Supriadi, S.Sos." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Foto Profil</label>
                      <div className="flex items-center gap-3">
                        {confSekretarisFoto && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={confSekretarisFoto} alt="Sekretaris" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleCompressedUpload(e, setConfSekretarisFoto)} className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bendahara */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h5 className="text-xs font-bold text-green-700">Bendahara Kwarcab</h5>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Nama & Gelar Lengkap</label>
                      <input type="text" value={confBendaharaNama} onChange={(e) => setConfBendaharaNama(e.target.value)} className="w-full bg-white text-sm px-3 py-2 rounded-lg border border-gray-300" placeholder="Cth: Hj. Neni Nuraeni, S.E." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Foto Profil</label>
                      <div className="flex items-center gap-3">
                        {confBendaharaFoto && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={confBendaharaFoto} alt="Bendahara" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleCompressedUpload(e, setConfBendaharaFoto)} className="w-full text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pusdatin */}
                <div className="mt-6 space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h5 className="text-xs font-bold text-blue-700">Kepala Pusdatin (Khusus TTD Surat Legalitas)</h5>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Nama & Gelar Lengkap</label>
                      <input type="text" value={confKetuaPusdatinNama} onChange={(e) => setConfKetuaPusdatinNama(e.target.value)} className="w-full bg-white text-sm px-3 py-2 rounded-lg border border-blue-200" placeholder="Cth: Dadan Wildan, S.Kom., M.Kom." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-600 font-semibold">Foto Profil / Stempel Digital</label>
                      <div className="flex items-center gap-3">
                        {confKetuaPusdatinFoto && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={confKetuaPusdatinFoto} alt="Kepala Pusdatin" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleCompressedUpload(e, setConfKetuaPusdatinFoto)} className="w-full text-[11px] text-gray-700 bg-white border border-blue-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold text-xs uppercase tracking-wider">
                  Simpan Konfigurasi Profil
                </button>
              </div>
            </form>
          )}

          {/* --- TAB CONTENT: MEDIA SOSIAL KWARRAN (ADMIN KWARRAN) --- */}
          {activeTab === 'kwarran_sosmed' && user.role === 'kwarran' && (
            <form onSubmit={handleSaveKwarranSosmed} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase">
                  Media Sosial Kwarran {ownKwarran ? ownKwarran.nama_kecamatan : ''}
                </h3>
                <p className="text-[11px] text-gray-500/70 mt-1">
                  Link ini tampil sebagai tombol di halaman detail Kwarran pada landingpage. Kosongkan kolom yang tidak dipakai.
                </p>
              </div>

              {ownKwarran ? (
                <>
                  <SosmedFields value={kwSosmed} onChange={setKwSosmed} />
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold text-xs uppercase tracking-wider">
                      Simpan Media Sosial
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Akun ini belum terhubung ke data Kwartir Ranting. Hubungi Superadmin Kwarcab.
                </p>
              )}
            </form>
          )}

          {/* --- TAB CONTENT: NOTIFICATIONS PANEL --- */}
          {activeTab === 'notif' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Antrean Notifikasi Aktivitas</h3>
              
              <div className="space-y-3">
                {notifList.length === 0 ? (
                  <div className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-2xl p-8 text-center text-gray-400 font-light">
                    Tidak ada notifikasi aktivitas baru.
                  </div>
                ) : (
                  notifList.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-xl border flex items-start gap-3 transition-colors duration-200 ${
                        n.is_read 
                          ? 'bg-black/10 border-white/5 text-gray-600/60' 
                          : 'bg-gray-100 border-green-300 text-gray-900 shadow-md'
                      }`}
                    >
                      <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${n.is_read ? 'text-gray-400/50' : 'text-green-700'}`} />
                      <div className="flex-grow">
                        <p className="text-xs leading-relaxed font-light">{n.pesan}</p>
                        <span className="text-[10px] text-gray-500/70 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString('id-ID')} &bull; {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkNotifRead(n.id)}
                          className="text-[9px] font-bold text-green-700 hover:text-gray-900 uppercase px-2 py-1 bg-white border border-gray-100 shadow-sm rounded border border-[#D4AF37]/25"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- TAB CONTENT: USER ACCOUNTS (KWARCAB) --- */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Manajemen Pengguna Aplikasi se-Kabupaten</span>
                    <button
                      onClick={() => {
                        setFormMode('add');
                        setSelectedItem(null);
                        setUNama('');
                        setUEmail('');
                        setUPassword('');
                        setURole('gudep');
                        setURefId('');
                        setUPermissions([]);
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition"
                    >
                      <Plus className="w-4 h-4 text-green-700" />
                      <span>Akun Baru</span>
                    </button>
                  </div>

                  <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[9px] font-bold tracking-wider">
                          <th className="p-4">Nama Pengguna</th>
                          <th className="p-4">Email / Login</th>
                          <th className="p-4">Peran (Role)</th>
                          <th className="p-4">Akses Pengelolaan</th>
                          <th className="p-4">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {userList
                          .filter(u => {
                            if (isKwarcabAdmin) return true;
                            if (user.role === 'kwarran') {
                              return u.role === 'gudep' && gudepList.some(g => g.id === u.ref_id && g.kwartir_ranting_id === user.ref_id);
                            }
                            return false;
                          })
                          .map((u) => (
                          <tr key={u.id} className="hover:bg-white/[0.01]">
                            <td className="p-4 font-bold text-gray-900 text-sm">{u.nama}</td>
                            <td className="p-4 font-light">{u.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRoleBadge(u.role)}`}>
                                {getRoleLabel(u.role)}
                              </span>
                            </td>
                            <td className="p-4">
                              {u.role === 'staff_kwarcab' && u.permissions?.length ? (
                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                  {u.permissions.map(permission => (
                                    <span key={permission} className="px-2 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm border border-gray-200 text-[9px] font-bold text-gray-600">
                                      {getPermissionLabel(permission)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-500/50">Akses mengikuti role</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setFormMode('edit');
                                  setSelectedItem(u);
                                  setUNama(u.nama);
                                  setUEmail(u.email);
                                  setUPassword('');
                                  setURole(u.role);
                                  setURefId(u.ref_id || '');
                                  setUPermissions(u.permissions || []);
                                }}
                                className="p-1.5 bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 rounded-lg transition border border-gray-200"
                                title="Edit akun"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-red-950/40 text-red-400 hover:text-gray-900 rounded-lg transition" title="Hapus akun">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveUser} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-white/5 pb-2">
                    {formMode === 'add' ? 'Buat Akun Pengguna Baru' : `Edit Akun: ${selectedItem?.nama}`}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Nama Lengkap Akun *</label>
                      <input
                        type="text"
                        required
                        value={uNama}
                        onChange={(e) => setUNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Contoh: Pamong Saka Wirakartika"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Email Login *</label>
                      <input
                        type="email"
                        required
                        value={uEmail}
                        onChange={(e) => setUEmail(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="saka_wirakartika@kwarcabtasik.id"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Password Akses {formMode === 'add' ? '*' : '(kosongkan jika tidak diubah)'}</label>
                      <input
                        type="password"
                        required={formMode === 'add'}
                        value={uPassword}
                        onChange={(e) => setUPassword(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        placeholder="Ketik password rahasia"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600">Peran / Role Pengguna *</label>
                      <select
                        value={uRole}
                        onChange={(e) => {
                          const nextRole = e.target.value as UserRole;
                          setURole(nextRole);
                          if (nextRole === 'staff_kwarcab') {
                            setURefId('');
                          } else {
                            setUPermissions([]);
                          }
                        }}
                        className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                      >
                        {isKwarcabAdmin && <option value="staff_kwarcab">Staf Admin Kwarcab</option>}
                        {isKwarcabAdmin && <option value="kwarran">Kwartir Ranting</option>}
                        <option value="gudep">Gugus Depan</option>
                        {isKwarcabAdmin && <option value="saka">Satuan Karya (Saka)</option>}
                      </select>
                    </div>

                    {uRole !== 'staff_kwarcab' && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600">Ref ID Organisasi Induk *</label>
                        <select
                          required
                          value={uRefId}
                          onChange={(e) => setURefId(e.target.value)}
                          className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200"
                        >
                          <option value="">-- Pilih Organisasi Referensi --</option>
                          {uRole === 'kwarran' && allKwarran.map(kw => <option key={kw.id} value={kw.id}>Kwarran Kecamatan {kw.nama_kecamatan}</option>)}
                          {uRole === 'saka' && allSaka.map(sk => <option key={sk.id} value={sk.id}>{sk.nama_saka}</option>)}
                          {uRole === 'gudep' && gudepList
                            .filter(gd => isKwarcabAdmin || (user.role === 'kwarran' && gd.kwartir_ranting_id === user.ref_id))
                            .map(gd => <option key={gd.id} value={gd.id}>{gd.nama_pangkalan}</option>)}
                        </select>
                      </div>
                    )}

                    {uRole === 'staff_kwarcab' && (
                      <div className="space-y-3 sm:col-span-2 rounded-2xl border border-gray-200 bg-black/20 p-4">
                        <div>
                          <label className="text-xs text-gray-600 font-bold uppercase tracking-wider">Centang Akses Pengelolaan *</label>
                          <p className="text-[10px] text-gray-500/70 mt-1">Staf hanya melihat dan mengelola modul yang dicentang di bawah ini.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {KWARCAB_ACCESS_OPTIONS.map(option => {
                            const checked = uPermissions.includes(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                                  checked
                                    ? 'bg-green-800/30 border-green-400 text-gray-900'
                                    : 'bg-white/[0.03] border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setUPermissions(prev => e.target.checked
                                      ? [...prev, option.id]
                                      : prev.filter(permission => permission !== option.id)
                                    );
                                  }}
                                  className="mt-0.5 w-4 h-4 rounded border-green-200 text-green-700 focus:ring-purple-500/20 bg-white"
                                />
                                <span>
                                  <span className="block text-xs font-bold">{option.label}</span>
                                  <span className="block text-[10px] text-gray-500/70 mt-0.5 leading-snug">{option.description}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 bg-white border border-gray-100 shadow-sm rounded-xl text-gray-600">Batal</button>
                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition">Simpan</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: KAMPUNG PRAMUKA MANAGEMENT (KWARCAB) --- */}
          {activeTab === 'kampung_pramuka' && (
            <div className="space-y-6 animate-fade-in">
              {formMode === 'list' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Kelola Sebaran Kampung Pramuka</h3>
                      <p className="text-xs text-gray-500 font-light mt-0.5">Kelola titik sebaran, profil sejarah, dan keunggulan Kampung Pramuka se-Kabupaten Tasikmalaya</p>
                    </div>
                    <button
                      onClick={() => {
                        setFormMode('add');
                        setSelectedItem(null);
                        setKpNama('');
                        setKpKecamatan('');
                        setKpLatitude('');
                        setKpLongitude('');
                        setKpFoto('');
                        setKpSejarah('');
                        setKpKeunggulan('');
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Titik Baru</span>
                    </button>
                  </div>

                  {/* List View */}
                  <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-black/25 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="p-4">Nama Kampung</th>
                            <th className="p-4">Kecamatan</th>
                            <th className="p-4">Koordinat</th>
                            <th className="p-4">Foto</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800 font-light">
                          {kpList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400 font-light">
                                Belum ada data Kampung Pramuka. Silakan tambahkan titik baru.
                              </td>
                            </tr>
                          ) : (
                            kpList.map((kp) => (
                              <tr key={kp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-gray-900">{kp.nama}</td>
                                <td className="p-4">Kec. {kp.kecamatan}</td>
                                <td className="p-4 font-mono text-[10px] text-green-700">
                                  {kp.latitude?.toFixed?.(5) || kp.latitude}, {kp.longitude?.toFixed?.(5) || kp.longitude}
                                </td>
                                <td className="p-4">
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {kp.foto?.split?.(',')?.filter?.(Boolean)?.map?.((f, i) => (
                                      <img 
                                        key={i} 
                                        src={f} 
                                        alt="" 
                                        className="w-7 h-7 rounded-full object-cover border border-[#0F0A1A]" 
                                        referrerPolicy="no-referrer"
                                      />
                                    )) || (
                                      <span className="text-[10px] text-gray-300 font-light">Tidak ada foto</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(kp);
                                      setFormMode('edit');
                                      setKpNama(kp.nama);
                                      setKpKecamatan(kp.kecamatan);
                                      setKpLatitude(String(kp.latitude));
                                      setKpLongitude(String(kp.longitude));
                                      setKpFoto(kp.foto);
                                      setKpSejarah(kp.sejarah);
                                      setKpKeunggulan(kp.keunggulan);
                                    }}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm border border-gray-200 hover:border-purple-400 hover:bg-gray-900/20 text-gray-600 hover:text-gray-900 transition"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKampungPramuka(kp.id)}
                                    className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm border border-gray-200 hover:border-red-500 hover:bg-red-950/20 text-red-400 hover:text-gray-900 transition"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveKampungPramuka} className="bg-white shadow-xl rounded-2xl border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-700" />
                    <span>{formMode === 'add' ? 'Tambah Kampung Pramuka Baru' : `Edit Kampung Pramuka: ${selectedItem?.nama}`}</span>
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Nama Kampung Pramuka *</label>
                      <input
                        type="text"
                        required
                        value={kpNama}
                        onChange={(e) => setKpNama(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="Contoh: Kampung Pramuka Cisayong"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Kecamatan *</label>
                      <select
                        required
                        value={kpKecamatan}
                        onChange={(e) => setKpKecamatan(e.target.value)}
                        className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {allKwarran.map(kw => (
                          <option key={kw.id} value={kw.nama_kecamatan}>{kw.nama_kecamatan}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Garis Lintang (Latitude) *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={kpLatitude}
                        onChange={(e) => setKpLatitude(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="Contoh: -7.2858"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Garis Bujur (Longitude) *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={kpLongitude}
                        onChange={(e) => setKpLongitude(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="Contoh: 108.1472"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Foto Kampung Pramuka (URLs, pisahkan dengan koma) *</label>
                      <input
                        type="text"
                        required
                        value={kpFoto}
                        onChange={(e) => setKpFoto(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="https://images.unsplash.com/...,https://images.unsplash.com/..."
                      />
                      <span className="text-[10px] text-gray-400 block">Sediakan minimal satu atau dua URL foto pemandangan kampung yang representatif.</span>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Sejarah Pendirian *</label>
                      <textarea
                        required
                        rows={5}
                        value={kpSejarah}
                        onChange={(e) => setKpSejarah(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 leading-relaxed font-light"
                        placeholder="Tuliskan sejarah berdirinya Kampung Pramuka ini secara lengkap..."
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-gray-600 font-semibold uppercase tracking-wider block">Keunggulan &amp; Potensi Utama *</label>
                      <textarea
                        required
                        rows={4}
                        value={kpKeunggulan}
                        onChange={(e) => setKpKeunggulan(e.target.value)}
                        className="w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 leading-relaxed font-light"
                        placeholder="Sebutkan keunggulan, program, potensi agrowisata, bumi perkemahan, atau kerajinan tangan yang menonjol..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormMode('list')}
                      className="px-5 py-2.5 rounded-xl bg-white border border-gray-100 shadow-sm border border-gray-200 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider transition"
                    >
                      Simpan Titik Kampung
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>

      {/* --- PATH B: DIRECT SAKA PULL ANGGOTA MODAL --- */}
      {showPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-6">
            <button
              onClick={() => setShowPullModal(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-black/60 border border-gray-200 text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 font-heading mb-2 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-green-700" />
              <span>Tarik Anggota Penegak/Pandega Langsung ke Saka (Path B)</span>
            </h3>
            <p className="text-xs text-gray-500 font-light mb-6">
              Sesuai arahan, sebagai Pamong Saka Anda bisa menarik anggota golongan Penegak atau Pandega se-kabupaten secara langsung tanpa memerlukan antrean persetujuan. Keputusan bersifat FINAL dan instan.
            </p>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Saring nama atau pangkalan..."
                value={pullSearchTerm}
                onChange={(e) => setPullSearchTerm(e.target.value)}
                className="w-full bg-white text-xs text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {candidatesList
                .filter(c => c.nama_lengkap.toLowerCase().includes(pullSearchTerm.toLowerCase()) || c.pangkalan.toLowerCase().includes(pullSearchTerm.toLowerCase()))
                .filter(c => !anggotaList.find(x => x.id === c.id)?.saka_list?.some((j: any) => j.saka_id === user.ref_id)) // not yet affiliated
                .map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-gray-200 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900">{c.nama_lengkap}</div>
                      <div className="text-[10px] text-gray-500 font-light mt-0.5">
                        Pangkalan: {c.pangkalan} &bull; Golongan: {c.golongan.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePullMember(c.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F0A1A] font-extrabold text-[10px] uppercase tracking-wider transition-all"
                    >
                      Tarik Resmi
                    </button>
                  </div>
                ))}

              {candidatesList.length === 0 && (
                <p className="text-center text-xs text-gray-400 font-light py-6">Tidak ada kandidat Penegak/Pandega tersedia.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DATA ANGGOTA MODAL --- */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl relative p-5 sm:p-8">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 z-50 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-green-700">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ekspor Data Anggota</span>
                <h3 className="text-xl font-black text-gray-900 font-heading mt-0.5">
                  Pusat Ekspor &amp; Cetak Dokumen Profesional
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-light mb-6 leading-relaxed">
              Silakan saring golongan pramuka dan pilih jenis keluaran yang diinginkan. Fitur ekspor menyertakan semua kolom identitas secara lengkap untuk keperluan administrasi resmi Kwartir Cabang Kabupaten Tasikmalaya.
            </p>

            {/* Form Filter */}
            <div className="mb-8 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Saring Berdasarkan Golongan Anggota:
              </label>
              <select
                value={exportFilterGolongan}
                onChange={(e) => setExportFilterGolongan(e.target.value)}
                className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
              >
                <option value="all">Semua Golongan (Siaga, Penggalang, Penegak, Pandega, Dewasa)</option>
                <option value="siaga">Golongan Siaga</option>
                <option value="penggalang">Golongan Penggalang</option>
                <option value="penegak">Golongan Penegak</option>
                <option value="pandega">Golongan Pandega</option>
                <option value="dewasa">Golongan Dewasa / Pembina</option>
              </select>
            </div>

            {/* Export Actions Cards Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              
              {/* Card 1: Excel CSV */}
              <button
                onClick={exportToExcel}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-purple-900/10 border border-gray-200 hover:border-emerald-500/30 text-left hover:bg-emerald-950/20 group transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Format Excel (CSV)</h4>
                <p className="text-[10px] text-gray-500/80 mt-2 font-light leading-normal">
                  Ekspor data lengkap (Nama, TTL, Alamat, Pangkalan, Saka) ke lembar kerja yang kompatibel dengan Microsoft Excel.
                </p>
              </button>

              {/* Card 2: PDF / Printable document */}
              <button
                onClick={exportToPDF}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-purple-900/10 border border-gray-200 hover:border-green-200 text-left hover:bg-gray-900/20 group transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-green-800/30 border border-gray-200 flex items-center justify-center text-gray-400 mb-4 group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Laporan Cetak &amp; PDF</h4>
                <p className="text-[10px] text-gray-500/80 mt-2 font-light leading-normal">
                  Hasilkan berkas laporan resmi A4 lengkap dengan Kop Surat Kwarcab, tabel rapi, dan kolom pengesahan tanda tangan.
                </p>
              </button>

              {/* Card 3: Batch Surat Keterangan Legalitas */}
              {canManage('kta') && (
                <button
                  onClick={() => exportToSuratLegalitas()}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-purple-900/10 border border-gray-200 hover:border-amber-500/30 text-left hover:bg-amber-950/20 group transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Surat Legalitas (SKL)</h4>
                  <p className="text-[10px] text-gray-500/80 mt-2 font-light leading-normal">
                    Cetak Surat Keterangan Legalitas resmi ukuran A4 lengkap dengan Kop Surat Kwarcab, barcode QR verifikasi real-time, dan stempel digital.
                  </p>
                </button>
              )}

            </div>

            <div className="mt-6 text-center">
              <span className="text-[9px] text-green-700 font-bold uppercase tracking-widest">
                Gerakan Pramuka Indonesia Kwartir Cabang Tasikmalaya
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- PREVIEW KTA MODAL --- */}
      {previewKtaHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden border border-gray-200 shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-green-700" />
                Preview Cetak KTA
              </h3>
              <button
                onClick={() => setPreviewKtaHtml(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:bg-red-500/20 text-gray-900/50 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-0 bg-[#555]">
              <iframe 
                srcDoc={previewKtaHtml.html}
                title="KTA Preview"
                className="w-full h-full border-0 rounded-b-xl bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around pb-safe pt-2 px-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => { setActiveTab('overview'); setFormMode('list'); setSelectedItem(null); }}
          className={`flex flex-col items-center justify-center w-full py-1.5 ${activeTab === 'overview' ? 'text-green-700' : 'text-gray-500 hover:text-green-700'}`}
        >
          <Home className={`w-5 h-5 mb-1 ${activeTab === 'overview' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">Beranda</span>
          {activeTab === 'overview' && <div className="w-8 h-1 bg-green-700 rounded-t-md absolute bottom-0"></div>}
        </button>

        <button
          onClick={() => { setActiveTab('agenda'); setFormMode('list'); setSelectedItem(null); }}
          className={`flex flex-col items-center justify-center w-full py-1.5 ${activeTab === 'agenda' ? 'text-green-700' : 'text-gray-500 hover:text-green-700'}`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Kegiatan</span>
          {activeTab === 'agenda' && <div className="w-8 h-1 bg-green-700 rounded-t-md absolute bottom-0"></div>}
        </button>

        <button
          onClick={() => { setActiveTab('anggota'); setFormMode('list'); setSelectedItem(null); }}
          className={`flex flex-col items-center justify-center w-full py-1.5 ${activeTab === 'anggota' ? 'text-green-700' : 'text-gray-500 hover:text-green-700'}`}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Anggota</span>
          {activeTab === 'anggota' && <div className="w-8 h-1 bg-green-700 rounded-t-md absolute bottom-0"></div>}
        </button>

        <button
          onClick={() => { setActiveTab('berita'); setFormMode('list'); setSelectedItem(null); }}
          className={`flex flex-col items-center justify-center w-full py-1.5 ${activeTab === 'berita' ? 'text-green-700' : 'text-gray-500 hover:text-green-700'}`}
        >
          <FileText className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Berita</span>
          {activeTab === 'berita' && <div className="w-8 h-1 bg-green-700 rounded-t-md absolute bottom-0"></div>}
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-full py-1.5 text-gray-500 hover:text-green-700"
        >
          <MoreHorizontal className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Lainnya</span>
        </button>
      </div>
      

      {/* Change Password Modal (Self) */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSelfChangePassword} className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Ganti Password</h3>
                  <p className="text-xs text-gray-500 mt-1">Perbarui password akses akun Anda.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Password Baru *</label>
                  <input
                    type="password"
                    required
                    value={selfNewPassword}
                    onChange={(e) => setSelfNewPassword(e.target.value)}
                    className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Konfirmasi Password *</label>
                  <input
                    type="password"
                    required
                    value={selfConfirmPassword}
                    onChange={(e) => setSelfConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 text-sm text-gray-900 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    placeholder="Ketik ulang password baru"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 bg-green-600 text-white font-bold text-xs rounded-xl hover:bg-green-700 disabled:opacity-70 transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {isChangingPassword ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
