#!/usr/bin/env python3
"""
=============================================================================
GENERATOR IKON PWA & FAVICON — Kwarcab Kab. Tasikmalaya
=============================================================================
Menghasilkan seluruh ukuran favicon & ikon aplikasi (PWA) dari SATU file
logo master, supaya Anda tidak perlu bikin manual satu-satu.

CARA PAKAI:
  1. Simpan logo resmi (persegi, idealnya minimal 512x512px, PNG, latar
     transparan atau solid) sebagai:
         public/logo-source.png
  2. Install Pillow kalau belum ada:
         pip install pillow --break-system-packages
  3. Jalankan dari root project:
         python3 scripts/generate-icons.py
     (atau: npm run generate-icons)
  4. Selesai — semua favicon & ikon PWA otomatis dibuat di folder public/.
     index.html dan public/manifest.webmanifest SUDAH mereferensikan file
     hasil generate ini, jadi tidak perlu ubah apa-apa lagi.
=============================================================================
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow belum terinstal. Jalankan: pip install pillow --break-system-packages")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
SOURCE = os.path.join(PUBLIC, 'logo-source.png')
ICONS_DIR = os.path.join(PUBLIC, 'icons')


def load_source() -> Image.Image:
    if not os.path.isfile(SOURCE):
        print(f"File logo master tidak ditemukan: {SOURCE}")
        print("Simpan logo Anda sebagai 'public/logo-source.png' lalu jalankan ulang script ini.")
        sys.exit(1)
    img = Image.open(SOURCE).convert('RGBA')
    # Jadikan kanvas persegi (logo di-tengah-kan) supaya semua ikon proporsional
    if img.width != img.height:
        size = max(img.width, img.height)
        square = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        square.paste(img, ((size - img.width) // 2, (size - img.height) // 2), img)
        img = square
    return img


def save_png(img: Image.Image, size: int, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(path, 'PNG')
    print(f"  ✓ {os.path.relpath(path, ROOT)} ({size}x{size})")


def save_maskable(img: Image.Image, size: int, path: str):
    """Ikon maskable butuh 'safe zone' ~20% padding di setiap sisi agar tidak
    terpotong saat Android membentuknya jadi lingkaran/rounded-square."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    canvas = Image.new('RGBA', (size, size), (15, 10, 26, 255))  # #0F0A1A, warna dasar tema
    inner = int(size * 0.7)
    logo_resized = img.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(logo_resized, (offset, offset), logo_resized)
    canvas.save(path, 'PNG')
    print(f"  ✓ {os.path.relpath(path, ROOT)} ({size}x{size}, maskable)")


def save_ico(img: Image.Image, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sizes = [(16, 16), (32, 32), (48, 48)]
    img.save(path, format='ICO', sizes=sizes)
    print(f"  ✓ {os.path.relpath(path, ROOT)} (multi-size .ico)")


def main():
    print("Memuat logo master...")
    img = load_source()

    print("\nMembuat favicon...")
    save_ico(img, os.path.join(PUBLIC, 'favicon.ico'))
    save_png(img, 16, os.path.join(PUBLIC, 'favicon-16x16.png'))
    save_png(img, 32, os.path.join(PUBLIC, 'favicon-32x32.png'))

    print("\nMembuat ikon Apple / iOS...")
    save_png(img, 180, os.path.join(PUBLIC, 'apple-touch-icon.png'))

    print("\nMembuat ikon PWA (Android / Desktop install)...")
    save_png(img, 192, os.path.join(ICONS_DIR, 'icon-192.png'))
    save_png(img, 512, os.path.join(ICONS_DIR, 'icon-512.png'))
    save_maskable(img, 192, os.path.join(ICONS_DIR, 'maskable-icon-192.png'))
    save_maskable(img, 512, os.path.join(ICONS_DIR, 'maskable-icon-512.png'))

    print("\nSelesai! Semua favicon & ikon PWA berhasil dibuat di folder public/.")


if __name__ == '__main__':
    main()
