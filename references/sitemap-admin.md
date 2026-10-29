# Sitemap — Dashboard Admin

Sistem Pelaporan Jalan Rusak Desa

| Item | Keterangan |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 28 Oktober 2026 |
| Cakupan | Dashboard admin (`admin-web`) |
| Rujukan | `prd.md` v1.0, `sitemap-public.md` |

---

## 1. Ringkasan

Dashboard admin terdiri dari **12 rute** untuk mengelola laporan, berita, akun warga, dan akun admin.

| Modul | Rute | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- |
| Autentikasi | `/login` | ✅ | ✅ |
| Laporan | `/laporan`, `/laporan/:id`, `/laporan/:id/edit` | ✅ penuh | 👁 baca saja |
| Berita | `/berita`, `/berita/baru`, `/berita/:id/edit` | ✅ penuh | 👁 baca saja |
| Akun Warga | `/akun-warga`, `/akun-warga/:id` | ✅ penuh | 👁 baca saja |
| Akun Admin | `/akun-admin`, `/akun-admin/baru` | ❌ 403 | ✅ penuh |
| Galat | `/403`, `*` | ✅ | ✅ |

Tidak ada halaman dashboard ringkasan (statistik) — sesuai PRD, halaman pertama setelah login adalah **antrean laporan**.

---

## 2. Pohon Situs

```
/login                            Login admin
/
└── (redirect) ──► /laporan
│
├── /laporan                      Antrean & daftar laporan
│   ├── /laporan/:id              Detail + aksi verifikasi
│   └── /laporan/:id/edit         Edit laporan warga            [ADMIN]
│
├── /berita                       Daftar berita
│   ├── /berita/baru              Tulis berita                  [ADMIN]
│   └── /berita/:id/edit          Edit berita                   [ADMIN]
│
├── /akun-warga                   Daftar akun warga
│   └── /akun-warga/:id           Detail warga + laporannya     [ADMIN aksi]
│
├── /akun-admin                   Daftar akun admin             [SUPER_ADMIN]
│   └── /akun-admin/baru          Buat akun admin               [SUPER_ADMIN]
│
├── /403                          Akses ditolak
└── *                             Halaman 404
```

**Catatan urutan routing:** `/berita/baru` harus didaftarkan sebelum `/berita/:id/edit`, dan `/akun-admin/baru` sebelum `/akun-admin/:id`. Segmen statis selalu didahulukan.

---

## 3. Layout & Navigasi

### 3.1 Struktur Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Topbar: [☰] Logo  │ Nama Admin · Badge Role │  [Keluar]     │
├──────────────┬───────────────────────────────────────────────┤
│  Sidebar     │                                               │
│              │              Area Konten                      │
│  · Laporan   │                                               │
│  · Berita    │                                               │
│  · Akun      │                                               │
│    Warga     │                                               │
│  · Akun      │                                               │
│    Admin*    │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
   * hanya tampil untuk SUPER_ADMIN
```

Layout dua kolom. Pada layar < 1024 px, sidebar berubah menjadi panel geser yang dikendalikan tombol hamburger di topbar.

### 3.2 Sidebar

| Item | Rute | Ikon | Tampil untuk |
| --- | --- | --- | --- |
| Laporan | `/laporan` | dokumen | ADMIN, SUPER_ADMIN |
| Berita | `/berita` | koran | ADMIN, SUPER_ADMIN |
| Akun Warga | `/akun-warga` | pengguna | ADMIN, SUPER_ADMIN |
| Akun Admin | `/akun-admin` | perisai | **SUPER_ADMIN saja** |

Item aktif ditandai warna dan latar berbeda. Sidebar juga menampilkan badge jumlah laporan `PENDING` di samping item Laporan (diperbarui setiap 60 detik).

### 3.3 Topbar

| Elemen | Keterangan |
| --- | --- |
| Tombol hamburger | Hanya < 1024 px |
| Logo + nama sistem | Klik → `/laporan` |
| Nama admin | Dari sesi |
| Badge role | `Admin` atau `Super Admin` |
| Tombol **Keluar** | Logout → `/login` |

### 3.4 Banner Mode Baca Saja

Muncul di seluruh halaman modul operasional saat yang login adalah `SUPER_ADMIN`:

> **Mode baca saja.** Akun Super Admin hanya dapat melihat data. Untuk mengubah laporan, berita, atau akun warga, gunakan akun Admin.

Banner bersifat sticky di bawah topbar, tidak dapat ditutup.

### 3.5 Penyesuaian Tampilan per Role

| Elemen | ADMIN | SUPER_ADMIN |
| --- | --- | --- |
| Tombol Setujui / Tolak | Tampil | Disembunyikan |
| Tombol Edit / Tarik / Hapus laporan | Tampil | Disembunyikan |
| Tombol Tulis Berita / Edit / Hapus | Tampil | Disembunyikan |
| Tombol Nonaktifkan / Reset password warga | Tampil | Disembunyikan |
| Menu Akun Admin | Tersembunyi | Tampil |
| Banner mode baca saja | Tidak | Ya |

Tombol yang disembunyikan tetap ditolak di sisi API dengan `403` — UI bukan satu-satunya pengaman.

---

## 4. Detail Halaman

---

### 4.1 `/login` — Login Admin

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Masuk — Dashboard Admin` |
| Tujuan | Autentikasi admin dan super admin |

**Konten**

- Logo + nama sistem
- Field: email, password (dengan tombol tampilkan/sembunyikan)
- Checkbox "Ingat saya"
- Tombol "Masuk"
- Kotak bantuan: "Lupa password? Hubungi Super Admin untuk reset password."

**Tidak ada tautan** "lupa password" maupun "daftar" — akun admin hanya dibuat oleh Super Admin.

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Sudah login | Redirect `/laporan` |
| Email/password salah | "Email atau password salah" (tanpa membedakan) |
| 5 percobaan gagal | "Terlalu banyak percobaan. Coba lagi dalam 15 menit." |
| Akun `NONAKTIF` | "Akun Anda dinonaktifkan. Hubungi Super Admin." |
| Login sukses sebagai ADMIN | → `/laporan` |
| Login sukses sebagai SUPER_ADMIN | → `/laporan` (mode baca saja) |

---

### 4.2 `/` — Redirect

| Atribut | Nilai |
| --- | --- |
| Akses | Wajib login |
| Perilaku | Redirect permanen ke `/laporan` |

Tidak ada halaman beranda dashboard. Ini keputusan sadar: tugas utama admin adalah memproses antrean laporan.

---

### 4.3 `/laporan` — Antrean & Daftar Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | ADMIN (penuh), SUPER_ADMIN (baca saja) |
| Judul dokumen | `Laporan — Dashboard Admin` |
| Tujuan | Memverifikasi laporan masuk dan mengelola laporan yang sudah tayang |

**Konten**

1. **Kartu statistik** (4 kartu): Menunggu · Dipublikasikan · Ditolak · Ditarik — masing-masing menampilkan jumlah dan berfungsi sebagai filter cepat
2. **Bilah filter**
   - Tab status: Semua / Menunggu / Dipublikasikan / Ditolak / Ditarik (default: **Menunggu**)
   - Pencarian: kode tiket, nama pelapor, atau alamat
   - Filter jenis kerusakan (multi-pilih)
   - Filter rentang tanggal lapor
   - Tombol "Reset filter"
3. **Tabel laporan**

| Kolom | Isi |
| --- | --- |
| Foto | Thumbnail foto pertama |
| Kode Tiket | `#RPT-YYYYMMDD-XXX` |
| Pelapor | Nama warga |
| Alamat | Dipotong 1 baris |
| Jenis | Chip jenis kerusakan |
| Tanggal | Tanggal lapor |
| Status | Badge status |
| Aksi | Tombol "Detail" + aksi cepat |

4. **Paginasi** — 20 baris per halaman, pilihan 20/50/100
5. **Urutan** — default: terlama di atas pada tab Menunggu (FIFO), terbaru di atas pada tab lain

**Aksi cepat pada tabel** (hanya ADMIN)

| Status laporan | Aksi cepat |
| --- | --- |
| `PENDING` | Setujui · Tolak · Detail |
| `DISETUJUI` | Tarik · Detail |
| `DITOLAK` | Detail |
| `DITARIK` | Detail |

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Tidak ada laporan sama sekali | Empty state: "Belum ada laporan masuk." |
| Filter tidak menghasilkan | "Tidak ada laporan yang cocok." + tombol reset |
| Gagal memuat | Panel galat + tombol "Coba lagi" |
| SUPER_ADMIN | Seluruh kolom Aksi berisi hanya "Detail" |

---

### 4.4 `/laporan/:id` — Detail Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | ADMIN (penuh), SUPER_ADMIN (baca saja) |
| Judul dokumen | `Laporan {kodeTiket} — Dashboard Admin` |
| Tujuan | Meninjau isi laporan dan mengambil keputusan |

**Konten**

**Kolom kiri — isi laporan**

- Galeri foto (1–3 foto, klik untuk layar penuh)
- Peta mini dengan penanda lokasi
- Alamat lengkap
- Jenis kerusakan (chip)
- Deskripsi
- Kode tiket, tanggal lapor, tanggal diperbarui
- Badge status

**Kolom kanan — panel tindakan**

- **Data pelapor**: nama, email, nomor WhatsApp (tautan `wa.me`), tanggal daftar, tautan ke `/akun-warga/:id`
- **Riwayat** (`report_logs`): waktu, aktor, aksi, status sebelum → sesudah, catatan, daftar field yang diubah
- **Tombol aksi** (kondisional, hanya ADMIN)

| Status | Tombol tersedia |
| --- | --- |
| `PENDING` | **Setujui** · **Tolak** · **Edit** · **Hapus permanen** |
| `DISETUJUI` | **Tarik** · **Edit** · **Hapus permanen** |
| `DITOLAK` | **Setujui ulang** · **Edit** · **Hapus permanen** |
| `DITARIK` | **Publikasikan ulang** · **Edit** · **Hapus permanen** |

**Dialog & konfirmasi**

- **Setujui** → dialog konfirmasi singkat: "Laporan akan tampil di website publik."
- **Tolak** → dialog dengan textarea alasan (wajib, min. 10 karakter) + pilihan alasan cepat: "Foto tidak jelas", "Bukan jalan rusak", "Duplikat", "Lokasi tidak valid"
- **Tarik** → dialog dengan catatan opsional (internal saja)
- **Hapus permanen** → dialog konfirmasi yang menyebutkan foto ikut terhapus dan data tidak dapat dikembalikan; wajib mengetik `HAPUS` untuk mengaktifkan tombol

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| ID tidak ada | 404 — "Laporan tidak ditemukan" |
| Laporan sudah berubah status oleh sesi lain | Muat ulang otomatis + toast "Status laporan telah diperbarui" |
| Gagal memuat foto | Placeholder + tombol "Muat ulang" |

---

### 4.5 `/laporan/:id/edit` — Edit Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | **ADMIN saja** (SUPER_ADMIN → 403) |
| Judul dokumen | `Edit Laporan {kodeTiket} — Dashboard Admin` |
| Tujuan | Memperbaiki data laporan warga |

**Konten**

- Kode tiket, status, dan pelapor tampil read-only di atas
- Field yang dapat diubah:
  - Foto (tambah/hapus, maks 3)
  - Alamat lengkap
  - Titik koordinat (pin peta)
  - Jenis kerusakan (multi-pilih)
  - Deskripsi
- Catatan perubahan internal (opsional, masuk ke `report_logs`)
- Tombol **Simpan Perubahan** dan **Batal**

**Perilaku**

- Setiap simpan mencatat field yang berubah ke `report_logs` (`changes` dalam bentuk `{field: {old, new}}`)
- Jika tidak ada perubahan, tombol simpan nonaktif
- Membatalkan perubahan menampilkan konfirmasi bila form sudah diubah

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| SUPER_ADMIN mengakses | 403 |
| ID tidak ada | 404 |

---

### 4.6 `/berita` — Daftar Berita

| Atribut | Nilai |
| --- | --- |
| Akses | ADMIN (penuh), SUPER_ADMIN (baca saja) |
| Judul dokumen | `Berita — Dashboard Admin` |
| Tujuan | Mengelola berita desa |

**Konten**

- Tombol **+ Tulis Berita** (hanya ADMIN) → `/berita/baru`
- Tab filter: Semua / Draf / Terbit
- Pencarian judul
- Tabel berita

| Kolom | Isi |
| --- | --- |
| Sampul | Thumbnail |
| Judul | — |
| Slug | Teks kecil |
| Status | Badge `Draf` / `Terbit` |
| Penulis | Nama admin |
| Tanggal | Dibuat / diterbitkan |
| Aksi | Lihat · Edit · Hapus |

- Paginasi 20 baris per halaman

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Belum ada berita | Empty state + tombol "Tulis Berita Pertama" |
| SUPER_ADMIN | Tombol tambah, edit, hapus disembunyikan; aksi tersisa "Lihat" (pratinjau) |

---

### 4.7 `/berita/baru` — Tulis Berita

| Atribut | Nilai |
| --- | --- |
| Akses | **ADMIN saja** |
| Judul dokumen | `Tulis Berita — Dashboard Admin` |
| Tujuan | Membuat berita baru |

**Konten**

| Field | Tipe | Wajib |
| --- | --- | --- |
| Judul | Teks, maks 200 karakter | ✅ |
| Slug | Teks, dibuat otomatis dari judul, dapat diedit | ✅ |
| Isi | Rich text (tebal, miring, daftar, tautan, kutipan) | ✅ |
| Gambar sampul | Upload 1 file, maks 2 MB | ❌ |
| Status | Pilihan: Simpan sebagai Draf / Terbitkan | ✅ |

**Aksi**

- **Simpan Draf** — menyimpan tanpa menerbitkan
- **Terbitkan** — menyimpan dan mengisi `published_at`
- **Pratinjau** — membuka tampilan seperti di website publik (modal)
- **Batal** → kembali ke `/berita` dengan konfirmasi bila ada perubahan

**Perilaku**

- Slug diperiksa keunikan secara langsung (debounce 500 ms); bila bentrok, tambahkan sufiks angka otomatis
- Editor mempertahankan format saat menempel dari aplikasi lain (sanitasi dilakukan di server)

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| SUPER_ADMIN mengakses | 403 |
| Judul kosong saat terbitkan | Validasi per field |
| Upload sampul gagal | Pesan galat + tombol coba lagi |

---

### 4.8 `/berita/:id/edit` — Edit Berita

| Atribut | Nilai |
| --- | --- |
| Akses | **ADMIN saja** |
| Judul dokumen | `Edit Berita — Dashboard Admin` |
| Tujuan | Memperbarui berita yang sudah ada |

**Konten**

- Form identik dengan `/berita/baru`, terisi data sebelumnya
- Informasi tambahan: pembuat, tanggal dibuat, tanggal terbit terakhir
- Tombol aksi:
  - **Simpan Perubahan**
  - **Terbitkan** / **Tarik ke Draf** (bergantung status saat ini)
  - **Hapus Berita** — dialog konfirmasi
  - **Lihat di Website** — membuka `/berita/:slug` di tab baru

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| ID tidak ada | 404 |
| SUPER_ADMIN mengakses | 403 |
| Berita sedang diedit pengguna lain | Peringatan saat menyimpan + opsi muat ulang |

---

### 4.9 `/akun-warga` — Daftar Akun Warga

| Atribut | Nilai |
| --- | --- |
| Akses | ADMIN (penuh), SUPER_ADMIN (baca saja) |
| Judul dokumen | `Akun Warga — Dashboard Admin` |
| Tujuan | Memantau dan mengelola akun warga |

**Konten**

- Pencarian: nama, email, atau nomor WhatsApp
- Filter status: Semua / Aktif / Nonaktif
- Tabel warga

| Kolom | Isi |
| --- | --- |
| Nama | — |
| Email | — |
| No. WhatsApp | — |
| Tanggal Daftar | — |
| Jumlah Laporan | Angka, tautan ke daftar laporan warga tersebut |
| Status | Badge `Aktif` / `Nonaktif` |
| Aksi | Detail · Nonaktifkan/Aktifkan · Reset Password |

- Paginasi 20 baris per halaman
- Ringkasan di atas tabel: total warga, total aktif, total nonaktif

**Aksi**

- **Nonaktifkan** → dialog konfirmasi: "Warga tidak akan bisa login, namun laporannya tetap tampil."
- **Aktifkan** → langsung, dengan toast
- **Reset Password** → dialog konfirmasi, lalu menampilkan password sementara **satu kali** dengan tombol "Salin"

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Tidak ada warga | "Belum ada warga yang mendaftar." |
| Reset password berhasil | Modal berisi password sementara + peringatan "Password hanya ditampilkan sekali." |
| SUPER_ADMIN | Tombol aksi disembunyikan |

---

### 4.10 `/akun-warga/:id` — Detail Warga

| Atribut | Nilai |
| --- | --- |
| Akses | ADMIN (penuh), SUPER_ADMIN (baca saja) |
| Judul dokumen | `{Nama Warga} — Dashboard Admin` |
| Tujuan | Melihat profil warga beserta riwayat laporannya |

**Konten**

- Kartu profil: nama, email, nomor WhatsApp, tanggal daftar, status akun
- Statistik laporan warga tersebut: total, menunggu, dipublikasikan, ditolak, ditarik
- Daftar laporan milik warga (kartu ringkas, klik menuju `/laporan/:id`)
- Tombol aksi: Nonaktifkan/Aktifkan · Reset Password
- Tombol "Kembali" → `/akun-warga`

**Catatan:** tidak ada tombol hapus akun. Akun warga tidak dapat dihapus demi integritas riwayat laporan.

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| ID tidak ada | 404 |
| Warga belum punya laporan | "Warga ini belum pernah mengirim laporan." |

---

### 4.11 `/akun-admin` — Daftar Akun Admin

| Atribut | Nilai |
| --- | --- |
| Akses | **SUPER_ADMIN saja** |
| Judul dokumen | `Akun Admin — Dashboard Admin` |
| Tujuan | Mengelola akun admin |

**Konten**

- Tombol **+ Buat Admin** → `/akun-admin/baru`
- Pencarian nama/email
- Filter role: Semua / Admin / Super Admin
- Tabel admin

| Kolom | Isi |
| --- | --- |
| Nama | — |
| Email | — |
| Role | Badge `Admin` / `Super Admin` |
| Status | Badge `Aktif` / `Nonaktif` |
| Dibuat | Tanggal |
| Aksi | Nonaktifkan/Aktifkan · Reset Password |

**Aksi**

- **Nonaktifkan** → konfirmasi; sesi aktif admin tersebut langsung dibatalkan
- **Reset Password** → password sementara ditampilkan sekali

**Batasan**

- Super Admin **tidak dapat menonaktifkan akunnya sendiri** — tombol dinonaktifkan dengan tooltip penjelas
- Tidak ada tombol hapus akun admin

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| ADMIN mengakses | 403 |
| Hanya satu Super Admin aktif | Tombol nonaktifkan pada akun tersebut dinonaktifkan |

---

### 4.12 `/akun-admin/baru` — Buat Akun Admin

| Atribut | Nilai |
| --- | --- |
| Akses | **SUPER_ADMIN saja** |
| Judul dokumen | `Buat Akun Admin — Dashboard Admin` |
| Tujuan | Menambah akun admin baru |

**Konten**

| Field | Tipe | Wajib | Validasi |
| --- | --- | --- | --- |
| Nama lengkap | Teks | ✅ | 3–100 karakter |
| Email | Email | ✅ | Format valid, unik di tabel `admins` |
| Password awal | Password | ✅ | Min. 8 karakter, indikator kekuatan |
| Konfirmasi password | Password | ✅ | Harus sama |
| Role | Pilihan: Admin / Super Admin | ✅ | Default: Admin |

**Aksi**

- **Simpan** → akun langsung aktif, kembali ke `/akun-admin` dengan toast
- **Batal** → `/akun-admin`

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Email sudah dipakai | "Email sudah digunakan" |
| ADMIN mengakses | 403 |

---

### 4.13 `/403` — Akses Ditolak

| Atribut | Nilai |
| --- | --- |
| Akses | Wajib login |
| Judul dokumen | `Akses Ditolak — Dashboard Admin` |

**Konten**

- Ilustrasi
- "Anda tidak memiliki izin untuk membuka halaman ini."
- Keterangan tambahan bila penyebabnya role: "Halaman ini hanya dapat diakses oleh Super Admin."
- Tombol "Kembali ke Laporan" → `/laporan`

---

### 4.14 `*` — Halaman 404

| Atribut | Nilai |
| --- | --- |
| Akses | Wajib login |
| Judul dokumen | `Halaman Tidak Ditemukan — Dashboard Admin` |

**Konten**

- Ilustrasi
- "Halaman tidak ditemukan."
- Tombol "Kembali ke Laporan" → `/laporan`

---

## 5. Alur Kerja Utama

### 5.1 Verifikasi Laporan

```
/login
   │
   ▼
/laporan  (tab "Menunggu", FIFO)
   │
   ├── klik "Detail"
   ▼
/laporan/:id
   │
   ├── Setujui ──► status DISETUJUI ──► tampil di website publik
   │                (toast + riwayat bertambah)
   │
   ├── Tolak ────► isi alasan (wajib)
   │                └─► status DITOLAK ──► alasan tampil di "Laporan Saya" warga
   │
   └── Edit ─────► /laporan/:id/edit ──► simpan (tercatat di riwayat)
```

### 5.2 Penarikan Laporan

```
/laporan  (tab "Dipublikasikan")
   │
   ▼
/laporan/:id  ──► Tarik ──► status DITARIK
                            └─► hilang dari peta & daftar publik
                                (data tetap tersimpan, dapat dipublikasikan ulang)
```

### 5.3 Pengelolaan Berita

```
/berita ──► + Tulis Berita ──► /berita/baru
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Simpan Draf      Terbitkan       Pratinjau
              (status DRAFT)  (status TERBIT)  (modal)
                    │               │
                    └───────┬───────┘
                            ▼
                    /berita (daftar)
```

### 5.4 Reset Password Warga

```
/akun-warga ──► Reset Password ──► konfirmasi
                                        │
                                        ▼
                        password sementara tampil SEKALI
                        + tombol "Salin"
                                        │
                                        ▼
                        sesi aktif warga tersebut dibatalkan
```

---

## 6. Aturan Redirect & Guard

| Rute | Guard | Perilaku bila gagal |
| --- | --- | --- |
| `/login` | Belum login | Sudah login → `/laporan` |
| `/` | Wajib login | → `/login?redirect=/` |
| `/laporan`, `/laporan/:id` | Wajib login | → `/login?redirect=...` |
| `/laporan/:id/edit` | Wajib login + role `ADMIN` | SUPER_ADMIN → `/403` |
| `/berita`, `/berita/:id/edit` | Wajib login | → `/login?redirect=...` |
| `/berita/baru` | Wajib login + role `ADMIN` | SUPER_ADMIN → `/403` |
| `/akun-warga`, `/akun-warga/:id` | Wajib login | → `/login?redirect=...` |
| `/akun-admin`, `/akun-admin/baru` | Wajib login + role `SUPER_ADMIN` | ADMIN → `/403` |

**Setelah login berhasil:** arahkan ke `redirect` bila ada dan merupakan path internal sah; selain itu ke `/laporan`.

**Setelah logout:** hapus sesi, arahkan ke `/login`.

**Sesi berakhir (401):** arahkan ke `/login?redirect=<halaman saat ini>` dan tampilkan toast "Sesi Anda telah berakhir."

---

## 7. Matriks Akses Halaman

| Rute | Belum login | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- |
| `/login` | ✅ | → `/laporan` | → `/laporan` |
| `/` | → login | → `/laporan` | → `/laporan` |
| `/laporan` | → login | ✅ penuh | 👁 baca saja |
| `/laporan/:id` | → login | ✅ penuh | 👁 baca saja |
| `/laporan/:id/edit` | → login | ✅ | 🚫 403 |
| `/berita` | → login | ✅ penuh | 👁 baca saja |
| `/berita/baru` | → login | ✅ | 🚫 403 |
| `/berita/:id/edit` | → login | ✅ | 🚫 403 |
| `/akun-warga` | → login | ✅ penuh | 👁 baca saja |
| `/akun-warga/:id` | → login | ✅ penuh | 👁 baca saja |
| `/akun-admin` | → login | 🚫 403 | ✅ penuh |
| `/akun-admin/baru` | → login | 🚫 403 | ✅ |
| `/403` | → login | ✅ | ✅ |
| `*` | → login | ✅ | ✅ |

---

## 8. Komponen Bersama

| Komponen | Dipakai di | Keterangan |
| --- | --- | --- |
| `AdminLayout` | Semua halaman login | Sidebar + topbar + area konten |
| `Sidebar` | `AdminLayout` | Menu adaptif per role |
| `Topbar` | `AdminLayout` | Identitas + logout |
| `ReadOnlyBanner` | Halaman operasional | Muncul untuk SUPER_ADMIN |
| `StatCard` | `/laporan`, `/akun-warga/:id` | Kartu angka + filter |
| `DataTable` | Semua daftar | Sortir, paginasi, kolom kondisional |
| `StatusBadge` | Laporan, berita, akun | 3 varian badge |
| `ReportDetailPanel` | `/laporan/:id` | Isi laporan + peta mini |
| `CitizenPanel` | `/laporan/:id` | Data pelapor + tautan WA |
| `ReportTimeline` | `/laporan/:id` | Riwayat `report_logs` |
| `ActionDialog` | Semua aksi | Konfirmasi / form alasan |
| `ConfirmDestructive` | Hapus laporan/berita | Wajib ketik kata konfirmasi |
| `TempPasswordDialog` | Reset password | Tampil sekali + salin |
| `RichTextEditor` | Berita | Bold, italic, list, link, kutipan |
| `PhotoGallery` | `/laporan/:id` | 1–3 foto, layar penuh |
| `PhotoUploader` | Form laporan, berita | Kompres otomatis di klien |
| `MapPicker` | Form laporan | Pin dapat digeser |
| `EmptyState` | Semua daftar | Ilustrasi + pesan |
| `ErrorState` | Semua halaman | Pesan + tombol coba lagi |
| `Toast` | Semua aksi | Notifikasi hasil aksi |

---

## 9. State & Kondisi Standar

Berlaku untuk semua halaman yang memuat data.

| State | Tampilan |
| --- | --- |
| **Memuat pertama kali** | Skeleton sesuai bentuk konten (tabel/kartu) |
| **Memuat ulang** | Indikator kecil di sudut, konten lama tetap tampil |
| **Kosong** | Ilustrasi + pesan + tombol aksi utama bila relevan |
| **Galat jaringan** | Panel galat + tombol "Coba lagi" |
| **Galat izin (403)** | Halaman `/403` |
| **Data tidak ditemukan (404)** | Halaman 404 dengan tombol kembali |
| **Sesi berakhir (401)** | Redirect ke `/login` + toast |
| **Aksi berhasil** | Toast hijau, data diperbarui tanpa muat ulang penuh |
| **Aksi gagal** | Toast merah + pesan spesifik dari API |

---

## 10. Responsif & Aksesibilitas

**Breakpoint**

| Nama | Lebar | Perilaku |
| --- | --- | --- |
| Mobile | < 768 px | Sidebar jadi panel geser, tabel berubah kartu bertumpuk, aksi dalam menu titik-tiga |
| Tablet | 768–1023 px | Sidebar ikon saja, tabel dapat digeser horizontal |
| Desktop | ≥ 1024 px | Sidebar penuh, tabel lengkap, panel detail dua kolom |

**Aksesibilitas**

- Navigasi sidebar dapat dioperasikan dengan keyboard
- Perubahan status diumumkan lewat `aria-live`
- Dialog memiliki fokus terkunci dan dapat ditutup dengan `Esc`
- Kontras memenuhi WCAG AA
- Seluruh tombol aksi memiliki label teks atau `aria-label`

---

## 11. Catatan Teknis Routing

1. `/berita/baru` didaftarkan sebelum `/berita/:id/edit`; `/akun-admin/baru` sebelum `/akun-admin/:id`.
2. `/` tidak memiliki halaman — langsung redirect ke `/laporan`.
3. `:id` pada `/laporan/:id` dan `/berita/:id/edit` adalah ID numerik internal, bukan kode tiket.
4. Parameter `redirect` hanya menerima path internal (diawali `/`), mencegah open redirect.
5. Badge jumlah `PENDING` di sidebar diperbarui tiap 60 detik dan setelah setiap aksi verifikasi.
6. Setiap perpindahan halaman menggulir ke atas dan memperbarui `document.title`.
7. Tombol aksi yang tidak berhak disembunyikan di UI **dan** ditolak di API.

---

## 12. Rute yang Sengaja Tidak Ada

| Rute | Alasan |
| --- | --- |
| `/` (dashboard statistik) | Tidak ada di PRD; tugas utama admin adalah antrean laporan |
| `/pengaturan`, `/akun-saya` | Belum didefinisikan — lihat bagian 13 |
| `/lupa-password`, `/reset-password` | Reset password dilakukan Super Admin dari `/akun-admin` |
| `/daftar` | Akun admin hanya dibuat Super Admin |
| `/profil-desa` | Profil desa di-hardcode di frontend publik |
| `/master-data` | Master data tidak ada — jenis kerusakan berupa enum |
| `/audit-log` | Di luar cakupan MVP; riwayat perubahan ada di detail laporan |
| `/export` | Ekspor laporan dijadwalkan untuk v1.1 |
| `/hapus-akun-warga` | Akun warga tidak dapat dihapus |

---

## 13. Hal yang Belum Didefinisikan

| Item | Keterangan |
| --- | --- |
| **Ganti password sendiri untuk Admin** | PRD belum mengatur apakah Admin dapat mengganti password-nya sendiri. Sementara: hanya Super Admin yang dapat mereset. Jika diinginkan, perlu rute `/pengaturan` baru. |
| **Notifikasi laporan baru** | Belum ada mekanisme pemberitahuan di luar badge sidebar. |
| **Bulk action** | Menyetujui/menolak banyak laporan sekaligus belum direncanakan. |
| **Ekspor** | Dijadwalkan v1.1. |
| **Log aktivitas admin lintas modul** | Di luar cakupan MVP. |
