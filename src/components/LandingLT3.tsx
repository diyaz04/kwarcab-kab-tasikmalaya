import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Megaphone, FileDown, X, ArrowRight, ChevronDown } from 'lucide-react';
import type { Lt3Data, Lt3Jenis } from '../types';
import { bannerStatus, buildKlasemenKwarran, fmtNilai, MEDALI_EMOJI, MEDALI_LABEL, TANPA_KWARRAN, KELOMPOK_LIST, KELOMPOK_LABEL, juaraLomba } from '../utils/lt3';

const fmtTanggal = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PERINGKAT_CLS = ['bg-amber-100 text-amber-800 border-amber-300', 'bg-gray-100 text-gray-700 border-gray-300', 'bg-orange-100 text-orange-800 border-orange-300'];

interface LandingLT3Props { lt3: Lt3Data }

/** Halaman publik "Info LT III": pengumuman, unduh juknis, dan klasemen medali per Kwarran (klik untuk detail medali regu). */
export default function LandingLT3({ lt3 }: LandingLT3Props) {
  const [jenis, setJenis] = useState<Lt3Jenis>('putra');
  const [lombaId, setLombaId] = useState<string | null>(null); // null = klasemen medali
  const [terbuka, setTerbuka] = useState<string | null>(null); // Kwarran yang detailnya dibuka

  const lombaAktif = lombaId && lt3.lomba.some(l => l.id === lombaId) ? lombaId : null;
  const rows = buildKlasemenKwarran(lt3, jenis, lombaAktif);
  const jumlahKwarran = (j: Lt3Jenis) => new Set(lt3.regu.filter(r => r.jenis === j).map(r => r.kwarran || TANPA_KWARRAN)).size;
  const namaLomba = (id: string) => lt3.lomba.find(l => l.id === id)?.nama || '';
  const kolom = lombaAktif === null ? 6 : 5;

  const pilihJenis = (j: Lt3Jenis) => { setJenis(j); setTerbuka(null); };
  const pilihLomba = (id: string | null) => { setLombaId(id); setTerbuka(null); };

  return (
    <div className="pt-32 pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5" /> Info LT III
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-green-900 font-heading">{lt3.judul}</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-green-700 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* Pengumuman */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4 text-green-700" /> Pengumuman
          </h3>
          {lt3.pengumuman_tanggal && <p className="text-[11px] text-gray-400 mb-3">{fmtTanggal(lt3.pengumuman_tanggal)}</p>}
          {lt3.pengumuman ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{lt3.pengumuman}</p>
          ) : (
            <p className="text-sm text-gray-400">Belum ada pengumuman.</p>
          )}
        </section>

        {/* Juknis */}
        <section className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-2"><FileDown className="w-4 h-4" /> Petunjuk Teknis</h3>
            <p className="text-sm text-green-50 leading-relaxed">{lt3.juknis.nama || 'Juknis LT III'}</p>
          </div>
          {lt3.juknis.url ? (
            <a
              href={lt3.juknis.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-green-800 text-xs font-extrabold uppercase tracking-wide hover:bg-green-50 transition"
            >
              <FileDown className="w-4 h-4" /> Unduh Juknis LT III
            </a>
          ) : (
            <p className="mt-5 text-xs text-green-100">Juknis belum tersedia.</p>
          )}
        </section>
      </div>

      {/* Pengumuman Kejuaraan per mata lomba (hanya lomba yang diumumkan admin) */}
      {lt3.lomba.some(l => l.diumumkan) && (
        <section className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-6 mb-10">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-amber-600" /> Pengumuman Kejuaraan
          </h3>
          <p className="text-[11px] text-gray-500 mb-5">Juara 1, 2, dan 3 tiap mata lomba.</p>
          <div className="space-y-6">
            {KELOMPOK_LIST.map(k => {
              const daftar = lt3.lomba.filter(l => l.kelompok === k && l.diumumkan);
              if (daftar.length === 0) return null;
              return (
                <div key={k}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{KELOMPOK_LABEL[k]}</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {daftar.map(l => (
                      <div key={l.id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-amber-50/60 to-white p-4">
                        <div className="font-extrabold text-green-900 text-base mb-3">{l.nama}</div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {(['putra', 'putri'] as Lt3Jenis[]).map(j => {
                            const juara = juaraLomba(lt3, j, l.id);
                            return (
                              <div key={j}>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Regu {j === 'putra' ? 'Putra' : 'Putri'}</div>
                                {juara.length === 0 ? (
                                  <p className="text-xs text-gray-400">Belum ada hasil.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {juara.map(x => (
                                      <li key={x.regu.id} className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 px-3 py-2">
                                        <span className="text-xl leading-none mt-0.5" title={MEDALI_LABEL[x.medali]}>{MEDALI_EMOJI[x.medali]}</span>
                                        <span className="min-w-0 text-xs">
                                          <span className="block font-bold text-gray-900">Juara {x.peringkat} · {x.regu.kwarran ? `Kwarran ${x.regu.kwarran}` : x.regu.nama}</span>
                                          <span className="block text-gray-500">{x.regu.nama}{x.regu.asal ? ` · ${x.regu.asal}` : ''} · nilai {fmtNilai(x.nilai)}</span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Klasemen per Kwarran */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-green-700" /> Klasemen Sementara per Kwarran
          </h3>
          <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold">
            {(['putra', 'putri'] as Lt3Jenis[]).map(j => (
              <button
                key={j}
                type="button"
                onClick={() => pilihJenis(j)}
                className={`px-4 py-2 transition ${jenis === j ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'}`}
              >
                Regu {j === 'putra' ? 'Putra' : 'Putri'} ({jumlahKwarran(j)})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button"
            onClick={() => pilihLomba(null)}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${lombaAktif === null ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
          >
            🏅 Perolehan Medali
          </button>
          {lt3.lomba.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => pilihLomba(l.id)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${lombaAktif === l.id ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
            >
              {l.nama} <span className="font-normal text-gray-400">· {KELOMPOK_LABEL[l.kelompok].replace('Lomba ', '')}</span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Belum ada regu {jenis === 'putra' ? 'putra' : 'putri'} yang terdaftar.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[480px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-y border-gray-100">
                  <th className="py-3 px-4 w-16 text-center">Peringkat</th>
                  <th className="py-3 px-4">Kwarran</th>
                  {lombaAktif === null ? (
                    <>
                      <th className="py-3 px-2 text-center" title="Emas">🥇</th>
                      <th className="py-3 px-2 text-center" title="Perak">🥈</th>
                      <th className="py-3 px-2 text-center" title="Perunggu">🥉</th>
                      <th className="py-3 px-4 text-center">Poin</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-center">Nilai Terbaik</th>
                      <th className="py-3 px-4 text-center">Medali</th>
                      <th className="py-3 px-4 text-center">Poin</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => {
                  const buka = terbuka === r.kwarran;
                  return (
                    <React.Fragment key={r.kwarran}>
                      <tr
                        onClick={() => setTerbuka(buka ? null : r.kwarran)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTerbuka(buka ? null : r.kwarran); } }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={buka}
                        className={`cursor-pointer hover:bg-green-50/60 focus:outline-none focus:bg-green-50 ${buka ? 'bg-green-50/60' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          {r.peringkat > 0 ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-extrabold ${PERINGKAT_CLS[r.peringkat - 1] || 'bg-white text-gray-600 border-gray-200'}`}>{r.peringkat}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            {r.kwarran === TANPA_KWARRAN ? r.kwarran : `Kwarran ${r.kwarran}`}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${buka ? 'rotate-180' : ''}`} />
                          </div>
                          <div className="text-[11px] text-gray-500">{r.regu.map(h => h.regu.nama).join(', ')}</div>
                        </td>
                        {lombaAktif === null ? (
                          <>
                            <td className="py-3 px-2 text-center font-extrabold text-amber-700 text-sm">{r.emas}</td>
                            <td className="py-3 px-2 text-center font-extrabold text-gray-600 text-sm">{r.perak}</td>
                            <td className="py-3 px-2 text-center font-extrabold text-orange-700 text-sm">{r.perunggu}</td>
                            <td className="py-3 px-4 text-center font-extrabold text-green-800 text-sm">{fmtNilai(r.poin)}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center font-extrabold text-green-800 text-sm">{fmtNilai(r.skor)}</td>
                            <td className="py-3 px-4 text-center text-base">{r.medali ? <span title={MEDALI_LABEL[r.medali]}>{MEDALI_EMOJI[r.medali]}</span> : <span className="text-gray-300 text-xs">-</span>}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{r.medali && r.skor !== null ? fmtNilai(lt3.poin[lt3.lomba.find(l => l.id === lombaAktif)?.kelompok || 'utama'][r.medali]) : '-'}</td>
                          </>
                        )}
                      </tr>
                      {buka && (
                        <tr>
                          <td colSpan={kolom} className="bg-green-50/40 px-4 py-4">
                            <div className="space-y-4">
                              {r.regu.map(h => {
                                const medaliRegu = lt3.lomba.map(l => h.perLomba[l.id]).filter(x => x?.medali);
                                return (
                                  <div key={h.regu.id} className="bg-white rounded-xl border border-green-100 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                      <div>
                                        <div className="font-bold text-gray-900 text-sm">{h.regu.nama}</div>
                                        {h.regu.asal && <div className="text-[11px] text-gray-500">{h.regu.asal}</div>}
                                      </div>
                                      <div className="text-[11px] font-bold text-gray-600 flex items-center gap-2">
                                        {(['emas', 'perak', 'perunggu'] as const).map(m => {
                                          const n = medaliRegu.filter(x => x?.medali === m).length;
                                          return <span key={m} title={MEDALI_LABEL[m]}>{MEDALI_EMOJI[m]} {n}</span>;
                                        })}
                                        <span className="text-gray-400">•</span>
                                        <span className="text-green-800">{fmtNilai(h.poin)} poin</span>
                                        <span className="text-gray-400">•</span>
                                        <span>Total nilai {fmtNilai(h.total)}</span>
                                      </div>
                                    </div>
                                    {lt3.lomba.length === 0 ? (
                                      <p className="text-xs text-gray-400">Belum ada mata lomba.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {KELOMPOK_LIST.map(k => {
                                          const daftar = lt3.lomba.filter(l => l.kelompok === k);
                                          if (daftar.length === 0) return null;
                                          return (
                                            <div key={k}>
                                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                                {KELOMPOK_LABEL[k]} <span className="normal-case font-normal text-gray-400">(🥇 {lt3.poin[k].emas} • 🥈 {lt3.poin[k].perak} • 🥉 {lt3.poin[k].perunggu} poin)</span>
                                              </div>
                                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {daftar.map(l => {
                                                  const x = h.perLomba[l.id];
                                                  return (
                                                    <div key={l.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${x?.medali ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                                                      <span className="font-semibold text-gray-700">{l.nama}</span>
                                                      <span className="text-right text-gray-600 whitespace-nowrap">
                                                        {x ? (
                                                          <>
                                                            <b className="text-gray-900">{fmtNilai(x.nilai)}</b> • Juara {x.peringkat} {x.medali ? <>{MEDALI_EMOJI[x.medali]} <b className="text-green-800">+{fmtNilai(x.poin)}</b></> : ''}
                                                          </>
                                                        ) : (
                                                          <span className="text-gray-400">belum dinilai</span>
                                                        )}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-4">
          Klik Kwarran untuk melihat detail medali regunya. Medali dihitung per mata lomba (peringkat 1, 2, 3 = emas, perak, perunggu); poin tiap medali berbeda untuk Lomba Utama, Penunjang, dan Tambahan. Klasemen diurutkan dari total poin. Klasemen bersifat sementara dan dapat berubah sampai pengumuman resmi panitia.
        </p>
      </section>
    </div>
  );
}

interface Lt3BannerPopupProps {
  lt3: Lt3Data | null | undefined;
  onOpenInfo: () => void;
}

/** Popup banner promosi LT III: tampil sekali per sesi selama masa aktif yang diatur admin. */
export function Lt3BannerPopup({ lt3, onOpenInfo }: Lt3BannerPopupProps) {
  const [open, setOpen] = useState(false);
  const status = lt3 ? bannerStatus(lt3) : 'nonaktif';
  const key = lt3 ? `lt3_banner_seen:${lt3.banner.url}:${lt3.banner.mulai}:${lt3.banner.selesai}` : '';

  useEffect(() => {
    if (status !== 'aktif' || !key) return;
    let seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; } catch { /* abaikan */ }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [status, key]);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(key, '1'); } catch { /* abaikan */ }
  };

  if (!open || !lt3 || status !== 'aktif') return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close}>
      <div className="relative max-w-lg w-full max-h-[92vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} aria-label="Tutup" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <img src={lt3.banner.url} alt={lt3.banner.judul || 'Banner LT III'} className="w-full object-contain bg-gray-100 min-h-0" style={{ maxHeight: '72vh' }} />
        <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{lt3.banner.judul || lt3.judul}</span>
          <button
            type="button"
            onClick={() => { close(); onOpenInfo(); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wide"
          >
            Lihat Info LT III <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
