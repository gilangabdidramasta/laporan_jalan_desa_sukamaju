# Public Web — Lapor Jalan Desa Sukamaju

Situs publik pelaporan jalan rusak untuk **Desa Sukamaju**. Warga dapat melihat peta
jalan rusak yang sudah diverifikasi, membaca berita desa, mengenal profil desa, dan
mengirim laporan kerusakan jalan.

> Frontend situs publik. Seluruh data (laporan, berita, akun warga) diambil dari REST API
> di `apps/api`; tidak ada lagi data tiruan di peramban.

## Menjalankan

Jalankan API lebih dahulu (`cd apps/api && npm run dev`), lalu:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + bundle produksi
npm run lint     # oxlint
```

Proxy Vite meneruskan `/api` dan `/uploads` ke `http://localhost:4000`.

## Akun

Tidak ada akun warga contoh. Daftarkan akun baru melalui `/daftar`, atau gunakan akun yang
sudah dibuat. Password hanya dapat direset oleh admin desa (tidak ada lupa password).

## Halaman

| Rute | Keterangan |
| ---- | ---------- |
| `/` | Beranda: peta ringkas, statistik, berita terbaru, alur pelaporan |
| `/laporan` | Peta sebaran laporan `PROSES` + daftar laporan `PROSES`/`DIPERBAIKI`, filter jenis & status, pencarian |
| `/laporan/:kode` | Detail laporan (tampil publik bila `PROSES` atau `DIPERBAIKI`) |
| `/laporan/baru` | Formulir 4 langkah (foto → lokasi → detail → ringkasan), wajib masuk |
| `/laporan/saya` | Daftar laporan milik pengguna + status verifikasi, wajib masuk |
| `/laporan/:kode/edit` | Ubah laporan, hanya selama status masih menunggu |
| `/berita`, `/berita/:slug` | Kabar dan berita desa |
| `/profil` | Sambutan, sejarah & ringkasan desa, kontak layanan |
| `/masuk`, `/daftar` | Autentikasi warga |

## Aturan penting

- Laporan hanya tampil di area publik setelah **disetujui admin desa**
  (`PENDING` → `PROSES`; lalu `DIPERBAIKI` setelah 3 foto bukti perbaikan).
- Peta publik hanya menampilkan laporan berstatus `PROSES`. Laporan `DIPERBAIKI`
  tetap tampil di daftar & detail (termasuk peta lokasinya) sebagai riwayat.
- Warga hanya dapat mengubah laporannya sendiri selama status `PENDING`.
- Password warga hanya dapat direset oleh admin desa (tidak ada lupa password).
- Lokasi wajib diisi dua cara: **alamat teks** dan **pin peta**.
- Foto 1–3 berkas (JPG/PNG/WebP, maks 5 MB) dan dikompresi di sisi klien.
- Laporan dibatasi maksimal 10 per warga per hari.
- Peta memakai **OpenStreetMap** melalui Leaflet — tanpa Google Maps.

## Teknologi

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · React Router 7 ·
TanStack Query 5 · Leaflet / react-leaflet 5
