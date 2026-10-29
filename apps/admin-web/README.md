# Dashboard Admin — Lapor Jalan Desa Sukamaju

Dashboard internal untuk memverifikasi laporan jalan rusak, mengelola berita desa, serta
mengelola akun warga dan admin. Data diambil dari REST API di `apps/api`.

## Menjalankan

Jalankan API lebih dahulu (`cd apps/api && npm run dev`), lalu:

```bash
cd apps/admin-web
npm install
npm run dev      # http://localhost:5174
npm run build    # cek tipe + build produksi
npm run preview  # pratinjau hasil build (port 4174)
npm run lint
```

Website publik berada di `apps/public-web` (port 5173) dan membaca basis data yang sama
melalui API. Proxy Vite meneruskan `/api` dan `/uploads` ke `http://localhost:4000`.

## Akun

Basis data baru hanya berisi satu akun **Super Admin** (tidak ada akun admin/warga contoh):

| Peran | Email | Password | Akses |
| --- | --- | --- | --- |
| Super Admin | `superadmin@desa.id` | `super12345` | Baca saja untuk laporan/berita/warga; penuh untuk akun admin |

Buat akun **Admin** melalui menu **Akun Admin → Tambah Akun Admin**, atau dari terminal:

```bash
cd apps/api
npm run create-admin -- admin@desa.id admin12345 "Admin Desa" ADMIN
```

Lupa password Super Admin: `npm run reset-superadmin -- passwordBaru123` (dari `apps/api`).

## Rute

| Rute | Halaman | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- |
| `/login` | Masuk | ✅ | ✅ |
| `/` | Redirect ke `/laporan` | ✅ | ✅ |
| `/laporan` | Antrean & daftar laporan | ✅ | 👁 |
| `/laporan/:id` | Detail + aksi verifikasi | ✅ | 👁 |
| `/laporan/:id/edit` | Edit data laporan | ✅ | 403 |
| `/berita` | Daftar berita + pratinjau | ✅ | 👁 |
| `/berita/baru` | Tulis berita | ✅ | 403 |
| `/berita/:id/edit` | Edit berita | ✅ | 403 |
| `/akun-warga` | Daftar akun warga | ✅ | 👁 |
| `/akun-warga/:id` | Detail warga + laporannya | ✅ | 👁 |
| `/akun-admin` | Daftar akun admin | 403 | ✅ |
| `/akun-admin/baru` | Buat akun admin | 403 | ✅ |
| `/403`, `*` | Galat | ✅ | ✅ |

Hak akses juga ditegakkan di API, bukan hanya disembunyikan di UI.

## Perilaku penting

- Halaman pertama setelah masuk adalah **antrean laporan**; tidak ada halaman statistik.
- Tab **Menunggu** memakai urutan FIFO (laporan terlama di atas).
- Menyetujui laporan memindahkannya ke status **Proses** dan menampilkannya di peta publik; menolak wajib menyertakan alasan (minimal 10 karakter) yang tampil ke pelapor.
- Laporan berstatus **Proses** dapat ditandai **Diperbaiki** dengan mengunggah tepat 3 foto bukti perbaikan. Laporan `DIPERBAIKI` hilang dari peta sebaran tetapi tetap tampil di daftar & detail publik.
- Laporan yang sudah tayang dapat **ditarik** (hilang dari publik, data tetap ada) lalu **dipublikasikan ulang**; publikasi ulang memulihkan status `DIPERBAIKI` bila foto bukti masih ada.
- Edit laporan tidak mengubah status verifikasi dan mencatat perubahan field pada riwayat laporan.
- Berita wajib memiliki judul, slug unik, isi, dan gambar sampul sebelum diterbitkan.
- Super Admin tidak dapat menonaktifkan akunnya sendiri, dan minimal satu Super Admin harus aktif.
- Password warga/admin tidak dapat diubah sendiri: hanya melalui **reset password** yang menghasilkan password sementara (ditampilkan satu kali).
- Login dibatasi 5 percobaan gagal per 15 menit (dihitung di server).

## Struktur

```
src/
├── components/   # layout, tabel, dialog, editor, peta, galeri
├── lib/
│   ├── api.ts        # klien HTTP + token admin
│   ├── auth.tsx      # sesi admin (localStorage/sessionStorage)
│   ├── store.ts      # pemanggilan API: laporan, warga, admin, berita, log
│   ├── types.ts      # enum & tipe domain
│   └── image.ts      # validasi + kompresi foto klien
└── pages/        # 12 halaman sesuai sitemap-admin.md
```

## Catatan produksi

- Ganti `JWT_SECRET` di API dan gunakan HTTPS.
- Pertimbangkan cookie `HttpOnly` + CSRF sebagai pengganti token di `localStorage`.
- `apps/api/uploads/` menyimpan berkas di disk lokal; untuk skala besar gunakan object storage.
- Jalankan API di belakang reverse proxy yang sama dengan kedua frontend agar `/api` dan
  `/uploads` berada pada origin yang sama.

Dashboard ini dideploy otomatis oleh Vercel setiap ada push ke branch `main`.
