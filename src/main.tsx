/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Produksi: daftarkan Service Worker untuk PWA & app-shell offline.
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Gagal mendaftarkan service worker:', err);
      });
    });
  } else {
    // Development: JANGAN pakai service worker. SW meng-cache modul dev Vite
    // (/src, /@vite, /node_modules/.vite) sehingga versi lama & baru bercampur
    // -> error React "Expected static flag was missing" + CSS tidak terpakai.
    // Bersihkan SW & cache sisa dari sesi sebelumnya, lalu reload sekali.
    navigator.serviceWorker.getRegistrations().then(async (regs) => {
      const wasControlled = Boolean(navigator.serviceWorker.controller);
      await Promise.all(regs.map((r) => r.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (wasControlled) window.location.reload();
    });
  }
}
