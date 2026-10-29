---
name: Lapor Jalan Desa
description: Design system website publik pelaporan jalan rusak desa. Civic minimalist, hijau-navy, mobile-first, dibuat dari referensi portal Gapura Jabar dan disesuaikan dengan sitemap-public v1.0.
colors:
  primary: "#15803D"
  primary-hover: "#166534"
  primary-soft: "#DCFCE7"
  brand-green: "#16A34A"
  secondary: "#1E2A78"
  secondary-soft: "#E8EAF6"
  accent: "#8B1A1A"
  background: "#FFFFFF"
  background-muted: "#F8F8F8"
  surface: "#FFFFFF"
  surface-dark: "#0F3D2A"
  overlay-hero: "rgba(0,0,0,0.55)"
  text-primary: "#111827"
  text-secondary: "#4B5563"
  text-on-primary: "#FFFFFF"
  border: "#E5E7EB"
  border-strong: "#D1D5DB"
  success: "#15803D"
  warning: "#B45309"
  error: "#B91C1C"
  info: "#1D4ED8"
  status-pending: "#B45309"
  status-disetujui: "#15803D"
  status-ditolak: "#B91C1C"
  status-ditarik: "#4B5563"
  map-marker: "#B91C1C"
typography:
  display:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  h1:
    fontFamily: "Merriweather, Georgia, serif"
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.25
  h2:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.3
  h3:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.35
  body-lg:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Lato, system-ui, sans-serif"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
elevation:
  none: "none"
  card: "0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)"
  raised: "0 4px 12px rgba(0,0,0,0.10)"
  fab: "0 6px 16px rgba(0,0,0,0.20)"
layout:
  container-max: 1200px
  sidebar-width: 280px
  navbar-height: 72px
  navbar-height-mobile: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    minHeight: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    minHeight: 44px
  button-ghost-on-dark:
    backgroundColor: "rgba(255,255,255,0.12)"
    textColor: "#FFFFFF"
    border: "1px solid rgba(255,255,255,0.30)"
    rounded: "{rounded.md}"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
  fab-report:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
    shadow: "{elevation.fab}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border-strong}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    minHeight: 44px
  search-bar-hero:
    backgroundColor: "rgba(255,255,255,0.14)"
    textColor: "#FFFFFF"
    border: "1px solid rgba(255,255,255,0.30)"
    rounded: "{rounded.md}"
    padding: "8px"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{elevation.card}"
  report-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  news-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
  chip-damage:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  status-badge:
    rounded: "{rounded.full}"
    padding: "2px 10px"
  navbar-transparent:
    backgroundColor: "rgba(0,0,0,0.35)"
    textColor: "#FFFFFF"
  navbar-solid:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
  sidebar-nav-item-active:
    textColor: "{colors.primary}"
    backgroundColor: "{colors.primary-soft}"
    rounded: "{rounded.md}"
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "#FFFFFF"
---

## Overview

Antarmuka untuk **website publik pelaporan jalan rusak desa**. Sasaran utamanya warga desa dari berbagai usia yang mayoritas membuka lewat ponsel. Kesan yang dituju: **trustworthy, approachable, official**. Resmi seperti portal pemerintah, tetapi hangat dan mudah dipahami.

Gaya visual: **Civic / Corporate Minimalist** dengan hero foto berlapis overlay gelap, card putih bersih, dan satu warna aksi (hijau). Referensi strukturnya adalah portal Gapura Jabar: navbar transparan yang menjadi hijau solid saat scroll, card utama yang sedikit menumpuk di atas hero, sidebar sub-navigasi pada halaman dalam, dan heading serif pada halaman konten.

Identitas Pemprov Jabar (logo, ornamen batik, tagline, foto) **tidak dipakai**. Yang diambil hanya struktur dan sistem desainnya. Nama dan identitas desa memakai placeholder `[NAMA DESA]` dan `[MENYUSUL]` sampai data tersedia.

## Colors

- **Primary `#15803D`** hanya untuk aksi utama (tombol "Buat Laporan", "Masuk", "Daftar", "Cari"), navbar solid, item aktif, dan tab aktif. Nilai ini sengaja lebih gelap dari hijau referensi (`#16A34A`) agar teks putih di atasnya mencapai kontras ≥ 5:1 (WCAG AA). `brand-green` hanya untuk elemen dekoratif besar, tidak pernah untuk teks kecil.
- **Secondary navy `#1E2A78`** untuk judul section ("Berita Terkini", "Misi") dan panel penekanan. Kontras terhadap putih ≈ 12:1.
- **Accent maroon `#8B1A1A`** hanya untuk penekanan editorial (kutipan visi, nomor kontak penting). Jangan dipakai sebagai warna tombol.
- **Surface dan background:** halaman `#FFFFFF`, panel konten `#F8F8F8`, card `#FFFFFF` dengan hairline border `#E5E7EB`. Header halaman dalam dan footer memakai `#0F3D2A`.
- **Hero overlay:** foto selalu ditimpa `rgba(0,0,0,0.55)` agar teks putih terbaca (≥ 4.5:1).
- **Status laporan** memakai warna semantik dan selalu disertai teks, tidak hanya warna: Menunggu (amber `#B45309`), Proses (biru secondary), Diperbaiki (hijau `#15803D`), Ditolak (merah `#B91C1C`), Ditarik (abu `#4B5563`).
- **Map marker** memakai satu warna `#B91C1C` agar kontras terhadap peta OpenStreetMap. Legenda: satu penanda, keterangan "Jalan rusak".

## Typography

- **Body dan UI:** Lato (humanist sans), ramah dan terbaca di layar kecil.
- **Heading halaman konten** (Profil Desa, judul detail berita): Merriweather (editorial serif), weight 700, warna hijau atau navy, supaya halaman informasi terasa resmi.
- **Hero display:** Lato 700, 3rem di desktop dan 2rem di mobile (`clamp(2rem, 5vw, 3rem)`).
- **Ukuran minimum:** body 16px, teks sekunder 14px, caption 12px. Referensi memakai teks 10 sampai 11px di beberapa tempat dan itu **tidak ditiru**.
- Angka statistik (jumlah laporan) memakai tabular figures (`font-variant-numeric: tabular-nums`).
- Semua UI berbahasa Indonesia. Tombol memakai kata kerja ("Buat Laporan", "Lihat Detail", "Coba lagi").

## Spacing & Layout

- **Grid 8px** (sub-unit 4px). Padding card 24px, gap antar card 16px, jarak antar section 48px (mobile) dan 80 sampai 96px (desktop).
- **Container** maks 1200px, terpusat, padding horizontal 16px (mobile) dan 24px (desktop). Mobile-first, prioritas layar 360px ke atas.
- **Pola Beranda:** hero full-bleed, lalu card statistik yang menumpuk 48px ke atas hero (overlap), peta ringkas, berita terbaru (maks 3), cara melapor (3 langkah), dan ajakan.
- **Pola halaman dalam** (Profil, Detail Berita): header gelap `#0F3D2A` dengan padding bawah cukup, lalu konten dimulai **di bawah** header (tanpa margin negatif, agar tidak menimpa teks header). Di desktop dipakai sidebar sub-nav kiri 280px + konten kanan. Di mobile sidebar berubah menjadi daftar tautan di atas konten.
- **Pola `/laporan`:** peta lebar penuh di atas (tinggi 240/320/480px untuk mobile/tablet/desktop), lalu bilah filter dan grid kartu laporan (1/2/3 kolom).
- **Whitespace:** balanced. Hierarki dibentuk oleh ukuran heading, weight, dan warna hijau sebagai penunjuk aksi.

## Shapes

Rounded subtle ke friendly: **8px** untuk tombol dan input, **12px** untuk card dan FAB, **16px** untuk panel besar dan dialog, **pill (9999px)** untuk chip jenis kerusakan, badge status, dan tab. Jangan mencampur radius di dalam satu komponen.

## Elevation & Depth

Dominan **flat dengan hairline border**. Card memakai `elevation.card` yang sangat tipis, dan hover pada card yang bisa diklik naik ke `elevation.raised`. Satu-satunya elemen dengan shadow kuat adalah FAB (`elevation.fab`). Tidak ada glow, tidak ada hard shadow, dan tidak ada efek neumorphism.

## Components

**Navbar**
- Tinggi 72px (64px mobile), sticky. Isi: logo + `[NAMA DESA]` di kiri, lalu Beranda, Berita, Profil Desa, Laporan.
- Di kanan: Masuk dan Daftar untuk pengunjung, atau menu Laporan Saya dan tombol Keluar untuk warga login.
- Di atas hero (`/`) navbar **transparan** (`navbar-transparent`). Setelah scroll > 80px ia berubah menjadi hijau solid dengan transisi 200ms. Di halaman lain navbar langsung solid.
- Item aktif ditandai garis bawah 2px putih. Mobile memakai hamburger yang membuka panel geser.

**Hero beranda**
- Foto jalan atau warga desa dengan overlay, judul display putih, subjudul 1 kalimat, dan dua tombol: "Lihat Peta" (primary) dan "Buat Laporan" (ghost-on-dark).
- Hero hanya berisi judul, subjudul, dan dua tombol. Badge "Sistem Aspirasi Jalan Publik", search bar kode tiket, dan chip "Pencarian populer" **tidak dipakai** (dihapus); pencarian kode tiket/nama jalan hanya ada di halaman `/laporan`.

**FAB "+ Buat Laporan"**
- Hanya di `/laporan` dan `/laporan/saya` sesuai sitemap. Kanan bawah di mobile, kanan atas daftar di desktop.
- Rail FAB multi-tombol dan rail sosial media dari referensi **tidak dipakai**.

**Kartu laporan (`report-card`)**
- Thumbnail 4:3 di atas, alamat (2 baris), chip jenis kerusakan, kode tiket (tabular), tanggal. Di `/laporan/saya` ditambah status badge, kotak alasan penolakan (merah muda lembut) pada status Ditolak, dan tombol Edit saat Menunggu.

**Peta**
- Leaflet + OpenStreetMap, kontrol zoom dan tombol "Pusatkan ke desa". Popup marker memuat thumbnail, alamat, jenis kerusakan, dan tombol "Lihat Detail". Marker memakai satu warna.

**Berita**
- `news-card`: sampul 16:9, judul maks 2 baris, tanggal terbit, cuplikan 2 baris.
- Beranda memakai pola referensi yang disederhanakan: satu berita unggulan dengan overlay gradient bawah + 2 sampai 3 berita samping. Tab "Terbaru / Terpopuler" **tidak dipakai** karena tidak ada di sitemap.

**Form**
- Form laporan 4 langkah dengan stepper di atas (lingkaran bernomor + garis penghubung, langkah aktif hijau). Label selalu di atas field, galat tampil per field dalam teks merah dengan ikon, dan field memakai tinggi min 44px.

**Sidebar sub-nav** (Profil): item bergrup, item aktif hijau dengan latar `primary-soft`, ukuran teks 14px.

**Status badge, chip, tab, dialog, toast, skeleton, empty state, error state:** mengikuti token di atas. Empty state memakai ilustrasi sederhana + pesan + tombol aksi utama bila relevan. Loading memakai skeleton, bukan spinner penuh halaman.

**Footer:** latar `#0F3D2A`, teks putih. Isi: nama dan alamat kantor desa, kontak, jam layanan, tautan cepat, dan keterangan wajib "Situs ini hanya menampilkan lokasi jalan rusak dan tidak menjadwalkan perbaikan."

## Iconography & Imagery

- **Ikon:** satu family outline (Lucide), stroke 1.5 sampai 2px, ukuran 20px (UI) dan 24px (kartu fitur), warna mengikuti teks atau primary. Jangan mencampur ikon filled dan outline.
- **Foto:** dokumentasi nyata kegiatan dan jalan desa, tone hangat. Rasio 16:9 (hero, sampul), 4:3 (thumbnail laporan), 1:1 (avatar). Foto laporan warga tampil apa adanya tanpa filter.
- **Ornamen:** pola tekstur tipis bergaya lokal desa boleh dipakai sebagai watermark di panel konten (opasitas ≤ 8%) setelah identitas desa tersedia. Sementara itu tidak dipakai.

## Motion & Interaction

- Durasi 150ms (hover, fokus), 200 sampai 300ms (navbar, dialog). Easing `ease-out`.
- Hover tombol: gelapkan ke `primary-hover`. Hover card: naik ke `elevation.raised`, tanpa scale berlebih.
- Fokus: ring 2px `primary` dengan offset 2px, wajib terlihat di semua elemen interaktif.
- Hormati `prefers-reduced-motion`: matikan transisi dan carousel otomatis.

## Responsive

- Breakpoint: sm 640, md 768, lg 1024, xl 1280. Mobile-first.
- **Mobile (< 768):** hamburger, kartu satu kolom, peta 240px, tombol aksi lebar penuh, FAB kanan bawah.
- **Tablet (768 sampai 1023):** kartu dua kolom, peta 320px.
- **Desktop (≥ 1024):** navigasi penuh, kartu tiga kolom, peta 480px, sidebar Profil tampil.
- Target sentuh minimal 44 × 44px.

## Accessibility

- WCAG AA: kontras 4.5:1 untuk teks normal dan 3:1 untuk teks besar.
- Semua input memiliki `<label>`, gambar memiliki teks alternatif, form dapat diselesaikan hanya dengan keyboard.
- Pesan galat dan perubahan status diumumkan lewat `aria-live`. HTML semantik (`header`, `nav`, `main`, `footer`).
- Status tidak boleh disampaikan hanya lewat warna.

## Rules to Never Break

- Jangan memakai primary hijau untuk dekorasi. Hijau berarti "aksi" atau "aktif".
- Jangan menampilkan teks di bawah 12px. Teks isi minimal 14px.
- Jangan menaruh teks putih di atas `#16A34A`. Pakai `#15803D` atau lebih gelap.
- Jangan menampilkan nomor WhatsApp atau email pelapor di halaman publik. Nama pelapor boleh tampil.
- Peta publik hanya menampilkan laporan berstatus `PROSES`; daftar dan detail publik juga memuat laporan `DIPERBAIKI` sebagai riwayat.
- Jangan menjanjikan jadwal perbaikan. Status `PROSES` dan `DIPERBAIKI` hanya mencerminkan pembaruan yang dicatat admin desa.
- Jangan memakai logo, ornamen, atau foto dari Pemprov Jabar. Jangan memakai lorem ipsum. Isi konten Indonesia yang kontekstual.
- Jangan menambah tautan "lupa password" mandiri. Gunakan kotak bantuan "Hubungi Admin desa".
- Jangan mencampur lebih dari dua weight dan dua font family di satu halaman.
