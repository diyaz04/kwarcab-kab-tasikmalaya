// Membuat src/data/kecamatanMap.ts (peta vektor 39 kecamatan Kab. Tasikmalaya) dari data batas wilayah.
//
// Pemakaian:  node scripts/build-kecamatan-map.cjs <file-json-batas-kecamatan>
//
// Format input: JSON { data: [{ kode_kec, kecamatan, WKT_GEOMETRY: "MULTIPOLYGON (...)" }, ...] }
// (data batas administrasi kecamatan kode kabupaten 32.06, dari https://batas-admin.geoit.dev/ yang
// bersumber dari repo https://github.com/Alf-Anas/batas-administrasi-indonesia).
// File mentahnya besar (~3 MB) sehingga TIDAK disimpan di repo; hanya hasil sederhananya.
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Pakai: node scripts/build-kecamatan-map.cjs <file-json-batas-kecamatan>');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const rows = raw.data;

const TOLERANCE = 0.0007; // derajat (~75 m); makin besar makin ringan & kasar
const VIEW_W = 1000;

// ---- parse WKT MULTIPOLYGON -> [polygon][ring][[lon,lat]] ----
const parseWkt = (wkt) => {
  const body = wkt.replace(/^\s*(MULTI)?POLYGON\s*(Z)?\s*/i, '');
  const polys = [];
  const polyRe = /\(\(([^]*?)\)\)/g;
  let m;
  const chunks = body.startsWith('(((') ? body.slice(1, -1) : body; // buang pembungkus multipolygon
  const parts = chunks.split(/\)\)\s*,\s*\(\(/).map(s => s.replace(/^\(\(/, '').replace(/\)\)$/, ''));
  for (const part of parts) {
    const rings = part.split(/\)\s*,\s*\(/).map(r =>
      r.replace(/[()]/g, '').trim().split(/\s*,\s*/).map(pt => {
        const [x, y] = pt.trim().split(/\s+/).map(Number);
        return [x, y];
      })
    );
    polys.push(rings);
  }
  return polys;
};

// ---- Douglas-Peucker ----
const sqSegDist = (p, a, b) => {
  let x = a[0], y = a[1];
  let dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x; dy = p[1] - y;
  return dx * dx + dy * dy;
};
const simplify = (pts, tol) => {
  const sq = tol * tol;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let max = sq, idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(pts[i], pts[first], pts[last]);
      if (d > max) { idx = i; max = d; }
    }
    if (idx > -1) {
      keep[idx] = 1;
      stack.push([first, idx], [idx, last]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const items = rows.map(r => ({
  id: r.kode_kec,
  name: r.kecamatan,
  polys: parseWkt(r.WKT_GEOMETRY)
}));

// ---- bounds ----
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
items.forEach(it => it.polys.forEach(poly => poly.forEach(ring => ring.forEach(([x, y]) => {
  if (x < minLon) minLon = x; if (x > maxLon) maxLon = x;
  if (y < minLat) minLat = y; if (y > maxLat) maxLat = y;
}))));
const cosLat = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
const scale = VIEW_W / ((maxLon - minLon) * cosLat); // px per derajat lintang
const viewH = Math.round((maxLat - minLat) * scale);
const px = ([lon, lat]) => [(lon - minLon) * cosLat * scale, (maxLat - lat) * scale];
const r1 = (n) => Math.round(n * 10) / 10;

const out = items.map(it => {
  let d = '';
  let bestArea = 0, cx = 0, cy = 0;
  it.polys.forEach(poly => {
    poly.forEach((ring, ri) => {
      let s = simplify(ring, TOLERANCE);
      if (s.length < 4) return;
      const proj = s.map(px);
      d += 'M' + proj.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z';
      if (ri === 0) { // pusat label = pusat kotak ring luar terbesar
        const xs = proj.map(p => p[0]), ys = proj.map(p => p[1]);
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        if (w * h > bestArea) {
          bestArea = w * h;
          cx = (Math.max(...xs) + Math.min(...xs)) / 2;
          cy = (Math.max(...ys) + Math.min(...ys)) / 2;
        }
      }
    });
  });
  return { id: it.id, name: it.name, d, cx: r1(cx), cy: r1(cy) };
}).sort((a, b) => a.id.localeCompare(b.id));

const file = `// FILE HASIL GENERATE - jangan diedit manual. Dibuat oleh scripts/build-kecamatan-map.cjs
// Sumber batas: Batas Administrasi Indonesia (Alf-Anas/batas-administrasi-indonesia), kecamatan kode kab. 32.06.
export interface KecamatanShape { id: string; name: string; d: string; cx: number; cy: number; }

export const KECAMATAN_VIEWBOX = { width: ${VIEW_W}, height: ${viewH} };

// Parameter proyeksi supaya koordinat (lat, lon) bisa diletakkan di atas peta SVG yang sama.
const MIN_LON = ${minLon};
const MAX_LAT = ${maxLat};
const COS_LAT = ${cosLat};
const SCALE = ${scale};

export const projectLatLon = (lat: number, lon: number) => ({
  x: (lon - MIN_LON) * COS_LAT * SCALE,
  y: (MAX_LAT - lat) * SCALE
});

export const KECAMATAN_SHAPES: KecamatanShape[] = ${JSON.stringify(out)};
`;
const target = path.join(__dirname, '..', 'src', 'data', 'kecamatanMap.ts');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, file);
console.log('OK', out.length, 'kecamatan,', (file.length / 1024).toFixed(0), 'KB, viewBox', VIEW_W, 'x', viewH);
