# Deployment

Panduan menaikkan aplikasi ini ke internet. Ada dua jalur:

| | **A. Vercel penuh** | **B. Vercel + Railway** |
|---|---|---|
| Frontend | Vercel (2 project) | Vercel (2 project) |
| API | Vercel Functions | Railway |
| Database | Turso (libSQL) | SQLite di volume Railway |
| Foto | Vercel Blob | Disk Railway |
| Biaya | Rp 0 (tier gratis) | Kredit awal, lalu ±$5/bln |
| Refactor | sudah selesai | sudah selesai |

Kode API sekarang **mendukung keduanya secara otomatis**:

- `TURSO_DATABASE_URL` diisi → memakai Turso.
- `TURSO_DATABASE_URL` kosong → memakai SQLite lokal di `apps/api/data/`.
- `BLOB_READ_WRITE_TOKEN` diisi → foto ke Vercel Blob.
- Kosong → foto ke `apps/api/uploads/` (atau `STORAGE_DIR`).

Tidak ada file yang perlu diubah lagi untuk berpindah mode.

---

## 0. Persiapan

- Node.js 24+
- Repo sudah di GitHub
- Akun [Vercel](https://vercel.com) dan [Turso](https://turso.tech)

```bash
cd apps/api && npm install
npm run dev        # pastikan tetap jalan di lokal
```

---

# Jalur A — Semua di Vercel

## A1. Buat database Turso

```bash
npm i -g turso
turso auth login
turso db create lapor-jalan --location sin

turso db show lapor-jalan --url        # libsql://lapor-jalan-xxxx.turso.io
turso db tokens create lapor-jalan     # simpan tokennya
```

Region `sin` (Singapore) dipilih agar dekat dengan region function `sin1` yang
sudah diset di `apps/api/vercel.json`.

## A2. Pindahkan data lama (opsional)

Lewati langkah ini kalau rela mulai dari database kosong. Kalau tidak, jalankan
dari folder `apps/api`:

```bash
set TURSO_DATABASE_URL=libsql://lapor-jalan-xxxx.turso.io
set TURSO_AUTH_TOKEN=xxxxxxxx
set BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx

npm run migrate:turso -- --with-photos
```

`--with-photos` mengunggah isi `uploads/` ke Blob dan mengganti path foto di
database menjadi URL absolut. Tanpa flag itu, hanya tabel yang disalin.

Setelah selesai, Super Admin tetap akun yang sama beserta password lamanya.

## A3. Deploy API

1. Vercel → **Add New → Project** → import repo GitHub.
2. **Root Directory**: `apps/api`
3. Framework Preset: biarkan terdeteksi **Express**.
   Build Command dan Output Directory dikosongkan.
4. **Environment Variables**:

| Key | Nilai |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://lapor-jalan-xxxx.turso.io` |
| `TURSO_AUTH_TOKEN` | token dari A1 |
| `BLOB_READ_WRITE_TOKEN` | dari langkah A4 |
| `JWT_SECRET` | string acak panjang, **wajib diganti** |
| `SUPERADMIN_EMAIL` | `superadmin@pekanbaru.go.id` |
| `SUPERADMIN_PASSWORD` | password kuat |
| `JSON_BODY_LIMIT` | `4mb` (opsional, ini nilai default di Vercel) |

5. **Deploy**, lalu buka `https://<api>.vercel.app/api/health`.
   Harus muncul `{"ok":true,...}`.

## A4. Buat Vercel Blob

Vercel → project API → **Storage → Create → Blob** → hubungkan ke project.
`BLOB_READ_WRITE_TOKEN` otomatis ditambahkan; kalau tidak, salin manual ke
Environment Variables lalu redeploy.

## A5. Deploy dua frontend

Buat **dua project baru** dari repo yang sama.

**Public web**

| Setelan | Nilai |
|---|---|
| Root Directory | `apps/public-web` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env | `VITE_API_URL = https://<api>.vercel.app/api` |

**Admin web**

| Setelan | Nilai |
|---|---|
| Root Directory | `apps/admin-web` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env | `VITE_API_URL = https://<api>.vercel.app/api/admin` |

Perhatikan bedanya: admin memakai `/api/admin` karena `admin-web/src/lib/api.ts`
menambahkan path relatif (`/login`, `/reports`, …) ke basis tersebut.

`VITE_API_URL` dibaca saat **build**, jadi setelah mengubahnya lakukan redeploy.

## A6. Checklist uji

- [ ] `/api/health` → `ok: true`
- [ ] Daftar + login warga
- [ ] Kirim laporan 3 foto → foto tampil (URL `public.blob.vercel-storage.com`)
- [ ] Login admin → setujui → selesaikan dengan 3 foto bukti
- [ ] Buat berita → terbitkan → muncul di `/berita`
- [ ] Buka `/laporan/<kode>` langsung (refresh) → tidak 404
- [ ] Hapus laporan → foto ikut hilang dari Blob

---

# Jalur B — Vercel + Railway (tanpa Turso)

Cocok kalau ingin tetap memakai SQLite dan tidak ingin bergantung pada dua
layanan tambahan.

## B1. Deploy API ke Railway

1. Railway → **New Project → Deploy from GitHub**.
2. **Root Directory**: `apps/api`
3. **Variables**:

```
NODE_VERSION=24
JWT_SECRET=<string acak panjang>
SUPERADMIN_EMAIL=superadmin@pekanbaru.go.id
SUPERADMIN_PASSWORD=<password kuat>
STORAGE_DIR=/data
```

4. **Settings → Volumes → Add Volume**, mount path `/data`.
5. Start Command: `npm start`
6. Healthcheck Path: `/api/health`

`STORAGE_DIR=/data` membuat `data/lapor.db` dan `uploads/` berada di volume,
sehingga data bertahan saat redeploy.

## B2. Pindahkan data lama

Salin `apps/api/data/lapor.db` dan folder `apps/api/uploads/` ke volume Railway.
Cara termudah: jalankan aplikasi sekali, lalu gunakan fitur shell/SSH Railway
untuk menaruh file di `/data/data/` dan `/data/uploads/`.

## B3. Deploy frontend

Sama seperti A5, tetapi `VITE_API_URL` diarahkan ke domain Railway:

- Public: `https://<api>.up.railway.app/api`
- Admin: `https://<api>.up.railway.app/api/admin`

---

# Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `413 Ukuran data terlalu besar` | Body melebihi 4,5 MB. Pastikan kompresi klien aktif, atau turunkan `JSON_BODY_LIMIT`. |
| `TURSO_DATABASE_URL belum diisi` | Project Vercel tidak punya env Turso. Vercel tidak punya disk permanen. |
| `Penyimpanan foto belum dikonfigurasi` | `BLOB_READ_WRITE_TOKEN` belum ada di project API. |
| Gambar 404 setelah deploy | Data lama masih menyimpan path `/uploads/...`. Jalankan `npm run migrate:turso -- --with-photos`. |
| Login selalu gagal padahal password benar | `JWT_SECRET` berubah antar-deploy, atau seed memakai password lain. Jalankan `npm run reset-superadmin -- <password>`. |
| Frontend memanggil `localhost:4000` | `VITE_API_URL` belum diset saat build. Set lalu redeploy. |
| Express tidak terdeteksi Vercel | Pastikan Root Directory `apps/api` dan file `src/app.js` ada. Alternatif: set Framework Preset ke **Other** lalu biarkan Vercel memakai entry `src/index.js`. |

---

# Catatan keamanan sebelum dipublikasikan

1. Ganti `JWT_SECRET` dan `SUPERADMIN_PASSWORD` — nilai default hanya untuk lokal.
2. `GET /api/reports/ticket/:code` masih mengembalikan laporan berstatus apa pun
   (termasuk `PENDING`/`DITOLAK`) bila kode tiket diketahui. UI membatasi, API tidak.
3. Isi berita disimpan sebagai HTML mentah tanpa sanitasi di server.
4. CORS memakai `origin: true` (mencerminkan origin apa pun).
