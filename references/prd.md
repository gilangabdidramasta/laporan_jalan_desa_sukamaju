# PRD — Sistem Pelaporan Jalan Rusak Desa

| Item | Keterangan |
| --- | --- |
| Versi | 1.0 (Draft) |
| Tanggal | 28 Oktober 2026 |
| Nama desa | `[MENYUSUL]` |
| Status | Menunggu persetujuan |

---

## 1. Ringkasan Eksekutif

### 1.1 Problem Statement

Laporan jalan rusak di desa tersebar di grup WhatsApp dan disampaikan secara lisan, sehingga tidak ada data terpusat dan warga tidak tahu kondisi jalan secara keseluruhan.

### 1.2 Solusi yang Diusulkan

Sebuah website publik yang memungkinkan warga mengirim laporan jalan rusak lengkap dengan foto dan titik koordinat, lalu menampilkannya pada peta desa setelah diverifikasi oleh Admin. Sistem ini **hanya memetakan dan mempublikasikan** lokasi jalan rusak — tidak menangani perbaikan dan tidak menjanjikan jadwal penanganan.

### 1.3 Tujuan

1. Menyediakan satu sumber data terpusat mengenai lokasi jalan rusak di desa.
2. Memberi warga gambaran menyeluruh kondisi jalan melalui peta interaktif.
3. Menjaga kualitas data melalui verifikasi Admin sebelum laporan dipublikasikan.
4. Memberi pelapor kepastian status atas laporannya.

### 1.4 Metrik Keberhasilan

Belum ditetapkan oleh pemangku kepentingan. Evaluasi fase awal dilakukan secara kualitatif: apakah warga menggunakan sistem ini dan apakah data yang masuk layak dipublikasikan.

---

## 2. Pengalaman Pengguna & Fungsionalitas

### 2.1 Persona

| Persona | Deskripsi | Hak akses |
| --- | --- | --- |
| **Pengunjung** | Warga atau siapa pun yang membuka website tanpa akun | Baca seluruh halaman publik |
| **Warga terdaftar** | Warga yang mendaftar akun di website publik | Baca semua + kirim & kelola laporan sendiri |
| **Admin** | Petugas desa yang mengelola isi website | Semua operasional |
| **Super Admin** | Pemilik sistem | Kelola akun admin + baca saja modul lain |

### 2.2 Peta Halaman

**Website publik**

| Rute | Halaman | Akses |
| --- | --- | --- |
| `/` | Beranda | Publik |
| `/berita` | Daftar berita desa | Publik |
| `/berita/:slug` | Detail berita | Publik |
| `/profil` | Profil desa (hardcode) | Publik |
| `/laporan` | Peta + daftar laporan jalan rusak | Publik |
| `/laporan/:ticketCode` | Detail laporan | Publik (hanya status `DISETUJUI`) |
| `/laporan/baru` | Form buat laporan | Warga login |
| `/laporan/saya` | Daftar laporan milik sendiri | Warga login |
| `/masuk` | Login | Publik |
| `/daftar` | Registrasi | Publik |

**Dashboard admin**

| Rute | Halaman | Akses |
| --- | --- | --- |
| `/login` | Login admin | Publik |
| `/laporan` | Antrean laporan | Admin, Super Admin (read-only) |
| `/laporan/:id` | Detail & aksi laporan | Admin, Super Admin (read-only) |
| `/berita` | Kelola berita | Admin, Super Admin (read-only) |
| `/akun-warga` | Kelola akun warga | Admin, Super Admin (read-only) |
| `/akun-admin` | Kelola akun admin | Super Admin |

### 2.3 Status Laporan

| Status | Tampil di publik | Deskripsi |
| --- | --- | --- |
| `PENDING` | Tidak | Baru dikirim, menunggu verifikasi Admin |
| `DISETUJUI` | Ya | Lolos verifikasi, tampil di peta dan daftar publik |
| `DITOLAK` | Tidak | Ditolak Admin, wajib disertai alasan |
| `DITARIK` | Tidak | Pernah tampil, kemudian ditarik Admin |

Transisi yang diizinkan:

```
PENDING ──► DISETUJUI ──► DITARIK
   │
   └──────► DITOLAK
```

Status `DISETUJUI` dan `DITOLAK` bersifat final bagi warga. Hanya Admin yang dapat mengubahnya lebih lanjut (menarik laporan).

### 2.4 User Stories & Acceptance Criteria

#### A. Pengunjung (tanpa akun)

**A1. Melihat beranda**
- **Sebagai** pengunjung, **saya ingin** melihat ringkasan desa dan peta jalan rusak, **supaya** langsung tahu kondisi jalan.
- **AC:**
  - [ ] Beranda menampilkan peta sebaran laporan berstatus `DISETUJUI`.
  - [ ] Menampilkan jumlah laporan yang sudah dipublikasikan.
  - [ ] Menampilkan maksimal 3 berita terbaru.
  - [ ] Halaman dapat dibuka tanpa login.

**A2. Membaca berita desa**
- **Sebagai** pengunjung, **saya ingin** membaca berita desa, **supaya** tahu kegiatan terbaru.
- **AC:**
  - [ ] Daftar berita menampilkan judul, gambar sampul, tanggal terbit, dan cuplikan.
  - [ ] Berita berstatus `DRAFT` tidak pernah tampil.
  - [ ] Daftar diurutkan dari tanggal terbit terbaru.
  - [ ] Detail berita dapat dibuka lewat slug yang ramah URL.

**A3. Membaca profil desa**
- **Sebagai** pengunjung, **saya ingin** membaca profil desa, **supaya** mengenal desa tersebut.
- **AC:**
  - [ ] Halaman menampilkan sejarah, visi, misi, struktur organisasi, alamat kantor, dan kontak.
  - [ ] Isi halaman bersifat statis (hardcode di kode frontend).

**A4. Melihat peta dan daftar laporan**
- **Sebagai** pengunjung, **saya ingin** melihat di mana saja jalan rusak, **supaya** bisa menghindari atau melaporkannya.
- **AC:**
  - [ ] Peta menampilkan **hanya** laporan berstatus `DISETUJUI`.
  - [ ] Setiap titik dapat diklik dan menampilkan ringkasan (foto, alamat, jenis kerusakan).
  - [ ] Daftar laporan menampilkan maksimal 10 item per halaman.
  - [ ] Daftar dapat difilter berdasarkan jenis kerusakan.
  - [ ] Daftar dapat dicari berdasarkan kode tiket.

**A5. Mencari laporan lewat kode tiket**
- **AC:**
  - [ ] Pencarian menerima format `#RPT-YYYYMMDD-XXX`.
  - [ ] Kode yang tidak ada menampilkan pesan "Laporan tidak ditemukan".
  - [ ] Kode milik laporan `PENDING`/`DITOLAK`/`DITARIK` menampilkan pesan "Laporan belum/tidak dipublikasikan" tanpa membocorkan isinya.

#### B. Warga terdaftar

**B1. Mendaftar akun**
- **Sebagai** warga, **saya ingin** mendaftar dengan email, **supaya** bisa mengirim laporan.
- **AC:**
  - [ ] Field: nama lengkap, email, nomor WhatsApp, password, konfirmasi password.
  - [ ] Email harus unik dan berformat valid.
  - [ ] Password minimal 8 karakter.
  - [ ] Akun **langsung aktif** setelah registrasi, tanpa verifikasi email.
  - [ ] Setelah registrasi berhasil, pengguna otomatis login dan diarahkan ke `/laporan/baru`.
  - [ ] Email yang sudah terdaftar menampilkan pesan "Email sudah digunakan".

**B2. Login dan logout**
- **AC:**
  - [ ] Login menggunakan email + password.
  - [ ] Sesi disimpan pada HttpOnly cookie.
  - [ ] Setelah 5 percobaan gagal berturut-turut, akun dikunci sementara 15 menit.
  - [ ] Logout menghapus cookie sesi dan mengarahkan ke beranda.

**B3. Lupa password**
- **AC:**
  - [ ] Tidak ada alur reset maupun ganti password mandiri, baik lewat email maupun dari halaman akun.
  - [ ] Halaman login menampilkan instruksi: hubungi Admin desa untuk reset password.
  - [ ] Admin mereset password dari dashboard, lalu menyerahkan password sementara kepada warga.
  - [ ] Setelah direset, sesi aktif warga tersebut otomatis tidak berlaku.

**B4. Mengirim laporan**
- **Sebagai** warga, **saya ingin** mengirim laporan jalan rusak, **supaya** lokasi tersebut tercatat dan terlihat publik.
- **AC:**
  - [ ] Hanya dapat diakses setelah login; pengunjung diarahkan ke `/masuk`.
  - [ ] Field wajib: 1–3 foto, alamat lengkap, titik koordinat, jenis kerusakan, deskripsi (min. 30 karakter).
  - [ ] Identitas pelapor terisi otomatis dari akun dan tidak dapat diubah.
  - [ ] Foto dikompres otomatis di browser sebelum dikirim.
  - [ ] Draft tersimpan otomatis di browser dan dipulihkan bila halaman ditutup.
  - [ ] Setelah berhasil, sistem menampilkan kode tiket dan status `PENDING`.
  - [ ] Batas 10 laporan per akun per hari.

**B5. Melihat laporan sendiri**
- **AC:**
  - [ ] Halaman `/laporan/saya` menampilkan semua laporan milik pengguna, termasuk yang belum dipublikasikan.
  - [ ] Setiap item menampilkan status dan tanggal kirim.
  - [ ] Laporan `DITOLAK` menampilkan alasan penolakan.
  - [ ] Laporan `DITARIK` menampilkan keterangan "ditarik dari publikasi".

**B6. Mengedit laporan sendiri**
- **AC:**
  - [ ] Hanya dapat dilakukan selama status `PENDING`.
  - [ ] Field yang dapat diubah: foto, alamat, titik koordinat, jenis kerusakan, deskripsi.
  - [ ] Setelah status berubah, tombol edit tidak ditampilkan dan API menolak dengan `403`.

> **Catatan:** warga **tidak memiliki alur ganti password mandiri**. Password hanya dapat diubah melalui reset oleh Admin (lihat C9).

#### C. Admin

**C1. Melihat antrean laporan**
- **AC:**
  - [ ] Daftar semua laporan dengan filter status (`PENDING`, `DISETUJUI`, `DITOLAK`, `DITARIK`).
  - [ ] Dapat dicari berdasarkan kode tiket, nama pelapor, atau alamat.
  - [ ] Default tampilan: status `PENDING`, terbaru di atas.
  - [ ] Menampilkan jumlah laporan per status.

**C2. Melihat detail laporan**
- **AC:**
  - [ ] Menampilkan seluruh foto, alamat, koordinat (peta), jenis kerusakan, deskripsi, data pelapor (nama + no. WA + email).
  - [ ] Menampilkan riwayat perubahan dari `report_logs`.

**C3. Menyetujui laporan**
- **AC:**
  - [ ] Aksi "Setujui" mengubah status `PENDING` → `DISETUJUI`.
  - [ ] Laporan langsung tampil di website publik setelah disetujui.
  - [ ] Aksi tercatat di `report_logs` beserta ID admin.

**C4. Menolak laporan**
- **AC:**
  - [ ] Aksi "Tolak" mewajibkan alasan (min. 10 karakter).
  - [ ] Status berubah `PENDING` → `DITOLAK`.
  - [ ] Alasan tampil di halaman "Laporan Saya" milik pelapor.
  - [ ] Aksi tercatat di `report_logs`.

**C5. Mengedit laporan warga**
- **AC:**
  - [ ] Admin dapat mengubah alamat, titik koordinat, jenis kerusakan, deskripsi, dan foto.
  - [ ] Admin tidak dapat mengubah pemilik laporan maupun kode tiket.
  - [ ] Setiap perubahan tercatat di `report_logs` beserta daftar field yang berubah.

**C6. Menarik laporan**
- **AC:**
  - [ ] Dapat dilakukan pada laporan `DISETUJUI`.
  - [ ] Status berubah menjadi `DITARIK`; data tetap tersimpan.
  - [ ] Titik hilang dari peta dan daftar publik.
  - [ ] Alasan penarikan bersifat opsional (catatan internal).

**C7. Menghapus laporan permanen**
- **AC:**
  - [ ] Hanya untuk laporan spam/tidak valid.
  - [ ] Menampilkan dialog konfirmasi yang menyebutkan data tidak dapat dikembalikan.
  - [ ] Menghapus baris `reports`, `report_photos`, `report_damage_types`, dan `report_logs` terkait.
  - [ ] File foto ikut dihapus dari penyimpanan.

**C8. Mengelola berita**
- **AC:**
  - [ ] Admin dapat membuat, mengedit, menghapus, dan menerbitkan berita.
  - [ ] Field: judul, slug otomatis (dapat diedit), isi (rich text sederhana), gambar sampul.
  - [ ] Status `DRAFT` atau `TERBIT`.
  - [ ] Berita `DRAFT` tidak tampil di publik.
  - [ ] Menghapus berita memerlukan konfirmasi.

**C9. Mengelola akun warga**
- **AC:**
  - [ ] Daftar warga menampilkan nama, email, no. WA, tanggal daftar, status, jumlah laporan.
  - [ ] Admin dapat menonaktifkan akun; warga nonaktif tidak bisa login.
  - [ ] Admin dapat mereset password; sistem membuat password sementara yang ditampilkan sekali.
  - [ ] Reset password adalah satu-satunya cara mengubah password warga.
  - [ ] Reset password membatalkan sesi aktif warga tersebut.
  - [ ] Admin tidak dapat menghapus akun warga (menjaga integritas data laporan).

#### D. Super Admin

**D1. Membuat akun admin**
- **AC:**
  - [ ] Field: nama, email, password awal, role (`ADMIN` / `SUPER_ADMIN`).
  - [ ] Email harus unik di tabel `admins`.
  - [ ] Akun langsung aktif.

**D2. Menonaktifkan akun admin**
- **AC:**
  - [ ] Akun nonaktif tidak bisa login dan sesi aktifnya langsung tidak berlaku.
  - [ ] Super Admin tidak dapat menonaktifkan akunnya sendiri.

**D3. Reset password admin**
- **AC:**
  - [ ] Sistem membuat password sementara dan menampilkannya sekali.

**D4. Akses baca saja ke modul lain**
- **AC:**
  - [ ] Super Admin dapat membuka daftar dan detail laporan, berita, serta akun warga.
  - [ ] Seluruh tombol aksi (setujui, tolak, edit, tarik, hapus, simpan) tidak ditampilkan.
  - [ ] API menolak permintaan tulis dari `SUPER_ADMIN` dengan `403`.

### 2.5 Aturan Bisnis

1. Hanya laporan `DISETUJUI` yang boleh tampil di publik.
2. Warga hanya dapat mengedit laporan selama `PENDING`.
3. Penolakan laporan wajib disertai alasan.
4. Maksimal 3 foto per laporan.
5. Identitas pelapor diambil dari akun dan tidak dapat diubah saat mengirim laporan.
6. Nomor WhatsApp dan email pelapor hanya terlihat oleh Admin, tidak pernah tampil di publik.
7. Nama pelapor **tampil** di halaman publik.
8. Satu laporan hanya milik satu warga; tidak ada laporan anonim.
9. Kode tiket dibuat otomatis dengan format `#RPT-YYYYMMDD-XXX` dan bersifat unik.
10. Menarik atau menghapus laporan tidak menghapus akun pelapor.
11. Password warga hanya dapat diubah melalui reset oleh Admin; warga tidak memiliki alur ganti password mandiri.

### 2.6 Non-Goals

Sistem ini **secara sengaja tidak** mencakup:

- Penanganan atau penjadwalan perbaikan jalan.
- Status "sedang diperbaiki" dan "selesai".
- Foto perbandingan sebelum/sesudah perbaikan.
- Peran Petugas Lapangan, work order, penugasan, vendor.
- Tingkat kerusakan (Ringan/Sedang/Berat) dan SLA.
- Kategori laporan selain jalan rusak (sampah, lampu jalan, banjir, dll).
- Master data wilayah (provinsi/kabupaten/kecamatan) — sistem hanya untuk satu desa.
- Modul edit profil desa (isi profil di-hardcode).
- Audit log sistem terpisah.
- Notifikasi WhatsApp atau email otomatis.
- Export laporan ke PDF/Excel.
- Multi-desa / multi-tenant.
- Aplikasi mobile native.
- Registrasi akun admin secara mandiri.

---

## 3. Kebutuhan Sistem AI

Tidak berlaku. Sistem ini tidak menggunakan model AI, rekomendasi otomatis, maupun deteksi gambar otomatis. Verifikasi laporan dilakukan sepenuhnya manual oleh Admin.

---

## 4. Spesifikasi Teknis

### 4.1 Arsitektur

Dua frontend terpisah yang berbagi satu API dan satu database.

```
┌─────────────────────┐        ┌─────────────────────┐
│  public-web         │        │  admin-web          │
│  React + Tailwind   │        │  React + Tailwind   │
│  (tanpa login,      │        │  (wajib login)      │
│   login opsional)   │        │                     │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           └──────────────┬───────────────┘
                          │ HTTPS / JSON
                 ┌────────▼────────┐
                 │  api (Express)  │
                 │  JWT HttpOnly   │
                 └────────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼───────┐
│  PostgreSQL  │  │  File uploads│  │  Static build │
│              │  │  (lokal)     │  │  (Nginx)      │
└──────────────┘  └──────────────┘  └───────────────┘
```

**Alasan pemisahan dua frontend:** bundle publik tetap ringan untuk pengguna mobile, kode dashboard tidak pernah terunduh oleh publik, dan permukaan serangan lebih sempit karena endpoint admin tidak diekspos di domain publik.

### 4.2 Stack Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Peta | Leaflet + OpenStreetMap (tanpa API key) |
| Data fetching | TanStack React Query |
| Form & validasi | React Hook Form + Zod |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Autentikasi | JWT pada HttpOnly cookie |
| Upload | Multer (penyimpanan lokal) |
| Editor berita | Rich text sederhana (bold, italic, list, link) |

### 4.3 Skema Database

```sql
-- ============ ENUM ============
CREATE TYPE admin_role     AS ENUM ('SUPER_ADMIN', 'ADMIN');
CREATE TYPE account_status AS ENUM ('AKTIF', 'NONAKTIF');
CREATE TYPE report_status  AS ENUM ('PENDING', 'DISETUJUI', 'DITOLAK', 'DITARIK');
CREATE TYPE damage_type    AS ENUM ('LUBANG', 'RETAK', 'AMBLAS',
                                    'BERGELOMBANG', 'MENGELUPAS', 'TERGENANG');
CREATE TYPE news_status    AS ENUM ('DRAFT', 'TERBIT');

-- ============ AKUN INTERNAL ============
CREATE TABLE admins (
    id            SERIAL PRIMARY KEY,
    nama          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          admin_role   NOT NULL DEFAULT 'ADMIN',
    status        account_status NOT NULL DEFAULT 'AKTIF',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============ AKUN WARGA ============
CREATE TABLE citizens (
    id            SERIAL PRIMARY KEY,
    nama          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    no_wa         VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status        account_status NOT NULL DEFAULT 'AKTIF',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============ LAPORAN ============
CREATE TABLE reports (
    id               SERIAL PRIMARY KEY,
    ticket_code      VARCHAR(25) UNIQUE NOT NULL,
    citizen_id       INT NOT NULL REFERENCES citizens(id) ON DELETE RESTRICT,
    alamat           TEXT NOT NULL,
    latitude         DECIMAL(10, 8) NOT NULL,
    longitude        DECIMAL(11, 8) NOT NULL,
    deskripsi        TEXT NOT NULL,
    status           report_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_by      INT REFERENCES admins(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT alasan_wajib_saat_ditolak
        CHECK (status <> 'DITOLAK' OR rejection_reason IS NOT NULL)
);

CREATE INDEX idx_reports_status  ON reports(status);
CREATE INDEX idx_reports_citizen ON reports(citizen_id);

-- ============ FOTO (maks 3 per laporan) ============
CREATE TABLE report_photos (
    id         SERIAL PRIMARY KEY,
    report_id  INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_path  VARCHAR(255) NOT NULL,
    urutan     SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT maksimal_tiga_foto CHECK (urutan BETWEEN 1 AND 3),
    UNIQUE (report_id, urutan)
);

-- ============ JENIS KERUSAKAN (multi-pilih) ============
CREATE TABLE report_damage_types (
    report_id   INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    damage_type damage_type NOT NULL,
    PRIMARY KEY (report_id, damage_type)
);

-- ============ RIWAYAT ============
CREATE TABLE report_logs (
    id            SERIAL PRIMARY KEY,
    report_id     INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    actor_id      INT REFERENCES admins(id) ON DELETE SET NULL,
    action        VARCHAR(30) NOT NULL,       -- EDIT | APPROVE | REJECT | RETRACT | DELETE
    from_status   report_status,
    to_status     report_status,
    changes       JSONB,                        -- {field: {old, new}}
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_logs_report ON report_logs(report_id);

-- ============ BERITA ============
CREATE TABLE news (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(200) UNIQUE NOT NULL,
    judul       VARCHAR(200) NOT NULL,
    isi         TEXT NOT NULL,
    cover_image VARCHAR(255),
    status      news_status NOT NULL DEFAULT 'DRAFT',
    author_id   INT REFERENCES admins(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_news_status ON news(status, published_at DESC);
```

**Catatan desain:**
- Tidak ada tabel `villages`, `village_profile`, `districts`, maupun master data lain — profil desa di-hardcode di frontend.
- `citizens` sengaja dipisah dari `admins` agar endpoint registrasi publik tidak pernah menyentuh tabel yang menyimpan akun admin.
- `report_photos` dibatasi 3 baris per laporan lewat constraint `urutan`, divalidasi juga di API.
- Nomor WA dan email pelapor tidak pernah dikirim ke endpoint publik.

### 4.4 API

**Publik (tanpa autentikasi)**

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/public/news` | Daftar berita `TERBIT` (paginasi) |
| GET | `/api/public/news/:slug` | Detail berita |
| GET | `/api/public/reports` | Daftar laporan `DISETUJUI` (filter jenis, cari kode, paginasi) |
| GET | `/api/public/reports/:ticketCode` | Detail laporan `DISETUJUI` |
| GET | `/api/public/map` | Titik peta (hanya koordinat, jenis, kode) |
| GET | `/api/public/stats` | Jumlah laporan terpublikasi |

**Autentikasi**

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/auth/register` | Registrasi warga |
| POST | `/api/auth/login` | Login warga |
| POST | `/api/auth/admin/login` | Login admin (cookie `admin_session`) |
| POST | `/api/auth/logout` | Hapus sesi |
| GET | `/api/auth/me` | Data sesi aktif |

**Warga (wajib login)**

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/reports/mine` | Laporan milik sendiri |
| POST | `/api/reports` | Buat laporan (multipart, maks 3 foto) |
| PUT | `/api/reports/:id` | Edit laporan sendiri, hanya saat `PENDING` |

**Admin (wajib login, role `ADMIN`)**

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/admin/reports` | Semua laporan + filter |
| GET | `/api/admin/reports/:id` | Detail + riwayat |
| PATCH | `/api/admin/reports/:id` | Edit laporan warga |
| POST | `/api/admin/reports/:id/approve` | Setujui |
| POST | `/api/admin/reports/:id/reject` | Tolak (body: `reason`) |
| POST | `/api/admin/reports/:id/retract` | Tarik dari publik |
| DELETE | `/api/admin/reports/:id` | Hapus permanen |
| GET/POST | `/api/admin/news` | Daftar / buat berita |
| PUT/DELETE | `/api/admin/news/:id` | Edit / hapus berita |
| GET | `/api/admin/citizens` | Daftar akun warga |
| PATCH | `/api/admin/citizens/:id/status` | Aktifkan / nonaktifkan |
| POST | `/api/admin/citizens/:id/reset-password` | Reset password warga |

**Super Admin**

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/super/admins` | Daftar akun admin |
| POST | `/api/super/admins` | Buat akun admin |
| PATCH | `/api/super/admins/:id/status` | Nonaktifkan / aktifkan |
| POST | `/api/super/admins/:id/reset-password` | Reset password admin |

Endpoint `GET` pada `/api/admin/reports`, `/api/admin/news`, dan `/api/admin/citizens` juga dapat diakses `SUPER_ADMIN`. Seluruh endpoint tulis di `/api/admin/*` menolak `SUPER_ADMIN` dengan `403`.

### 4.5 Autentikasi & Otorisasi

- Password di-hash dengan **Argon2id** (fallback: bcrypt cost 12).
- JWT berisi `sub`, `type` (`citizen` \| `admin`), dan `role` untuk admin. Masa berlaku 7 hari, dengan rotasi token setiap 24 jam.
- Cookie: `HttpOnly`, `Secure` (produksi), `SameSite=Lax`, `Path=/`.
- Dua cookie terpisah: `citizen_session` dan `admin_session`, agar sesi warga tidak pernah memberi akses ke dashboard meski ada bug.
- Middleware: `requireCitizen`, `requireAdmin`, `requireSuperAdmin`.
- Akun berstatus `NONAKTIF` langsung ditolak pada setiap permintaan, bukan hanya saat login.

### 4.6 Upload & Media

| Aspek | Ketentuan |
| --- | --- |
| Jumlah foto per laporan | 1–3 |
| Format diterima | JPG, PNG, WebP |
| Ukuran maksimum (setelah kompresi klien) | 5 MB per file |
| Kompresi klien | Target ±1 MB, sisi terpanjang maks 1920 px |
| Validasi server | Cek *magic bytes*, bukan ekstensi; tolak file non-gambar |
| Pemrosesan | Re-encode gambar untuk menghapus seluruh metadata EXIF (termasuk GPS) |
| Penamaan file | UUID acak, bukan nama asli pengguna |
| Lokasi | Direktori di luar *web root*, diakses lewat endpoint API |
| Gambar sampul berita | 1 file, maks 2 MB, wajib setelah kompresi |

### 4.7 Keamanan & Privasi

- **Rate limiting:** login 5 percobaan/menit per IP; registrasi 3/jam per IP; kirim laporan 10/hari per akun; endpoint publik 100 permintaan/menit per IP.
- **Validasi input** di klien dan server menggunakan Zod; server tidak pernah memercayai data klien.
- **Otorisasi kepemilikan:** `PUT /api/reports/:id` memeriksa `citizen_id` cocok dengan sesi.
- **Pencegahan XSS:** isi berita (rich text) disanitasi di server sebelum disimpan.
- **CORS:** hanya domain `public-web` dan `admin-web` yang diizinkan, dengan `credentials: true`.
- **PII:** `no_wa` dan `email` warga tidak pernah disertakan pada respons endpoint publik.
- **Data lokasi:** koordinat yang ditampilkan adalah titik jalan, bukan lokasi perangkat pelapor. Koordinat tidak disamarkan karena memang tujuan sistem.
- **Retensi data:** laporan dan akun disimpan tanpa batas waktu; akun warga tidak dapat dihapus Admin untuk menjaga integritas riwayat.
- **Backup:** tanggung jawab operator; disarankan dump database harian dan salinan direktori foto.

### 4.8 Struktur Repo (usulan, belum final)

```
potholes-report/
├─ apps/
│  ├─ public-web/     # React + Vite + Tailwind
│  ├─ admin-web/      # React + Vite + Tailwind + shadcn/ui
│  └─ api/            # Express + Prisma
├─ packages/
│  └─ shared/         # tipe, enum, skema Zod, klien API
└─ pnpm-workspace.yaml
```

### 4.9 Rincian Form Laporan

| # | Field | Tipe | Wajib | Validasi |
| --- | --- | --- | --- | --- |
| 1 | Foto kerusakan | Upload 1–3 file | Ya | JPG/PNG/WebP, maks 5 MB/file |
| 2 | Alamat lengkap | Textarea | Ya | 10–500 karakter |
| 3 | Titik lokasi | Peta Leaflet, pin dapat digeser | Ya | Latitude −90..90, longitude −180..180 |
| 4 | Jenis kerusakan | Multi-pilih | Ya | Minimal 1 dari 6 opsi |
| 5 | Deskripsi | Textarea | Ya | Minimal 30 karakter |
| 6 | Identitas | Read-only dari akun | — | — |

**Alur form (4 langkah):** Foto → Lokasi → Detail kerusakan → Ringkasan & kirim.

**UX:** mobile-first; target sentuh minimal 44 px; tombol "Gunakan lokasi saya" sebagai bantuan (bukan pengganti pin manual); draft tersimpan di `localStorage`; indikator progres langkah; pesan galat ditampilkan per field dalam Bahasa Indonesia.

### 4.10 Standar Kualitas

- **Aksesibilitas:** kontras WCAG AA, seluruh input memiliki label, gambar memiliki teks alternatif, form dapat dioperasikan dengan keyboard.
- **Performa:** LCP halaman publik < 2,5 detik pada simulasi 3G; peta memuat penanda secara bertahap (maks 500 titik per permintaan).
- **Kompatibilitas:** 2 versi terakhir Chrome, Safari, Firefox, dan Edge; prioritas tampilan layar 360 px ke atas.
- **Bahasa:** seluruh antarmuka dalam Bahasa Indonesia.

---

## 5. Risiko & Roadmap

### 5.1 Rencana Bertahap

**MVP**
- Registrasi & login warga, login admin
- Form laporan (foto, alamat, pin peta, jenis kerusakan, deskripsi)
- Verifikasi Admin: setujui, tolak, edit, tarik, hapus
- Peta & daftar laporan publik
- Halaman "Laporan Saya"
- Berita desa (CRUD + terbit)
- Profil desa statis
- Kelola akun warga & akun admin

**v1.1**
- Notifikasi WhatsApp otomatis saat status laporan berubah
- Deteksi laporan duplikat (jarak < 20 m dengan jenis sama)
- Ekspor data laporan ke CSV
- Statistik sederhana per jenis kerusakan

**v2.0**
- Dukungan multi-desa
- Dashboard analitik tren kerusakan
- Komentar/tanggapan warga pada laporan
- API publik untuk integrasi pihak ketiga

### 5.2 Risiko Teknis & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Laporan palsu atau foto tidak relevan | Data publik tidak akurat | Verifikasi manual Admin sebelum publikasi |
| Laporan duplikat untuk jalan yang sama | Peta penuh titik ganda | Admin menolak dengan alasan "duplikat"; deteksi otomatis di v1.1 |
| Titik lama tidak relevan (jalan sudah diperbaiki) | Peta menyesatkan | Fitur "Tarik laporan" oleh Admin |
| Geolocation gagal di perangkat desktop | Warga tidak bisa menentukan lokasi | Pin manual di peta sebagai jalur utama |
| Foto hilang karena penyimpanan lokal rusak | Bukti laporan hilang permanen | Backup direktori upload terjadwal |
| Registrasi spam | Basis data akun kotor | Rate limit per IP + nonaktifkan akun |
| Reset password manual membebani Admin | Warga menunggu lama | Didokumentasikan sebagai prosedur operasional; kandidat otomatisasi di v1.1 |
| Hosting belum ditentukan | Infrastruktur tidak dapat disiapkan | Ditunda; rekomendasi VPS tunggal dengan Nginx |
| Isi profil desa hardcode | Perubahan konten butuh deploy ulang | Diterima sebagai trade-off; dapat dipindah ke CMS di v2.0 |

### 5.3 Asumsi

1. Sistem melayani **satu desa**; tidak ada kebutuhan multi-tenant.
2. Sebagian besar warga mengakses dari ponsel.
3. Admin tersedia untuk memverifikasi laporan secara berkala (manual).
4. Kualitas foto dari ponsel warga cukup untuk menilai kerusakan.
5. Tidak ada integrasi dengan sistem pemerintahan lain.

### 5.4 Hal yang Belum Diputuskan

| Item | Status |
| --- | --- |
| Nama dan identitas desa | Menyusul |
| Isi konten profil desa | Menyusul |
| Platform hosting & domain produksi | Menyusul |
| Struktur repo final (monorepo vs terpisah) | Usulan monorepo, belum disetujui |
| Desain visual / identitas merek | Belum dibahas |
