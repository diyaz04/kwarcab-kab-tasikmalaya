import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Eye, X, Filter, Compass, ChevronRight, ArrowLeft, Share2, Link, Check, Send, Facebook, Twitter, Clock, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Berita } from '../types';
import { generateBeritaPamflet, downloadPamflet, sharePamflet } from '../utils/beritaPamflet';
import { notify } from '../utils/dialog';

interface LandingBeritaProps {
  berita: Berita[];
  selectedBerita: Berita | null;
  setSelectedBerita: (b: Berita | null) => void;
}

export default function LandingBerita({ berita, selectedBerita, setSelectedBerita }: LandingBeritaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // all, kwarcab, kwarran, gudep, saka
  const [copied, setCopied] = useState(false);

  // Paginasi daftar berita
  const [pageSize, setPageSize] = useState<number>(4);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, pageSize]);

  // Pamflet Berita (poster siap unduh/bagikan dengan QR)
  const [pamfletLoading, setPamfletLoading] = useState(false);
  const [pamfletDataUrl, setPamfletDataUrl] = useState<string | null>(null);
  const [pamfletError, setPamfletError] = useState<string | null>(null);
  const [showPamfletModal, setShowPamfletModal] = useState(false);

  // Auto scroll to top when selecting an article
  useEffect(() => {
    if (selectedBerita) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedBerita]);

  // Filter berita
  const filtered = berita.filter((b) => {
    const matchesSearch = b.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.konten.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || b.author_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Urutkan terbaru -> terlama, lalu potong sesuai halaman aktif
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageItems = pageSize === Infinity ? sorted : sorted.slice((activePage - 1) * pageSize, activePage * pageSize);

  // Nomor halaman ringkas: 1 ... 4 5 6 ... 12
  const pageNumbers: Array<number | 'gap'> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - activePage) <= 1) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== 'gap') {
      pageNumbers.push('gap');
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    document.getElementById('daftar-berita')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getAuthorBadgeColor = (type: string) => {
    switch (type) {
      case 'kwarcab': return 'bg-green-100 text-green-800 border-green-200';
      case 'kwarran': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gudep': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'saka': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAuthorLabel = (type: string) => {
    switch (type) {
      case 'kwarcab': return 'Kwarcab';
      case 'kwarran': return 'Kwartir Ranting';
      case 'gudep': return 'Gugus Depan';
      case 'saka': return 'Saka';
      default: return type;
    }
  };

  // Estimate reading time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} menit baca`;
  };

  // Share Handlers
  const shareUrl = (() => {
    const url = new URL(window.location.href);
    if (selectedBerita) {
      url.searchParams.set('berita', selectedBerita.id);
    }
    return url.toString();
  })();
  const shareText = selectedBerita ? `Baca warta Pramuka terbaru: "${selectedBerita.judul}" di Kwarcab Kabupaten Tasikmalaya` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      notify.success('Tautan berita berhasil disalin ke clipboard!', 'Tautan Disalin');
    } catch (_) {
      notify.error('Tautan tidak bisa disalin otomatis. Salin manual dari address bar browser.', 'Gagal Menyalin');
    }
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedBerita?.judul,
        text: selectedBerita?.konten.substring(0, 100) + '...',
        url: shareUrl,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  // Buat Pamflet Berita (poster PNG: template statis + judul/isi/QR dinamis)
  const handleGeneratePamflet = async () => {
    if (!selectedBerita) return;
    setPamfletError(null);
    setPamfletDataUrl(null);
    setShowPamfletModal(true);
    setPamfletLoading(true);
    try {
      const dataUrl = await generateBeritaPamflet(selectedBerita);
      setPamfletDataUrl(dataUrl);
    } catch (err) {
      setPamfletError('Template pamflet belum ditemukan. Pastikan file "pamflet-berita-template.png" sudah disimpan di folder /public project ini.');
    } finally {
      setPamfletLoading(false);
    }
  };

  const handleDownloadPamflet = () => {
    if (pamfletDataUrl && selectedBerita) downloadPamflet(pamfletDataUrl, selectedBerita);
  };

  const handleSharePamflet = () => {
    if (pamfletDataUrl && selectedBerita) sharePamflet(pamfletDataUrl, selectedBerita);
  };

  // Other related stories (excluding current story)
  const relatedStories = berita
    .filter((b) => b.status === 'approved' && b.id !== selectedBerita?.id)
    .slice(0, 3);

  // DEDICATED ARTICLE DETAILS VIEW (Not a popup, rendering as a standalone special page)
  if (selectedBerita) {
    return (
      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="absolute top-10 left-10 glow-spot-primary opacity-20 pointer-events-none"></div>

        {/* Back Button & Breadcrumbs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setSelectedBerita(null)}
            className="group flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-green-700 border border-gray-200 shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kembali ke Warta</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
            <span className="cursor-pointer hover:text-green-700" onClick={() => setSelectedBerita(null)}>Warta</span>
            <span>/</span>
            <span className="text-green-700 max-w-[200px] truncate">{selectedBerita.judul}</span>
          </div>
        </div>

        {/* Full Page Content Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Main Reading Column (2/3 width) */}
          <article className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 p-6 sm:p-10 shadow-sm hover:shadow-md transition-shadow relative">
              
              {/* Category, Date & Read Time */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getAuthorBadgeColor(selectedBerita.author_type)}`}>
                  {getAuthorLabel(selectedBerita.author_type)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-green-600" />
                  <span>
                    {new Date(selectedBerita.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-green-600" />
                  <span>{getReadingTime(selectedBerita.konten)}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-green-900 font-heading leading-tight tracking-tight mb-6">
                {selectedBerita.judul}
              </h1>

              {/* Author Card Info */}
              <div className="flex items-center gap-3 py-4 border-y border-gray-100 mb-8">
                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-700 text-sm font-bold shadow-inner">
                  {selectedBerita.author_nama ? selectedBerita.author_nama.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">{selectedBerita.author_nama || 'Administrator'}</div>
                  <div className="text-[10px] text-green-600 font-medium uppercase tracking-wider">{getAuthorLabel(selectedBerita.author_type)} Sinergi</div>
                </div>
              </div>

              {/* Big Featured Image */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-[16/9] mb-8 bg-gray-50">
                <img
                  src={selectedBerita.gambar_cover}
                  alt={selectedBerita.judul}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* News Body Paragraphs */}
              <div className="text-gray-600 font-light text-base sm:text-lg leading-relaxed whitespace-pre-line space-y-6 text-justify">
                {selectedBerita.konten}
              </div>
            </div>
          </article>

          {/* Sidebar Area (1/3 width) */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Share Panel (Aksesoris Fitur Bagikan Berita) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Share2 className="w-16 h-16 text-green-700" />
              </div>
              <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider font-heading flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-green-600" />
                <span>Bagikan Warta Ini</span>
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed font-light">
                Sebarkan informasi resmi kepramukaan ini ke pangkalan gugus depan, kwartir ranting, atau jejaring sosial lainnya.
              </p>

              {/* Sharing Grid buttons */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Whatsapp */}
                <button
                  onClick={shareToWhatsApp}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke WhatsApp"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareToFacebook}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke Facebook"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </button>

                {/* Twitter / X */}
                <button
                  onClick={shareToTwitter}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke X"
                >
                  <Twitter className="w-4 h-4" />
                  <span>X (Twitter)</span>
                </button>

                {/* Salin Tautan (Copy Link) */}
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl transition border text-xs font-semibold active:scale-95 cursor-pointer ${
                    copied 
                      ? 'bg-green-600 text-white border-green-600 shadow-md' 
                      : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                  title="Salin Tautan Berita"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Link className="w-4 h-4 text-gray-500" />}
                  <span>{copied ? 'Tersalin' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Native share on mobile */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full mt-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  Bagikan Secara Native
                </button>
              )}

              {/* Buat Pamflet Berita (poster dengan QR, siap diunduh/dibagikan) */}
              <button
                onClick={handleGeneratePamflet}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                Buat Pamflet Berita
              </button>
            </div>

            {/* Related/Latest Stories Sidebar Widget */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider font-heading mb-4 flex items-center justify-between">
                <span>Berita Lainnya</span>
                <span className="text-[10px] text-green-600 font-semibold">{relatedStories.length} Warta</span>
              </h3>

              <div className="space-y-4">
                {relatedStories.length === 0 ? (
                  <p className="text-xs text-gray-500 font-light">Belum ada warta kepanduan lainnya.</p>
                ) : (
                  relatedStories.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBerita(item)}
                      className="group flex gap-3 cursor-pointer bg-white hover:bg-gray-50 p-2 rounded-2xl border border-transparent hover:border-green-200 transition-all duration-200"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                        <img src={item.gambar_cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">{item.judul}</h4>
                        <span className="text-[9px] text-gray-500 mt-1 uppercase font-semibold">{getAuthorLabel(item.author_type)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sinergi Information box */}
            <div className="bg-green-50 rounded-3xl p-6 border border-green-100 text-xs text-green-800 font-light leading-relaxed">
              <div className="font-semibold text-green-900 mb-2 font-heading">Sinergitas Publikasi</div>
              Semua konten rilis berita merupakan informasi resmi gerakan pramuka di wilayah Kwartir Cabang Kabupaten Tasikmalaya yang telah melalui tahap kurasi serta verifikasi admin penanggung jawab.
            </div>
          </aside>
        </motion.div>

        {/* Modal Preview Pamflet Berita */}
        {showPamfletModal && (
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPamfletModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-wider font-heading flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  Pamflet Berita
                </h3>
                <button onClick={() => setShowPamfletModal(false)} className="text-gray-400 hover:text-gray-900 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pamfletLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <p className="text-xs font-light">Sedang membuat pamflet...</p>
                </div>
              )}

              {!pamfletLoading && pamfletError && (
                <div className="py-8 text-center">
                  <p className="text-xs text-red-500 leading-relaxed">{pamfletError}</p>
                </div>
              )}

              {!pamfletLoading && !pamfletError && pamfletDataUrl && (
                <>
                  <img
                    src={pamfletDataUrl}
                    alt={`Pamflet - ${selectedBerita.judul}`}
                    className="w-full rounded-2xl border border-gray-100 mb-4"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadPamflet}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs transition active:scale-95"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                      Unduh
                    </button>
                    <button
                      onClick={handleSharePamflet}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs transition active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      Bagikan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-green-900 font-heading">
          Warta Kepramukaan
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-green-700 mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-green-700 mt-2 font-medium">
          Daftar berita, informasi, dan rilis pers resmi ter-update
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-6 mb-10 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between relative z-20 hover:shadow-md transition-shadow">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berita atau warta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 text-sm text-gray-900 placeholder-gray-400 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all duration-200"
          />
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-green-600" /> Saring:
          </span>
          {[
            { id: 'all', label: 'Semua Sumber' },
            { id: 'kwarcab', label: 'Kwarcab' },
            { id: 'kwarran', label: 'Kwarran' },
            { id: 'gudep', label: 'Gudep' },
            { id: 'saka', label: 'Saka' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-green-700 hover:bg-green-50 hover:border-green-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div id="daftar-berita" className="scroll-mt-28"></div>
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center text-gray-500">
          Tidak ditemukan berita yang cocok dengan kriteria pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8 relative z-10">
          {pageItems.map((news) => (
            <div
              key={news.id}
              onClick={() => setSelectedBerita(news)}
              className="bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 group cursor-pointer transition-all duration-300"
            >
              {/* Cover image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={news.gambar_cover}
                  alt={news.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent"></div>
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md border ${getAuthorBadgeColor(news.author_type)}`}>
                  {getAuthorLabel(news.author_type)}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-green-600" />
                    <span>
                      {new Date(news.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-green-700 transition-colors duration-200">
                    {news.judul}
                  </h3>
                  <p className="text-xs text-gray-600 font-light line-clamp-3 leading-relaxed mb-4">
                    {news.konten}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 group-hover:text-green-700 transition-colors duration-200">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-green-600" />
                    <span className="truncate max-w-[140px] font-light">{news.author_nama || 'Admin'}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-green-700 text-[11px] uppercase tracking-wide">
                    <span>Baca</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize === Infinity ? 'all' : pageSize}
              onChange={(e) => setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 cursor-pointer shadow-sm"
            >
              <option value={4}>4 Data</option>
              <option value={10}>10 Data</option>
              <option value={20}>20 Data</option>
              <option value="all">Semua</option>
            </select>
          </div>

          {pageSize !== Infinity && (
            <span className="text-xs text-gray-500 hidden md:block">
              Menampilkan {(activePage - 1) * pageSize + 1}&ndash;{Math.min(activePage * pageSize, sorted.length)} dari {sorted.length} berita
            </span>
          )}

          {totalPages > 1 && pageSize !== Infinity && (
            <nav aria-label="Paginasi berita" className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(activePage - 1)}
                disabled={activePage === 1}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 shadow-sm"
              >
                Sebelumnya
              </button>

              {pageNumbers.map((n, idx) =>
                n === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-1 text-gray-400 text-xs">&hellip;</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goToPage(n)}
                    aria-current={n === activePage ? 'page' : undefined}
                    className={`min-w-[36px] px-2.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm ${
                      n === activePage
                        ? 'bg-green-700 text-white border-green-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:text-green-700 hover:border-green-300'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goToPage(activePage + 1)}
                disabled={activePage === totalPages}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 shadow-sm"
              >
                Selanjutnya
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
