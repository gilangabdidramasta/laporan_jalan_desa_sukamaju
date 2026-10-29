import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DamageChips } from '../components/DamageChips'
import { EmptyState } from '../components/EmptyState'
import { MapView } from '../components/MapView'
import { Skeleton } from '../components/Skeleton'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatDateTime, formatTicket } from '../lib/format'
import { fetchReportByTicket } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { DAMAGE_TYPES } from '../lib/types'

export function ReportDetailPage() {
  const { ticketCode = '' } = useParams()
  const { user } = useAuth()
  const [activePhoto, setActivePhoto] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [repairLightbox, setRepairLightbox] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [previousTicket, setPreviousTicket] = useState(ticketCode)

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', ticketCode],
    queryFn: () => fetchReportByTicket(ticketCode),
  })

  usePageTitle(report?.ticketCode ?? 'Detail Laporan')

  if (previousTicket !== ticketCode) {
    setPreviousTicket(ticketCode)
    setActivePhoto(0)
    setLightbox(false)
    setRepairLightbox(null)
    setCopied(false)
  }

  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false)
      if (event.key === 'ArrowRight' && report) {
        setActivePhoto((current) => (current + 1) % report.photos.length)
      }
      if (event.key === 'ArrowLeft' && report) {
        setActivePhoto(
          (current) => (current - 1 + report.photos.length) % report.photos.length,
        )
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightbox, report])

  useEffect(() => {
    if (repairLightbox === null || !report) return
    const count = report.repairPhotos.length
    if (count === 0) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRepairLightbox(null)
      if (event.key === 'ArrowRight') {
        setRepairLightbox((current) => (current === null ? 0 : (current + 1) % count))
      }
      if (event.key === 'ArrowLeft') {
        setRepairLightbox((current) =>
          current === null ? 0 : (current - 1 + count) % count,
        )
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [repairLightbox, report])

  const isOwner = report !== undefined && report !== null && user?.id === report.citizenId
  const isPublic =
    report?.status === 'PROSES' || report?.status === 'DIPERBAIKI'
  const canView = isPublic || isOwner

  const handleCopy = async () => {
    if (!report) return
    try {
      await navigator.clipboard.writeText(formatTicket(report.ticketCode))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-margin lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-[360px] w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (!report || !canView) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-16">
        <EmptyState
          icon="visibility_off"
          title="Laporan Tidak Dapat Ditampilkan"
          description="Laporan ini belum dipublikasikan, telah ditarik, atau kode tiket yang Anda masukkan tidak ditemukan. Laporan hanya tampil untuk publik setelah diverifikasi Admin Kota."
          actionLabel="Kembali ke Daftar Laporan"
          actionTo="/laporan"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark text-on-primary pt-6 pb-16 px-margin lg:px-margin-desktop">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-caption text-caption text-on-primary/75"
          >
            <Link to="/" className="hover:text-on-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">home</span>
              Beranda
            </Link>
            <span className="text-on-primary/40">/</span>
            <Link to="/laporan" className="hover:text-on-primary transition-colors">
              Laporan
            </Link>
            <span className="text-on-primary/40">/</span>
            <span className="text-primary-fixed font-ticket text-ticket-code font-bold">
              {formatTicket(report.ticketCode)}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
            <div>
              <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary font-bold tracking-tight">
                Detail Laporan Jalan Rusak
              </h1>
              <p className="font-body-sm text-body-sm text-on-primary/80 mt-0.5">
                Informasi transparansi status penanganan kerusakan infrastruktur
                jalan kota
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-on-primary text-caption font-caption self-start sm:self-auto">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                {report.status === 'PROSES'
                  ? 'construction'
                  : report.status === 'DIPERBAIKI'
                    ? 'check_circle'
                    : report.status === 'PENDING'
                      ? 'schedule'
                      : 'visibility_off'}
              </span>
              <span>
                {report.status === 'PROSES'
                  ? 'Sedang Diproses'
                  : report.status === 'DIPERBAIKI'
                    ? 'Selesai Diperbaiki'
                    : report.status === 'PENDING'
                      ? 'Menunggu Verifikasi Admin'
                      : 'Tidak Dipublikasikan'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-margin lg:px-margin-desktop -mt-9 pb-16">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <article className="bg-surface-container-lowest rounded-xl shadow-card p-5 sm:p-8 flex flex-col gap-8">
            <header className="flex flex-wrap items-center justify-between gap-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-headline-lg text-[24px] sm:text-headline-lg font-bold text-secondary tracking-tight font-ticket select-all tabular-nums">
                  {formatTicket(report.ticketCode)}
                </span>
                <StatusBadge status={report.status} withIcon />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin!' : 'Salin Kode Tiket'}</span>
                </button>
              </div>
            </header>

            {!isPublic ? (
              <div
                className={cn(
                  'rounded-lg px-4 py-3 flex items-start gap-2.5',
                  report.status === 'PENDING' && 'bg-status-pending-soft',
                  report.status === 'DITOLAK' && 'bg-status-rejected-soft',
                  report.status === 'DITARIK' && 'bg-status-withdrawn-soft',
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[20px]',
                    report.status === 'PENDING' && 'text-status-pending',
                    report.status === 'DITOLAK' && 'text-status-rejected',
                    report.status === 'DITARIK' && 'text-status-withdrawn',
                  )}
                >
                  {report.status === 'PENDING'
                    ? 'schedule'
                    : report.status === 'DITOLAK'
                      ? 'cancel'
                      : 'undo'}
                </span>
                <div className="font-body-sm text-body-sm leading-relaxed">
                  <p
                    className={cn(
                      'font-semibold',
                      report.status === 'PENDING' && 'text-status-pending',
                      report.status === 'DITOLAK' && 'text-status-rejected',
                      report.status === 'DITARIK' && 'text-status-withdrawn',
                    )}
                  >
                    {report.status === 'PENDING' && 'Menunggu verifikasi Admin Kota'}
                    {report.status === 'DITOLAK' && 'Laporan ditolak'}
                    {report.status === 'DITARIK' && 'Laporan ditarik dari publikasi'}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5',
                      report.status === 'PENDING' && 'text-status-pending/90',
                      report.status === 'DITOLAK' && 'text-status-rejected/90',
                      report.status === 'DITARIK' && 'text-status-withdrawn/90',
                    )}
                  >
                    {report.status === 'PENDING' &&
                      'Laporan ini hanya dapat Anda lihat sendiri sampai Admin Kota menyetujuinya. Anda masih dapat mengubah data selama status masih menunggu.'}
                    {report.status === 'DITOLAK' &&
                      (report.rejectionReason ??
                        'Laporan tidak memenuhi syarat publikasi.')}
                    {report.status === 'DITARIK' &&
                      'Laporan ini tidak lagi tampil pada peta publik. Data tetap tersimpan untuk keperluan evaluasi Pemerintah Kota.'}
                  </p>
                  {isOwner && report.status === 'PENDING' ? (
                    <Link
                      to={`/laporan/${encodeURIComponent(report.ticketCode)}/edit`}
                      className="inline-flex items-center gap-1 mt-2 font-label-md text-label-md font-bold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Ubah laporan
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            <section className="flex flex-col gap-4">
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-surface-container group">
                <img
                  src={report.photos[activePhoto]}
                  alt={`Foto bukti ${activePhoto + 1} kerusakan jalan di ${report.alamat}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <button
                  type="button"
                  onClick={() => setLightbox(true)}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-on-surface/85 hover:bg-on-surface text-on-primary backdrop-blur-sm font-label-md text-label-md transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  <span className="hidden sm:inline">Perbesar Foto</span>
                </button>
                <div className="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-on-surface/75 text-on-primary backdrop-blur-sm font-caption text-caption">
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  <span>
                    Foto Bukti {activePhoto + 1} dari {report.photos.length}
                  </span>
                </div>
              </div>

              {report.photos.length > 1 ? (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {report.photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setActivePhoto(index)}
                      aria-label={`Lihat foto ${index + 1}`}
                      aria-pressed={index === activePhoto}
                      className={cn(
                        'relative w-24 sm:w-32 shrink-0 aspect-[4/3] rounded-md overflow-hidden transition-all',
                        index === activePhoto
                          ? 'ring-2 ring-primary'
                          : 'ring-1 ring-transparent hover:ring-primary/60 opacity-80 hover:opacity-100',
                      )}
                    >
                      <img
                        src={photo}
                        alt={`Miniatur foto ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                  <div className="text-on-surface-variant font-caption text-caption flex items-center gap-1 ml-2 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">touch_app</span>
                    <span className="hidden sm:inline">Pilih foto untuk melihat sudut lainnya</span>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-title text-title font-bold">
                    <span className="material-symbols-outlined text-[22px]">location_on</span>
                    <h2>Informasi Lokasi &amp; Kerusakan</h2>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-3 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                        Alamat Lengkap
                      </span>
                      <span className="font-body-md text-body-md text-on-surface font-semibold leading-snug break-words [overflow-wrap:anywhere]">
                        {report.alamat}
                      </span>
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=17/${report.latitude}/${report.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold hover:underline self-start"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Buka di OpenStreetMap
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                      Jenis Kerusakan
                    </span>
                    <DamageChips types={report.damageTypes} />
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {report.damageTypes
                        .map(
                          (type) =>
                            DAMAGE_TYPES.find((item) => item.value === type)?.description,
                        )
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary font-title text-title font-bold">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                    <h2>Deskripsi Laporan Warga</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                    {report.deskripsi}
                  </p>
                </div>

                {report.repairPhotos.length > 0 ? (
                  <div className="flex flex-col gap-3 rounded-lg bg-status-approved-soft/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-status-approved font-title text-title font-bold">
                        <span className="material-symbols-outlined text-[22px]">
                          check_circle
                        </span>
                        <h2>Dokumentasi Perbaikan</h2>
                      </div>
                      <span className="font-caption text-caption font-semibold text-status-approved shrink-0">
                        {report.repairPhotos.length} foto bukti
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Foto kondisi jalan setelah perbaikan selesai dilakukan oleh
                      instansi terkait.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {report.repairPhotos.map((photo, index) => (
                        <button
                          key={`${photo}-${index}`}
                          type="button"
                          onClick={() => setRepairLightbox(index)}
                          className="relative aspect-[4/3] rounded-md overflow-hidden bg-surface-container group"
                          aria-label={`Perbesar foto bukti perbaikan ${index + 1}`}
                        >
                          <img
                            src={photo}
                            alt={`Bukti perbaikan ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-on-surface/70 text-on-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">
                              zoom_in
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary font-title text-title font-bold">
                    <span className="material-symbols-outlined text-[22px]">map</span>
                    <h2>Peta Lokasi</h2>
                  </div>
                  <MapView reports={[report]} height={260} showRecenter={false} />
                </div>
              </div>

              <aside className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-3">
                  <span className="font-title text-title text-on-surface font-bold">
                    Informasi Pelaporan
                  </span>
                  <dl className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-body-sm text-body-sm text-on-surface-variant">
                        Dilaporkan oleh
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface font-semibold text-right">
                        {report.reporterNama}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-body-sm text-body-sm text-on-surface-variant">
                        Tanggal laporan
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface text-right">
                        {formatDateTime(report.createdAt)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-body-sm text-body-sm text-on-surface-variant">
                        Pembaruan terakhir
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface text-right">
                        {formatDateTime(report.updatedAt)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-body-sm text-body-sm text-on-surface-variant">
                        Jumlah foto
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface text-right">
                        {report.photos.length} foto
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-primary-soft p-4 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    <span className="font-title text-title font-bold">Catatan</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-surface-dark/90 leading-relaxed">
                    Laporan yang tampil di daftar publik telah diverifikasi Admin
                    Kota. Titik yang masih berstatus Proses tampil di peta, sedangkan
                    laporan yang selesai diperbaiki tetap dapat dilihat beserta bukti
                    perbaikannya.
                  </p>
                  <Link
                    to="/laporan"
                    className="mt-1 inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary hover:underline"
                  >
                    Lihat semua laporan
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                {isOwner ? (
                  <div className="border border-border-subtle rounded-lg p-4 flex flex-col gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      Ini laporan Anda
                    </span>
                    <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
                      {report.status === 'PENDING'
                        ? 'Anda dapat memperbarui data laporan selama masih menunggu verifikasi.'
                        : 'Laporan yang sudah diverifikasi tidak dapat diubah oleh warga.'}
                    </p>
                    {report.status === 'PENDING' ? (
                      <Link
                        to={`/laporan/${encodeURIComponent(report.ticketCode)}/edit`}
                        className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-md bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-hover transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Ubah Laporan
                      </Link>
                    ) : null}
                    <Link
                      to="/laporan/saya"
                      className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-md border border-border-strong text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      Laporan Saya
                    </Link>
                  </div>
                ) : null}
              </aside>
            </div>

            <footer className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
              <p className="font-caption text-caption text-on-surface-variant">
                Terakhir diperbarui {formatDate(report.updatedAt)}
              </p>
              <Link
                to="/laporan"
                className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke daftar laporan
              </Link>
            </footer>
          </article>
        </div>
      </section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[70] bg-on-surface/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
        >
          <div className="flex items-center justify-between p-4 text-on-primary">
            <span className="font-label-md text-label-md">
              Foto {activePhoto + 1} dari {report.photos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="w-10 h-10 rounded-md hover:bg-white/10 flex items-center justify-center"
              aria-label="Tutup pratinjau"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-6 relative">
            <img
              src={report.photos[activePhoto]}
              alt={`Foto bukti ${activePhoto + 1}`}
              className="max-h-full max-w-full object-contain rounded-md"
            />
            {report.photos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhoto(
                      (current) =>
                        (current - 1 + report.photos.length) % report.photos.length,
                    )
                  }
                  className="absolute left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-on-primary flex items-center justify-center"
                  aria-label="Foto sebelumnya"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhoto((current) => (current + 1) % report.photos.length)
                  }
                  className="absolute right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-on-primary flex items-center justify-center"
                  aria-label="Foto berikutnya"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {repairLightbox !== null ? (
        <div
          className="fixed inset-0 z-[70] bg-on-surface/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto bukti perbaikan"
        >
          <div className="flex items-center justify-between p-4 text-on-primary">
            <span className="font-label-md text-label-md">
              Foto bukti perbaikan {repairLightbox + 1} dari{' '}
              {report.repairPhotos.length}
            </span>
            <button
              type="button"
              onClick={() => setRepairLightbox(null)}
              className="w-10 h-10 rounded-md hover:bg-white/10 flex items-center justify-center"
              aria-label="Tutup pratinjau"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-6 relative">
            <img
              src={report.repairPhotos[repairLightbox]}
              alt={`Bukti perbaikan ${repairLightbox + 1}`}
              className="max-h-full max-w-full object-contain rounded-md"
            />
            {report.repairPhotos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setRepairLightbox(
                      (current) =>
                        current === null
                          ? 0
                          : (current - 1 + report.repairPhotos.length) %
                            report.repairPhotos.length,
                    )
                  }
                  className="absolute left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-on-primary flex items-center justify-center"
                  aria-label="Foto sebelumnya"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRepairLightbox((current) =>
                      current === null
                        ? 0
                        : (current + 1) % report.repairPhotos.length,
                    )
                  }
                  className="absolute right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-on-primary flex items-center justify-center"
                  aria-label="Foto berikutnya"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
