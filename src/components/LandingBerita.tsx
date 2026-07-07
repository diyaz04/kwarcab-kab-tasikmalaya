import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Eye, X, Filter, Compass, ChevronRight, ArrowLeft, Share2, Link, Check, Send, Facebook, Twitter, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Berita } from '../types';

interface LandingBeritaProps {
  berita: Berita[];
  selectedBerita: Berita | null;
  setSelectedBerita: (b: Berita | null) => void;
}

export default function LandingBerita({ berita, selectedBerita, setSelectedBerita }: LandingBeritaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // all, kwarcab, kwarran, gudep, saka
  const [copied, setCopied] = useState(false);

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

  const getAuthorBadgeColor = (type: string) => {
    switch (type) {
      case 'kwarcab': return 'bg-purple-900/60 text-purple-200 border-purple-500/40';
      case 'kwarran': return 'bg-blue-900/60 text-blue-200 border-blue-500/40';
      case 'gudep': return 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40';
      case 'saka': return 'bg-amber-900/60 text-[#D4AF37] border-amber-500/40';
      default: return 'bg-slate-900/60 text-slate-200 border-slate-500/40';
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
  const shareUrl = window.location.href;
  const shareText = selectedBerita ? `Baca warta Pramuka terbaru: "${selectedBerita.judul}" di Kwarcab Kabupaten Tasikmalaya` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareUrl}#news-${selectedBerita?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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

  // Other related stories (excluding current story)
  const relatedStories = berita
    .filter((b) => b.status === 'approved' && b.id !== selectedBerita?.id)
    .slice(0, 3);

  // DEDICATED ARTICLE DETAILS VIEW (Not a popup, rendering as a standalone special page)
  if (selectedBerita) {
    return (
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="absolute top-10 left-10 glow-spot-primary opacity-20 pointer-events-none"></div>

        {/* Back Button & Breadcrumbs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setSelectedBerita(null)}
            className="group flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white border border-white/5 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kembali ke Warta</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-purple-300 font-medium">
            <span className="cursor-pointer hover:text-white" onClick={() => setSelectedBerita(null)}>Warta</span>
            <span>/</span>
            <span className="text-[#D4AF37] max-w-[200px] truncate">{selectedBerita.judul}</span>
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
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 p-6 sm:p-10 shadow-2xl relative">
              
              {/* Category, Date & Read Time */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-purple-300 mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${getAuthorBadgeColor(selectedBerita.author_type)}`}>
                  {getAuthorLabel(selectedBerita.author_type)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                <span className="flex items-center gap-1 text-purple-300/85">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{getReadingTime(selectedBerita.konten)}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white font-heading leading-tight tracking-tight mb-6">
                {selectedBerita.judul}
              </h1>

              {/* Author Card Info */}
              <div className="flex items-center gap-3 py-4 border-y border-white/5 mb-8">
                <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-[#D4AF37]/35 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                  {selectedBerita.author_nama ? selectedBerita.author_nama.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{selectedBerita.author_nama || 'Administrator'}</div>
                  <div className="text-[10px] text-[#D4AF37] font-medium uppercase tracking-wider">{getAuthorLabel(selectedBerita.author_type)} Sinergi</div>
                </div>
              </div>

              {/* Big Featured Image */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-[16/9] mb-8 bg-black/40">
                <img
                  src={selectedBerita.gambar_cover}
                  alt={selectedBerita.judul}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* News Body Paragraphs */}
              <div className="text-purple-100 font-light text-base sm:text-lg leading-relaxed whitespace-pre-line space-y-6 text-justify">
                {selectedBerita.konten}
              </div>
            </div>
          </article>

          {/* Sidebar Area (1/3 width) */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Share Panel (Aksesoris Fitur Bagikan Berita) */}
            <div className="glass-panel-heavy rounded-3xl p-6 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Share2 className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Bagikan Warta Ini</span>
              </h3>
              <p className="text-xs text-purple-200/80 mb-5 leading-relaxed font-light">
                Sebarkan informasi resmi kepramukaan ini ke pangkalan gugus depan, kwartir ranting, atau jejaring sosial lainnya.
              </p>

              {/* Sharing Grid buttons */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Whatsapp */}
                <button
                  onClick={shareToWhatsApp}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke WhatsApp"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareToFacebook}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke Facebook"
                >
                  <Facebook className="w-4 h-4 text-blue-400" />
                  <span>Facebook</span>
                </button>

                {/* Twitter / X */}
                <button
                  onClick={shareToTwitter}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  title="Bagikan ke X"
                >
                  <Twitter className="w-4 h-4 text-purple-400" />
                  <span>X (Twitter)</span>
                </button>

                {/* Salin Tautan (Copy Link) */}
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl transition border text-xs font-semibold active:scale-95 cursor-pointer ${
                    copied 
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
                      : 'bg-white/5 hover:bg-white/10 text-purple-200 border-white/10'
                  }`}
                  title="Salin Tautan Berita"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Link className="w-4 h-4 text-purple-300" />}
                  <span>{copied ? 'Tersalin' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Native share on mobile */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F0A1A] font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  Bagikan Secara Native
                </button>
              )}
            </div>

            {/* Related/Latest Stories Sidebar Widget */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading mb-4 flex items-center justify-between">
                <span>Berita Lainnya</span>
                <span className="text-[10px] text-[#D4AF37] font-semibold">{relatedStories.length} Warta</span>
              </h3>

              <div className="space-y-4">
                {relatedStories.length === 0 ? (
                  <p className="text-xs text-purple-300/60 font-light">Belum ada warta kepanduan lainnya.</p>
                ) : (
                  relatedStories.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBerita(item)}
                      className="group flex gap-3 cursor-pointer bg-white/[0.01] hover:bg-white/[0.04] p-2 rounded-2xl border border-transparent hover:border-purple-500/10 transition-all duration-200"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/5">
                        <img src={item.gambar_cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center min-w-0">
                        <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#D4AF37] transition-colors">{item.judul}</h4>
                        <span className="text-[9px] text-purple-300/80 mt-1 uppercase font-semibold">{getAuthorLabel(item.author_type)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sinergi Information box */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 text-xs text-purple-200/80 font-light leading-relaxed">
              <div className="font-semibold text-white mb-2 font-heading">Sinergitas Publikasi</div>
              Semua konten rilis berita merupakan informasi resmi gerakan pramuka di wilayah Kwartir Cabang Kabupaten Tasikmalaya yang telah melalui tahap kurasi serta verifikasi admin penanggung jawab.
            </div>
          </aside>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-10 left-10 glow-spot-primary opacity-20"></div>

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          Warta Kepramukaan
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-[#D4AF37] mx-auto mt-4 rounded-full"></div>
        <p className="text-sm text-purple-300 mt-2 font-medium">
          Daftar berita, informasi, dan rilis pers resmi ter-update
        </p>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-2xl p-6 mb-10 border border-white/5 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-300" />
          <input
            type="text"
            placeholder="Cari berita atau warta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 text-sm text-white placeholder-purple-300/50 pl-11 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all duration-200 shadow-inner"
          />
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-purple-300/80 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" /> Saring:
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
                  ? 'bg-purple-600/30 text-white border-purple-500 shadow-md shadow-purple-500/10'
                  : 'bg-black/20 text-purple-200/80 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-purple-300/70">
          Tidak ditemukan berita yang cocok dengan kriteria pencarian Anda.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {filtered.map((news) => (
            <div
              key={news.id}
              onClick={() => setSelectedBerita(news)}
              className="glass-panel glass-panel-interactive rounded-2xl overflow-hidden flex flex-col h-full border border-white/5 group cursor-pointer"
            >
              {/* Cover image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={news.gambar_cover}
                  alt={news.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1A]/80 via-transparent to-transparent"></div>
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${getAuthorBadgeColor(news.author_type)}`}>
                  {getAuthorLabel(news.author_type)}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-purple-300/80 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>
                      {new Date(news.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-3 group-hover:text-[#D4AF37] transition-colors duration-200">
                    {news.judul}
                  </h3>
                  <p className="text-xs text-purple-200/70 font-light line-clamp-3 leading-relaxed mb-4">
                    {news.konten}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-purple-300 group-hover:text-white transition-colors duration-200">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate max-w-[140px] font-light">{news.author_nama || 'Admin'}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-[#D4AF37] text-[11px] uppercase tracking-wide">
                    <span>Baca</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

