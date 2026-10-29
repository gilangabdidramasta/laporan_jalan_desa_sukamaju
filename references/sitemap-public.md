# Sitemap — Website Publik

Sistem Pelaporan Jalan Rusak Desa

| Item | Keterangan |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 28 Oktober 2026 |
| Cakupan | Website publik (`public-web`) saja |
| Rujukan | `prd.md` v1.0 |

---

## 1. Ringkasan

Website publik terdiri dari **10 rute** yang terbagi menjadi tiga kelompok:

| Kelompok | Jumlah rute | Wajib login |
| --- | --- | --- |
| Halaman informasi | 4 | Tidak |
| Halaman laporan | 4 | 2 dari 4 |
| Halaman autentikasi | 2 | Tidak |

Pengunjung tanpa akun dapat membuka seluruh halaman informasi dan seluruh halaman laporan **kecuali** form pembuatan laporan dan daftar laporan pribadi.

---

## 2. Pohon Situs

```
/  (Beranda)
│
├── /berita                      Daftar berita desa
│   └── /berita/:slug            Detail berita
│
├── /profil                      Profil desa (statis)
│
├── /laporan                     Peta + daftar laporan jalan rusak
│   ├── /laporan/:ticketCode     Detail laporan (publik)
│   ├── /laporan/baru            Form buat laporan            [login]
│   └── /laporan/saya            Daftar laporan milik sendiri  [login]
│
├── /masuk                       Login warga
├── /daftar                      Registrasi warga
│
└── *                            Halaman 404
```

**Catatan urutan routing:** `/laporan/baru` dan `/laporan/saya` harus didaftarkan **sebelum** `/laporan/:ticketCode`, agar tidak tertangkap sebagai kode tiket.

---

## 3. Navigasi Global

### 3.1 Header

Tampil di semua halaman.

| Elemen | Kondisi | Aksi |
| --- | --- | --- |
| Logo + nama desa | Selalu | Menuju `/` |
| Beranda | Selalu | Menuju `/` |
| Berita | Selalu | Menuju `/berita` |
| Profil Desa | Selalu | Menuju `/profil` |
| Laporan | Selalu | Menuju `/laporan` |
| Tombol **Masuk** | Belum login | Menuju `/masuk` |
| Tombol **Daftar** | Belum login | Menuju `/daftar` |
| Menu **Laporan Saya** | Sudah login | Menuju `/laporan/saya` |
| Tombol **Keluar** | Sudah login | Logout, lalu menuju `/` |
| Tombol menu (hamburger) | Layar < 768 px | Membuka menu geser |

Item yang sedang aktif diberi penanda visual (garis bawah atau warna berbeda).

### 3.2 Footer

Tampil di semua halaman.

- Nama dan alamat kantor desa
- Nomor telepon / WhatsApp kantor desa
- Jam layanan
- Tautan cepat: Beranda, Berita, Profil Desa, Laporan
- Keterangan: "Situs ini hanya menampilkan lokasi jalan rusak dan tidak menjadwalkan perbaikan."
- Hak cipta + tahun berjalan

### 3.3 Tombol Aksi Mengambang

Pada halaman `/laporan` dan `/laporan/saya`, tampil tombol **"+ Buat Laporan"** yang menempel di kanan bawah (mobile) atau kanan atas daftar (desktop).

- Belum login → menuju `/masuk?redirect=/laporan/baru`
- Sudah login → menuju `/laporan/baru`

---

## 4. Detail Halaman

---

### 4.1 `/` — Beranda

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `{Nama Desa} — Peta Jalan Rusak` |
| Tujuan | Memberi gambaran singkat kondisi jalan desa dan mendorong pelaporan |

**Konten**

1. **Hero** — nama desa, satu kalimat penjelasan singkat, dua tombol: "Lihat Peta" (→ `/laporan`) dan "Buat Laporan" (→ `/laporan/baru` atau `/masuk`)
2. **Kartu statistik** — jumlah laporan terpublikasi, jumlah jenis kerusakan yang tercatat, tanggal pembaruan terakhir
3. **Peta ringkas** — pratinjau peta dengan seluruh titik `DISETUJUI`, tinggi terbatas, tidak interaktif penuh; klik menuju `/laporan`
4. **Berita terbaru** — maksimal 3 kartu berita `TERBIT`
5. **Cara melapor** — 3 langkah bergambar: daftar akun → isi laporan → tunggu verifikasi
6. **Ajakan** — "Lihat semua laporan" (→ `/laporan`)

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Belum ada laporan terpublikasi | Peta diganti panel kosong: "Belum ada laporan yang dipublikasikan." |
| Belum ada berita | Bagian berita disembunyikan seluruhnya |
| Gagal memuat data | Panel galat + tombol "Coba lagi" |

---

### 4.2 `/berita` — Daftar Berita

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Berita Desa — {Nama Desa}` |
| Tujuan | Menampilkan seluruh berita desa yang sudah terbit |

**Konten**

- Judul halaman + deskripsi singkat
- Daftar kartu berita: gambar sampul, judul, tanggal terbit, cuplikan 2 baris
- Paginasi (10 item per halaman) atau tombol "Muat lebih banyak"
- Urutan: tanggal terbit terbaru di atas

**Aksi**

- Klik kartu → `/berita/:slug`

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Tidak ada berita | Ilustrasi + teks "Belum ada berita." |
| Gambar sampul kosong | Placeholder abu-abu dengan ikon |
| Memuat | Skeleton card ×3 |

---

### 4.3 `/berita/:slug` — Detail Berita

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `{Judul Berita} — {Nama Desa}` |
| Tujuan | Menampilkan isi lengkap berita |

**Konten**

- Gambar sampul (lebar penuh, rasio 16:9)
- Judul
- Tanggal terbit
- Isi berita (rich text: paragraf, daftar, tautan, tebal/miring)
- Tombol "Kembali ke Berita" → `/berita`
- Bagian "Berita Lainnya" — maksimal 3 berita lain

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Slug tidak ditemukan | Status 404, halaman "Berita tidak ditemukan" |
| Berita berstatus `DRAFT` | Diperlakukan sama seperti tidak ditemukan |

---

### 4.4 `/profil` — Profil Desa

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Profil Desa {Nama Desa}` |
| Tujuan | Memperkenalkan desa |
| Sumber data | Statis, ditulis langsung di kode frontend |

**Konten**

1. **Sambutan singkat** — foto, nama, dan jabatan Kepala Desa + kalimat pembuka
2. **Sejarah & ringkasan desa** — paragraf naratif (tanpa statistik luas wilayah/penduduk/dusun/RT-RW)
3. **Kontak & lokasi** — alamat kantor, nomor telepon/WA, email, jam layanan, peta lokasi kantor

**Bagian yang tidak dipakai:** Visi & Misi, Struktur Organisasi, dan Data Umum Desa dihapus dari halaman ini.

**Catatan:** seluruh konten memakai placeholder `[MENYUSUL]` sampai data desa tersedia.

---

### 4.5 `/laporan` — Peta & Daftar Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Laporan Jalan Rusak — {Nama Desa}` |
| Tujuan | Menampilkan seluruh jalan rusak yang sudah diverifikasi |

**Konten**

**Bagian atas — peta**

- Peta Leaflet + OpenStreetMap, lebar penuh
- Penanda untuk setiap laporan `DISETUJUI`
- Klik penanda → popup ringkas: foto utama (thumbnail), alamat, jenis kerusakan, tombol "Lihat Detail"
- Kontrol zoom, tombol "Pusatkan ke desa"
- Legenda: satu warna penanda, keterangan "Jalan rusak"

**Bagian bawah — daftar**

- Bilah filter:
  - Jenis kerusakan (multi-pilih): Lubang, Retak, Amblas, Bergelombang, Mengelupas, Tergenang
  - Pencarian kode tiket (format `#RPT-YYYYMMDD-XXX`)
  - Tombol "Reset filter"
- Kartu laporan: thumbnail foto, alamat, jenis kerusakan (chip), kode tiket, tanggal lapor
- Urutan: terbaru di atas
- Paginasi 10 item per halaman

**Aksi**

- Klik kartu → `/laporan/:ticketCode`
- Tombol "+ Buat Laporan" → `/laporan/baru` (guard login)

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Belum ada laporan terpublikasi | Peta kosong + teks "Belum ada laporan yang dipublikasikan." |
| Filter tidak menghasilkan apa pun | "Tidak ada laporan yang cocok dengan filter." + tombol reset |
| Pencarian kode tidak ditemukan | "Laporan dengan kode tersebut tidak ditemukan." |
| Kode ditemukan tapi belum dipublikasikan | "Laporan tersebut belum dipublikasikan." (tanpa detail) |
| Gagal memuat peta | Placeholder + tombol "Muat ulang peta" |

---

### 4.6 `/laporan/:ticketCode` — Detail Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | Publik, **hanya laporan `DISETUJUI`** |
| Judul dokumen | `Laporan {ticketCode} — {Nama Desa}` |
| Tujuan | Menampilkan rincian satu laporan |

**Konten**

- Kode tiket + badge status
- Galeri foto (1–3 foto, bisa dibuka layar penuh)
- Alamat lengkap
- Peta kecil dengan satu penanda
- Jenis kerusakan (chip)
- Deskripsi
- Nama pelapor
- Tanggal lapor
- Tombol "Kembali ke Laporan" → `/laporan`

**Yang tidak ditampilkan:** nomor WhatsApp dan email pelapor.

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Kode tidak ada | 404 — "Laporan tidak ditemukan" |
| Status `PENDING` | "Laporan sedang menunggu verifikasi." |
| Status `DITOLAK` | "Laporan ini tidak dipublikasikan." |
| Status `DITARIK` | "Laporan ini telah ditarik dari publikasi." |

Ketiga pesan di atas **tidak** menampilkan foto, alamat, maupun identitas pelapor.

---

### 4.7 `/laporan/baru` — Form Buat Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | **Warga login** |
| Judul dokumen | `Buat Laporan — {Nama Desa}` |
| Tujuan | Mengumpulkan data laporan jalan rusak |

**Struktur form — 4 langkah**

| Langkah | Isi | Wajib |
| --- | --- | --- |
| 1. Foto | Unggah 1–3 foto, pratinjau, hapus, kompres otomatis | ✅ |
| 2. Lokasi | Peta Leaflet + pin dapat digeser, tombol "Gunakan lokasi saya", textarea alamat lengkap | ✅ |
| 3. Detail | Multi-pilih jenis kerusakan (6 opsi), textarea deskripsi (min. 30 karakter) | ✅ |
| 4. Ringkasan | Pratinjau seluruh isi + checkbox pernyataan + tombol Kirim | ✅ |

**Elemen pendukung**

- Indikator progres langkah di atas form
- Identitas pelapor (nama) tampil read-only di langkah 3
- Draft tersimpan otomatis di `localStorage`, dipulihkan saat halaman dibuka kembali
- Tombol "Kembali" antar langkah tanpa kehilangan data
- Petunjuk foto: "Ambil dari jarak yang memperlihatkan kerusakan dan kondisi sekitar jalan"

**Setelah berhasil**

- Dialog sukses: kode tiket + status "Menunggu verifikasi"
- Tombol "Lihat Laporan Saya" → `/laporan/saya`
- Tombol "Kembali ke Beranda" → `/`
- Draft di `localStorage` dihapus

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Belum login | Redirect ke `/masuk?redirect=/laporan/baru` |
| Batas 10 laporan/hari tercapai | Peringatan + tombol kirim dinonaktifkan |
| Upload gagal | Pesan per foto + tombol "Coba lagi" |
| Koneksi terputus saat kirim | Data tetap tersimpan sebagai draft |

---

### 4.8 `/laporan/saya` — Laporan Saya

| Atribut | Nilai |
| --- | --- |
| Akses | **Warga login** |
| Judul dokumen | `Laporan Saya — {Nama Desa}` |
| Tujuan | Memantau status laporan sendiri |

**Konten**

- Ringkasan: jumlah laporan per status (Menunggu, Dipublikasikan, Ditolak, Ditarik)
- Daftar kartu laporan milik sendiri, mencakup **semua status**
- Setiap kartu: thumbnail, alamat, jenis kerusakan, kode tiket, tanggal, badge status
- Aksi per kartu:
  - **Edit** — hanya muncul saat status `PENDING`, menuju `/laporan/:id/edit`
  - **Lihat** — menuju `/laporan/:ticketCode` bila `DISETUJUI`
- Laporan `DITOLAK` menampilkan kotak alasan penolakan
- Laporan `DITARIK` menampilkan keterangan "ditarik dari publikasi"

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Belum punya laporan | Ilustrasi + tombol "Buat Laporan Pertama" |
| Belum login | Redirect ke `/masuk?redirect=/laporan/saya` |

---

### 4.9 `/laporan/:id/edit` — Edit Laporan

| Atribut | Nilai |
| --- | --- |
| Akses | **Warga login + pemilik laporan + status `PENDING`** |
| Judul dokumen | `Edit Laporan — {Nama Desa}` |
| Tujuan | Memperbaiki laporan sebelum diverifikasi |

**Konten**

- Form yang sama dengan `/laporan/baru`, terisi data sebelumnya
- Seluruh field dapat diubah: foto, alamat, pin, jenis kerusakan, deskripsi
- Kode tiket dan status tampil read-only di atas form
- Tombol "Simpan Perubahan" dan "Batal"

**Kondisi khusus**

| Kondisi | Tampilan |
| --- | --- |
| Status bukan `PENDING` | Halaman 403 — "Laporan sudah diverifikasi dan tidak dapat diubah" |
| Bukan pemilik laporan | 404 — "Laporan tidak ditemukan" (tidak membocorkan keberadaan data) |

---

### 4.10 `/masuk` — Login

| Atribut | Nilai |
| --- | --- |
| Akses | Publik (pengunjung yang sudah login diarahkan ke `/`) |
| Judul dokumen | `Masuk — {Nama Desa}` |
| Tujuan | Autentikasi warga |

**Konten**

- Judul "Masuk"
- Field: email, password (dengan tombol tampilkan/sembunyikan)
- Checkbox "Ingat saya"
- Tombol "Masuk"
- Tautan "Belum punya akun? Daftar" → `/daftar`
- Kotak bantuan: "Lupa password? Hubungi Admin desa di {kontak} untuk reset password." — **tanpa tautan reset mandiri**

**Perilaku**

- Sukses → menuju `:redirect` bila ada, jika tidak ke `/`
- Gagal → pesan "Email atau password salah" (tidak membedakan mana yang salah)
- 5 percobaan gagal → pesan "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
- Akun `NONAKTIF` → "Akun Anda dinonaktifkan. Hubungi Admin desa."

---

### 4.11 `/daftar` — Registrasi

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Daftar — {Nama Desa}` |
| Tujuan | Membuat akun warga |

**Konten**

| Field | Validasi |
| --- | --- |
| Nama lengkap | Wajib, 3–100 karakter |
| Email | Wajib, format valid, unik |
| Nomor WhatsApp | Wajib, 9–15 digit, boleh diawali `+62` |
| Password | Wajib, min. 8 karakter, indikator kekuatan |
| Konfirmasi password | Harus sama |
| Checkbox persetujuan | Wajib dicentang |

- Catatan di bawah form: "Password hanya dapat diubah oleh Admin desa. Simpan password Anda dengan baik."
- Tombol "Daftar"
- Tautan "Sudah punya akun? Masuk" → `/masuk`

**Perilaku**

- Sukses → otomatis login → `/laporan/baru`
- Email sudah terdaftar → "Email sudah digunakan"
- Nomor WA tidak valid → pesan per field

---

### 4.12 `*` — Halaman 404

| Atribut | Nilai |
| --- | --- |
| Akses | Publik |
| Judul dokumen | `Halaman Tidak Ditemukan — {Nama Desa}` |

**Konten**

- Ilustrasi
- "Halaman yang Anda cari tidak ditemukan."
- Tombol "Kembali ke Beranda" → `/`
- Tautan "Lihat Laporan" → `/laporan`

---

## 5. Alur Pengguna

### 5.1 Pengunjung → Pelapor

```
/  ──klik "Buat Laporan"──►  /masuk?redirect=/laporan/baru
                                    │
                             belum punya akun
                                    ▼
                              /daftar  ──sukses──►  auto login
                                    │
                                    ▼
                            /laporan/baru  (4 langkah)
                                    │
                              kirim berhasil
                                    ▼
                        dialog kode tiket + /laporan/saya
```

### 5.2 Pemantauan Status

```
/laporan/saya
   ├── PENDING    → tombol Edit → /laporan/:id/edit
   ├── DISETUJUI  → tombol Lihat → /laporan/:ticketCode
   ├── DITOLAK    → tampil alasan penolakan
   └── DITARIK    → tampil keterangan penarikan
```

### 5.3 Pencarian Laporan oleh Pengunjung

```
/  ──►  /laporan  ──filter/cari──►  kartu laporan  ──►  /laporan/:ticketCode
```

---

## 6. Aturan Redirect & Guard

| Rute | Guard | Perilaku bila gagal |
| --- | --- | --- |
| `/laporan/baru` | Wajib login | `/masuk?redirect=/laporan/baru` |
| `/laporan/saya` | Wajib login | `/masuk?redirect=/laporan/saya` |
| `/laporan/:id/edit` | Wajib login + pemilik + `PENDING` | 403 (bukan `PENDING`) / 404 (bukan pemilik) |
| `/masuk`, `/daftar` | Sudah login | Redirect `/` |
| `/laporan/:ticketCode` | Status `DISETUJUI` | Pesan status, tanpa data |

**Setelah login berhasil:** arahkan ke parameter `redirect` bila ada dan merupakan path internal yang valid; selain itu ke `/`.

**Setelah logout:** hapus sesi, arahkan ke `/`.

---

## 7. Matriks Akses Halaman

| Rute | Pengunjung | Warga login |
| --- | --- | --- |
| `/` | ✅ | ✅ |
| `/berita` | ✅ | ✅ |
| `/berita/:slug` | ✅ | ✅ |
| `/profil` | ✅ | ✅ |
| `/laporan` | ✅ | ✅ |
| `/laporan/:ticketCode` | ✅ (hanya `DISETUJUI`) | ✅ (hanya `DISETUJUI`) |
| `/laporan/baru` | ❌ → login | ✅ |
| `/laporan/saya` | ❌ → login | ✅ |
| `/laporan/:id/edit` | ❌ → login | ✅ (pemilik + `PENDING`) |
| `/masuk` | ✅ | ❌ → `/` |
| `/daftar` | ✅ | ❌ → `/` |

---

## 8. Komponen Bersama

| Komponen | Dipakai di | Keterangan |
| --- | --- | --- |
| `Header` | Semua halaman | Navigasi + status login |
| `Footer` | Semua halaman | Kontak desa + tautan |
| `MobileMenu` | Header | Menu geser < 768 px |
| `MapView` | Beranda, `/laporan`, detail laporan, form | Leaflet + OpenStreetMap |
| `MapPicker` | Form laporan | Pin dapat digeser |
| `ReportCard` | Beranda, `/laporan`, `/laporan/saya` | Varian publik & pribadi |
| `StatusBadge` | Detail, Laporan Saya | 4 status |
| `NewsCard` | Beranda, `/berita` | — |
| `PhotoGallery` | Detail laporan | 1–3 foto, bisa layar penuh |
| `PhotoUploader` | Form laporan | Maks 3, kompres otomatis |
| `DamageTypeChips` | Form, filter, kartu | 6 jenis kerusakan |
| `EmptyState` | Semua daftar | Ilustrasi + pesan |
| `ErrorState` | Semua halaman | Pesan + tombol coba lagi |
| `ConfirmDialog` | Hapus draft, keluar | — |
| `Toast` | Semua aksi | Notifikasi singkat |

---

## 9. Responsif & Aksesibilitas

**Breakpoint**

| Nama | Lebar | Perilaku |
| --- | --- | --- |
| Mobile | < 768 px | Menu hamburger, kartu satu kolom, peta tinggi 240 px, tombol aksi lebar penuh |
| Tablet | 768–1023 px | Kartu dua kolom, peta tinggi 320 px |
| Desktop | ≥ 1024 px | Navigasi penuh, kartu tiga kolom, peta tinggi 480 px |

**Aksesibilitas**

- Target sentuh minimal 44 × 44 px
- Seluruh input memiliki `<label>` yang terhubung
- Kontras teks memenuhi WCAG AA
- Gambar memiliki teks alternatif
- Form dapat diselesaikan hanya dengan keyboard
- Pesan galat diumumkan lewat `aria-live`
- Fokus terlihat jelas pada semua elemen interaktif

---

## 10. Catatan Teknis Routing

1. Daftarkan `/laporan/baru` dan `/laporan/saya` **sebelum** `/laporan/:ticketCode`.
2. Kode tiket divalidasi dengan pola `^RPT-\d{8}-\d{3}$` sebelum memanggil API; pola tidak cocok langsung menampilkan 404.
3. `/laporan/:id/edit` memakai `id` numerik internal, bukan kode tiket, karena halaman ini tidak untuk publik.
4. Parameter `redirect` pada `/masuk` hanya menerima path internal (diawali `/`), untuk mencegah open redirect.
5. Setiap perpindahan halaman menggulir ke atas dan memperbarui `document.title`.
6. Halaman dengan data dinamis menyertakan status memuat (skeleton) dan galat (panel + tombol coba lagi).

---

## 11. Rute yang Sengaja Tidak Ada

| Rute | Alasan |
| --- | --- |
| `/akun`, `/pengaturan` | Warga tidak dapat mengubah profil maupun password sendiri |
| `/lupa-password`, `/reset-password` | Reset password dilakukan manual oleh Admin |
| `/verifikasi-email` | Registrasi langsung aktif |
| `/laporan/:id/hapus` | Warga tidak dapat menghapus laporan |
| `/notifikasi` | Notifikasi hanya tampil sebagai status di Laporan Saya |
| `/peta` (terpisah) | Peta sudah menjadi bagian dari `/laporan` |
