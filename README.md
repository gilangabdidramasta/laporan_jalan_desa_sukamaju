# Lapor Jalan Pekanbaru

Aplikasi pelaporan jalan rusak untuk Kota Pekanbaru. Warga melaporkan kerusakan jalan
lewat situs publik, Admin Kota memverifikasi dan memperbarui status penanganan, dan
warga dapat memantau progres melalui kode tiket.

## Isi repo

| Folder | Keterangan |
|---|---|
| `apps/api` | REST API (Express 4, ESM, Node 24) |
| `apps/public-web` | Situs publik untuk warga (React 19 + Vite + Tailwind 4) |
| `apps/admin-web` | Dashboard admin kota (React 19 + Vite + Tailwind 4) |
| `references` | PRD, sitemap, dan pedoman desain |
| `DEPLOY.md` | Panduan deploy ke Vercel (termasuk database Turso) |

## Arsitektur data

API punya dua mode yang dipilih otomatis dari environment variable, sehingga kode
yang sama berjalan di lokal maupun di serverless:

| Kondisi | Basis data | Foto |
|---|---|---|
| `TURSO_DATABASE_URL` diisi | Turso (libSQL) | `BLOB_READ_WRITE_TOKEN` diisi → Vercel Blob |
| `TURSO_DATABASE_URL` kosong | SQLite lokal (`apps/api/data/`) | disk (`apps/api/uploads/`) |

Bila `BLOB_READ_WRITE_TOKEN` kosong saat berjalan di Vercel, unggah foto akan
menolak dengan pesan konfigurasi — Vercel tidak punya disk permanen.

## Menjalankan di lokal

Prasyarat: **Node.js 24+**.

```bash
# 1. API
cd apps/api
npm install
cp .env.example .env      # opsional; tanpa .env memakai nilai default
npm run dev               # http://localhost:4000

# 2. Situs publik (terminal baru)
cd apps/public-web
npm install
npm run dev               # http://localhost:5173

# 3. Dashboard admin (terminal baru)
cd apps/admin-web
npm install
npm run dev               # http://localhost:5174
```

Frontend memakai path relatif `/api` secara default dan diteruskan oleh proxy Vite ke
`http://localhost:4000`, jadi tidak perlu mengisi `VITE_API_URL` untuk pengembangan.

### Akun awal

Saat basis data masih kosong, API membuat satu akun Super Admin:

- Email: `superadmin@pekanbaru.go.id`
- Password: `super12345`

Nilai ini dapat diubah lewat `SUPERADMIN_EMAIL` dan `SUPERADMIN_PASSWORD` sebelum
server pertama kali dijalankan. **Ganti password sebelum dipublikasikan.**

Akun Admin biasa dibuat dari dashboard (menu *Akun Admin*) atau lewat:

```bash
cd apps/api
npm run create-admin -- admin@pekanbaru.go.id "password-kuat" "Nama Admin" ADMIN
```

Jika password Super Admin terlupa:

```bash
npm run reset-superadmin -- "password-baru"
```

## Perintah berguna

Dijalankan dari `apps/api`:

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server dengan auto-reload dan `.env` |
| `npm start` | Server produksi |
| `npm run create-admin` | Membuat akun admin |
| `npm run reset-superadmin` | Mereset password Super Admin |
| `npm run migrate:turso` | Menyalin SQLite lokal ke Turso (opsional `--with-photos`) |

## Deploy

Ikuti [`DEPLOY.md`](DEPLOY.md). Ringkasnya:

1. Buat database Turso, salin URL dan token.
2. Deploy `apps/api` ke Vercel dengan env `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `JWT_SECRET`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.
3. Buat Vercel Blob untuk penyimpanan foto.
4. Deploy `apps/public-web` dan `apps/admin-web` dengan `VITE_API_URL` mengarah ke
   domain API (`/api` untuk publik, `/api/admin` untuk admin).

## Catatan keamanan

Sebelum dipakai publik, minimal lakukan:

- Ganti `JWT_SECRET` dan `SUPERADMIN_PASSWORD`.
- Batasi CORS ke domain frontend Anda (`apps/api/src/app.js` masih memakai `origin: true`).
- Sanitasi HTML berita di server; saat ini isi berita disimpan apa adanya.
