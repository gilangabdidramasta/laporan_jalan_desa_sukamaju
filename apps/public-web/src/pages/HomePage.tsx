import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapView } from '../components/MapView'
import { NewsCard } from '../components/NewsCard'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../lib/auth'
import { formatDate } from '../lib/format'
import { fetchNewsList, fetchPublicReports, fetchPublicStats } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { VILLAGE } from '../lib/village'

const STEPS = [
  {
    icon: 'how_to_reg',
    title: 'Daftar Akun Warga',
    description:
      'Buat akun warga Kota Pekanbaru menggunakan alamat email dan nomor WhatsApp aktif Anda.',
    note: 'Gratis dan hanya butuh satu menit',
  },
  {
    icon: 'add_a_photo',
    title: 'Laporkan Kerusakan',
    description:
      'Unggah 1–3 foto kerusakan jalan, tandai titik lokasi pada peta, dan pilih jenis kerusakannya.',
    note: 'Pin lokasi bisa digeser manual',
  },
  {
    icon: 'verified_user',
    title: 'Pantau Tindak Lanjut',
    description:
      'Admin Kota memverifikasi laporan, lalu menampilkan titik yang sedang ditangani di peta publik.',
    note: 'Status dapat dipantau lewat kode tiket',
  },
]

export function HomePage() {
  usePageTitle()
  const { isAuthenticated } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
  })

  const { data: reportsPage, isLoading: reportsLoading } = useQuery({
    queryKey: ['public-reports', 'all'],
    queryFn: () => fetchPublicReports({ perPage: 200 }),
  })

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNewsList,
  })

  const reports = reportsPage?.items ?? []
  const activeReports = reports.filter((report) => report.status === 'PROSES')

  return (
    <div className="flex flex-col w-full">
      {/* ------------------------------- HERO ------------------------------- */}
      <section
        data-hero
        className="relative w-full min-h-[620px] flex items-center bg-surface-dark overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/pekanbaru.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-on-surface/90 via-on-surface/75 to-on-surface/40 backdrop-brightness-90" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-margin lg:px-margin-desktop pt-20 pb-24">
          <div className="max-w-2xl">
            <h1 className="font-display text-display-mobile md:text-display text-on-primary font-bold tracking-tight">
              Pantau Kondisi Jalan {VILLAGE.nama}
            </h1>

            <p className="font-body-lg text-body-lg text-on-primary/90 mt-4 leading-relaxed">
              Lihat titik jalan rusak yang sedang ditangani dan laporkan kerusakan
              di sekitar Anda. Setiap laporan membantu Pemerintah Kota Pekanbaru
              menyusun prioritas perbaikan yang lebih tepat.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/laporan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-title text-title shadow-card transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                <span>Lihat Peta</span>
              </Link>
              <Link
                to={isAuthenticated ? '/laporan/baru' : '/masuk?redirect=/laporan/baru'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/30 bg-white/10 hover:bg-white/20 text-on-primary font-title text-title backdrop-blur-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Buat Laporan</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- STATISTIK ----------------------------- */}
      <section className="relative z-20 w-full max-w-[1200px] mx-auto px-margin lg:px-margin-desktop -mt-12">
        <div className="bg-surface-container-lowest rounded-xl shadow-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-border-subtle">
          <div className="flex flex-col md:px-6 first:pl-0">
            <span className="font-display text-[36px] leading-[44px] font-bold text-secondary tabular-nums">
              {stats ? stats.totalReports : <Skeleton className="h-10 w-16" />}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium mt-1">
              Laporan jalan aktif
            </span>
          </div>

          <div className="flex flex-col md:px-6">
            <span className="font-display text-[36px] leading-[44px] font-bold text-secondary tabular-nums">
              {stats ? stats.damageTypeCount : <Skeleton className="h-10 w-12" />}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium mt-1">
              Jenis kerusakan aktif
            </span>
            <span className="font-caption text-caption text-on-surface-variant/70 mt-1">
              Lubang, Retak, Amblas, dan lainnya
            </span>
          </div>

          <div className="flex flex-col md:px-6 last:pr-0">
            <span className="font-headline-lg text-[32px] leading-[44px] font-bold text-secondary tabular-nums">
              {stats?.lastUpdated ? formatDate(stats.lastUpdated) : '—'}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium mt-1">
              Pembaruan terakhir
            </span>
            <span className="font-caption text-caption text-on-surface-variant/70 mt-1">
              Data diperbarui oleh Admin Kota
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------ PETA ------------------------------- */}
      <section className="w-full max-w-[1200px] mx-auto px-margin lg:px-margin-desktop pt-20 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="font-caption text-caption uppercase tracking-wider text-primary font-bold">
              Sebaran Spasial
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-secondary font-bold mt-1">
              Peta Sebaran Jalan Rusak
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Titik jalan rusak yang masih dalam proses penanganan di wilayah {VILLAGE.nama}.
            </p>
          </div>
          <Link
            to="/laporan"
            className="inline-flex items-center gap-1 font-title text-title text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            <span>Lihat peta lengkap &amp; filter</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>

        <div className="relative isolate">
          {reportsLoading ? (
            <Skeleton className="w-full h-[420px] rounded-lg" />
          ) : (
            <MapView reports={activeReports} height={420} />
          )}

          {!reportsLoading && activeReports.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-surface-container-lowest/95 rounded-lg p-space-md">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-3">
                <span className="material-symbols-outlined text-[30px]">map</span>
              </div>
              <h3 className="font-title text-title text-on-surface font-bold">
                Belum Ada Laporan yang Sedang Diproses
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
                Laporan yang selesai diperbaiki tetap dapat dilihat pada daftar
                laporan. Laporan baru mungkin masih menunggu verifikasi Admin Kota.
              </p>
              <Link
                to={isAuthenticated ? '/laporan/baru' : '/masuk?redirect=/laporan/baru'}
                className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-label-md text-label-md font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Jadilah yang Pertama Melapor
              </Link>
            </div>
          ) : null}

          {!reportsLoading && activeReports.length > 0 ? (
            <div className="absolute bottom-4 left-4 z-[400] bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-2 rounded-md shadow-card flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-status-rejected shadow-sm" />
              <span className="font-caption text-caption text-on-surface font-semibold">
                {activeReports.length} Titik Sedang Diproses
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {/* ----------------------------- BERITA ------------------------------ */}
      <section className="w-full max-w-[1200px] mx-auto px-margin lg:px-margin-desktop pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-caption text-caption uppercase tracking-wider text-primary font-bold">
              Publikasi Terkini
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-secondary font-bold mt-1">
              Kabar &amp; Berita Kota
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Informasi pembangunan, pemeliharaan jalan, dan kegiatan masyarakat
              Kota Pekanbaru.
            </p>
          </div>
          <Link
            to="/berita"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md text-label-md shadow-card transition-colors"
          >
            <span>Lihat Semua Berita</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-[380px] rounded-lg" />
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
        ) : news && news.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col">
              <NewsCard item={news[0]} featured />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              {news.slice(1, 3).map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Belum ada berita yang diterbitkan.
          </p>
        )}
      </section>

      {/* --------------------------- CARA MELAPOR -------------------------- */}
      <section className="w-full py-16 bg-surface-container-low shadow-card">
        <div className="max-w-[1200px] mx-auto px-margin lg:px-margin-desktop">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="font-caption text-caption uppercase tracking-wider text-primary font-bold">
              Alur Partisipasi
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-secondary font-bold mt-1">
              Cara Melaporkan Jalan Rusak
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Tiga langkah mudah untuk membantu mendata jalan rusak di Kota
              Pekanbaru dengan cepat dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-surface-variant -z-0" />
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="relative z-10 bg-surface-container-lowest rounded-lg p-6 shadow-card flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-4 relative shadow-card">
                  <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary font-caption text-caption font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-title text-title text-on-surface font-bold mb-2">
                  {step.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
                <div className="mt-4 pt-3 w-full bg-surface-container-low rounded-md py-2 px-3 flex items-center justify-center gap-1.5 text-on-surface-variant font-caption text-caption">
                  <span className="material-symbols-outlined text-[16px] text-brand-green">
                    check_circle
                  </span>
                  {step.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------- */}
      <section className="w-full bg-primary-soft py-12">
        <div className="max-w-[1200px] mx-auto px-margin lg:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h3 className="font-headline-sm text-headline-sm text-surface-dark font-bold leading-tight">
              Ingin melihat seluruh sebaran jalan rusak di Kota Pekanbaru?
            </h3>
            <p className="font-body-md text-body-md text-surface-dark/90 mt-1 leading-relaxed">
              Akses peta interaktif dengan filter jenis kerusakan dan pencarian
              kode tiket warga.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/laporan"
              className="px-6 py-3 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-title text-title font-semibold shadow-card transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">explore</span>
              Lihat Laporan
            </Link>
            <Link
              to={isAuthenticated ? '/laporan/baru' : '/masuk?redirect=/laporan/baru'}
              className="px-6 py-3 rounded-md bg-surface-container-lowest text-primary hover:bg-surface-container-low font-title text-title font-semibold shadow-card transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
              Buat Laporan Baru
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
