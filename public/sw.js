// =============================================================================
// SERVICE WORKER — Kwarcab Kab. Tasikmalaya (PWA)
// =============================================================================
// Cakupan sengaja dibuat minimal: hanya meng-cache "app shell" statis (agar
// aplikasi tetap bisa dibuka saat offline/koneksi lemah) dan TIDAK mencampuri
// permintaan ke /api/* atau domain eksternal (Cloudinary, dsb), supaya data
// berita/agenda/anggota selalu ambil versi terbaru dari server.
// =============================================================================

const CACHE_NAME = 'dkc-tasikmalaya-shell-v2';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Jangan cache request API/dinamis atau selain GET — selalu ambil dari jaringan.
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  // Hanya tangani permintaan same-origin (biarkan Cloudinary dll. apa adanya).
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Jangan pernah menyentuh modul dev Vite (versi lama & baru bisa bercampur
  // dan merusak React/CSS).
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // Halaman (navigasi): utamakan jaringan supaya index.html tidak basi
  // dan tidak menunjuk ke file hasil build lama yang sudah terhapus.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
