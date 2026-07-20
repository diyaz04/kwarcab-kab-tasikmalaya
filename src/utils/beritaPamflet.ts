import { Berita } from '../types';

/**
 * =============================================================================
 * PAMFLET BERITA GENERATOR
 * =============================================================================
 * Menggabungkan template gambar statis (disimpan manual di /public) dengan
 * konten dinamis satu berita (foto cover, judul, cuplikan isi) + QR code yang
 * mengarah langsung ke berita tsb, lalu merendernya jadi satu file PNG yang
 * siap diunduh / dibagikan.
 *
 * NAMA FILE TEMPLATE YANG WAJIB DISIMPAN:
 *   public/pamflet-berita-template.png
 *
 * (diakses lewat path root "/pamflet-berita-template.png", sama seperti
 * konvensi kta-bg.png & kta-back.png yang sudah dipakai di AdminPortal).
 *
 * Semua koordinat di bawah ini dikalibrasi berdasarkan desain referensi
 * berukuran 1350 x 1688 px, lalu diskalakan otomatis mengikuti ukuran asli
 * file template yang benar-benar dimuat (jadi tetap presisi walau template
 * disimpan dengan resolusi lain, selama rasio 1350:1688 / potrait A4-ish
 * dipertahankan).
 * =============================================================================
 */

const TEMPLATE_PATH = '/pamflet-berita-template.png';
const REF_W = 1350;
const REF_H = 1688;

// Kotak foto cover berita
const PHOTO_BOX = { x: 141, y: 241, w: 1209 - 141, h: 844 - 241 };
// Baris judul (maks 2 baris)
const TITLE = { x: 168, yTop: 895, w: 1150 - 168, lineHeight: 58, maxLines: 2, fontSize: 52 };
// Paragraf cuplikan isi berita (maks 3 baris)
const BODY = { x: 168, yTop: 985, w: 1150 - 168, lineHeight: 45, maxLines: 3, fontSize: 30 };
// Kotak putih QR
const QR_BOX = { x: 956, y: 1301, w: 1274 - 956, h: 1622 - 1301, padding: 24 };

function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Pecah teks jadi beberapa baris sesuai lebar maksimum kanvas
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // Tambahkan elipsis kalau teks masih tersisa & baris sudah penuh
  const consumedWords = lines.join(' ').split(' ').length;
  if (lines.length >= maxLines && consumedWords < words.length) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 0) {
      last = last.slice(0, -1).trim();
    }
    lines[maxLines - 1] = `${last}...`;
  }

  return lines.slice(0, maxLines);
}

// Crop + gambar foto cover memenuhi kotak (mirip object-fit: cover)
function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, box: { x: number; y: number; w: number; h: number }, radius: number) {
  const boxRatio = box.w / box.h;
  const imgRatio = img.width / img.height;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.save();
  drawRoundedRect(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
  ctx.restore();
}

/**
 * Bangun URL berita spesifik (?berita=<id>) yang sama dengan yang dipakai
 * fitur "Bagikan" (WhatsApp/Facebook/Twitter/Copy Link), supaya QR di pamflet
 * mengarah ke berita yang sama persis.
 */
export function getBeritaShareUrl(berita: Berita): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('berita', berita.id);
  return url.toString();
}

/**
 * Render pamflet berita jadi PNG (data URL).
 * Melempar error kalau template belum tersedia di /public/pamflet-berita-template.png
 * agar bisa ditangani (tampilkan pesan "template belum diunggah") oleh pemanggil.
 */
export async function generateBeritaPamflet(berita: Berita): Promise<string> {
  const template = await loadImage(TEMPLATE_PATH, false);

  const W = template.naturalWidth || REF_W;
  const H = template.naturalHeight || REF_H;
  const sx = W / REF_W;
  const sy = H / REF_H;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kanvas tidak didukung di perangkat ini.');

  // 1. Template statis (header, pita merah-putih, footer ungu, watermark, dsb)
  ctx.drawImage(template, 0, 0, W, H);

  // 2. Foto cover berita
  try {
    const cover = await loadImage(berita.gambar_cover);
    drawCoverImage(
      ctx,
      cover,
      { x: PHOTO_BOX.x * sx, y: PHOTO_BOX.y * sy, w: PHOTO_BOX.w * sx, h: PHOTO_BOX.h * sy },
      30 * Math.min(sx, sy)
    );
  } catch {
    // Kalau foto gagal dimuat (mis. CORS), biarkan ilustrasi bawaan template tampil.
  }

  // 3. Judul berita (maks 2 baris, font tebal serif)
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `bold ${TITLE.fontSize * sy}px Georgia, 'Times New Roman', serif`;
  const titleLines = wrapText(ctx, berita.judul, TITLE.w * sx, TITLE.maxLines);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, TITLE.x * sx, (TITLE.yTop + (i + 1) * TITLE.lineHeight) * sy);
  });

  // 4. Cuplikan isi berita (maks 3 baris, font sans-serif)
  const bodyStartY = TITLE.yTop + (titleLines.length) * TITLE.lineHeight + 40;
  ctx.fillStyle = '#2b2b2b';
  ctx.font = `${BODY.fontSize * sy}px Arial, Helvetica, sans-serif`;
  const bodyText = stripHtml(berita.konten);
  const bodyLines = wrapText(ctx, bodyText, BODY.w * sx, BODY.maxLines);
  bodyLines.forEach((line, i) => {
    ctx.fillText(line, BODY.x * sx, (bodyStartY + (i + 1) * BODY.lineHeight) * sy);
  });

  // 5. QR code menuju berita spesifik ini
  const shareUrl = getBeritaShareUrl(berita);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encodeURIComponent(shareUrl)}`;
  try {
    const qrImg = await loadImage(qrApiUrl);
    const boxX = QR_BOX.x * sx, boxY = QR_BOX.y * sy, boxW = QR_BOX.w * sx, boxH = QR_BOX.h * sy;
    const pad = QR_BOX.padding * Math.min(sx, sy);

    // Kotak putih pembungkus QR (jaga-jaga kalau template tidak menyertakannya)
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 24 * Math.min(sx, sy));
    ctx.fill();

    ctx.drawImage(qrImg, boxX + pad, boxY + pad, boxW - pad * 2, boxH - pad * 2);
  } catch {
    // Kalau layanan QR gagal diakses, pamflet tetap dihasilkan tanpa QR.
  }

  return canvas.toDataURL('image/png');
}

export function downloadPamflet(dataUrl: string, berita: Berita) {
  const slug = berita.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `pamflet-${slug || berita.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function sharePamflet(dataUrl: string, berita: Berita) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `pamflet-${berita.id}.png`, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: berita.judul,
      text: `Baca warta Pramuka: "${berita.judul}" di Kwarcab Kabupaten Tasikmalaya`,
    });
  } else {
    downloadPamflet(dataUrl, berita);
  }
}
