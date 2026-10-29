# Lapor Jalan Desa Sukamaju

Sistem aspirasi dan pemetaan jalan rusak untuk **Desa Sukamaju**. Repositori ini berisi
tiga aplikasi:

| Folder | Keterangan | Port dev |
| ------ | ---------- | -------- |
| `apps/api` | REST API + SQLite + penyimpanan foto (Express, Node 24) | `4000` |
| `apps/public-web` | Situs publik untuk warga | `5173` |
| `apps/admin-web` | Dashboard admin desa | `5174` |

Dokumen produk ada di `prd.md`, `sitemap-public.md`, `sitemap-admin.md`, dan `design`
decisions di `DESIGN.md`.

## Menjalankan (development)

Prasyarat: **Node.js 24+** (API memakai modul bawaan `node:sqlite`).

```bash
# 1. API
cd apps/api
npm install
npm run dev            # http://localhost:4000

# 2. Situs publik (terminal baru)
cd apps/public-web
npm install
npm run dev            # http://localhost:5173

# 3. Dashboard admin (terminal baru)
cd apps/admin-web
npm install
npm run dev            # http://localhost:5174
```

Kedua frontend meneruskan `/api` dan `/uploads` ke `http://localhost:4000` melalui proxy
Vite, jadi tidak ada konfigurasi CORS tambahan saat development.

## Akun awal

Saat API pertama kali dijalankan, basis data dibuat otomatis dan **hanya** berisi satu
akun Super Admin. Tidak ada laporan, berita, atau akun warga contoh.

| Peran | Email | Password |
| ----- | ----- | -------- |
| Super Admin | `superadmin@desa.id` | `super12345` |

Alur setelah login pertama:

1. Masuk ke dashboard admin dengan akun Super Admin.
2. Buka **Akun Admin → Tambah Akun Admin** untuk membuat akun `ADMIN`.
3. Gunakan akun `ADMIN` untuk memverifikasi laporan, menulis berita, dan mengelola akun warga.

> Super Admin bersifat **baca saja** untuk laporan, berita, dan akun warga (sesuai
> `sitemap-admin.md`), tetapi berwenang penuh mengelola akun admin.

Alternatif lewat terminal:

```bash
cd apps/api
npm run create-admin -- admin@desa.id admin12345 "Admin Desa" ADMIN
npm run reset-superadmin -- passwordBaru123   # bila lupa password Super Admin
```

## Data & penyimpanan

- Basis data: `apps/api/data/lapor.db` (SQLite, dibuat otomatis).
- Foto laporan & sampul berita: `apps/api/uploads/` (disajikan pada `/uploads/...`).
- Frontend tidak lagi memakai `localStorage` untuk data; hanya menyimpan token sesi
  (`lapor.token.v1` untuk warga, `lapor.admin.token.v1` untuk admin).
- Menghapus `apps/api/data/` dan `apps/api/uploads/` akan mengembalikan sistem ke kondisi
  kosong (Super Admin dibuat ulang saat API dinyalakan).

## Ringkasan API

Publik (`/api`):

| Metode | Endpoint | Keterangan |
| ------ | -------- | ---------- |
| `POST` | `/auth/register`, `/auth/login` | Registrasi & login warga (JWT) |
| `GET` | `/reports` | Laporan `PROSES` & `DIPERBAIKI` (filter jenis, status, tiket, paginasi) |
| `GET` | `/reports/stats` | Statistik publik (hanya laporan `PROSES`) |
| `GET` | `/reports/ticket/:kode` | Detail berdasarkan kode tiket |
| `GET` | `/reports/mine` | Laporan milik warga (perlu token) |
| `POST` | `/reports` | Kirim laporan (maks. 10/hari, 1–3 foto) |
| `PUT` | `/reports/:id` | Ubah laporan sendiri selama `PENDING` |
| `GET` | `/news`, `/news/:slug` | Berita berstatus `TERBIT` |

Admin (`/api/admin`, perlu token admin):

| Modul | Endpoint |
| ----- | -------- |
| Login | `POST /login`, `GET /me` |
| Laporan | `GET /reports`, `/reports/stats`, `/reports/:id`, `POST /reports/:id/{approve,complete,reject,withdraw,republish}`, `PUT`/`DELETE /reports/:id` |
| Warga | `GET /citizens`, `/citizens/stats`, `/citizens/:id`, `PATCH /citizens/:id/status`, `POST /citizens/:id/reset-password` |
| Admin | `GET`/`POST /admins`, `PATCH /admins/:id/status`, `POST /admins/:id/reset-password` |
| Berita | `GET`/`POST /news`, `GET`/`PUT`/`DELETE /news/:id`, `POST /news/:id/unpublish` |

Hak akses ditegakkan di server: `SUPER_ADMIN` ditolak (403) saat mengubah laporan,
berita, atau akun warga; modul akun admin hanya untuk `SUPER_ADMIN`.

## Variabel lingkungan (opsional)

Salin `apps/api/.env.example` menjadi `apps/api/.env` bila ingin mengubah konfigurasi;
berkas tersebut dimuat otomatis oleh `npm run dev`/`npm start`.

| Variabel | Default | Keterangan |
| -------- | ------- | ---------- |
| `PORT` | `4000` | Port API |
| `JWT_SECRET` | nilai dev | **Wajib diganti di produksi** |
| `SUPERADMIN_EMAIL` | `superadmin@desa.id` | Dipakai hanya saat seed awal |
| `SUPERADMIN_PASSWORD` | `super12345` | Dipakai hanya saat seed awal |

Frontend dapat diarahkan ke API lain dengan `VITE_API_URL` (default `/api`, `/api/admin`
untuk dashboard). Bila diisi, gunakan URL absolut, misalnya
`VITE_API_URL=http://localhost:4000/api`.

## Build produksi

```bash
cd apps/api && npm start
cd apps/public-web && npm run build
cd apps/admin-web && npm run build
```

Hasil build statis berada di `dist/`. Sajikan melalui reverse proxy yang juga meneruskan
`/api` dan `/uploads` ke API agar sesi, foto, dan data berjalan pada origin yang sama.

## Catatan

- Foto dikompresi di peramban (maks. 1440 px, JPEG kualitas 0.72) sebelum dikirim sebagai
  data URL, lalu API menyimpannya sebagai berkas di `uploads/`.
- Password disimpan sebagai hash bcrypt; tidak ada ganti password mandiri — reset dilakukan
  admin (warga) atau Super Admin (admin).
- Login admin dibatasi 5 percobaan gagal per 15 menit.
