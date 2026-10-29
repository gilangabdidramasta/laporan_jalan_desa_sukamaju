import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReportForm } from '../components/ReportForm'
import { useAuth } from '../lib/auth'
import { formatTicket } from '../lib/format'
import { countTodayReports, createReport } from '../lib/store'
import type { Report, ReportDraft } from '../lib/types'

const DAILY_LIMIT = 10

export function NewReportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [created, setCreated] = useState<Report | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: todayCount = 0 } = useQuery({
    queryKey: ['today-count', user?.id],
    queryFn: () => countTodayReports(user!.id),
    enabled: Boolean(user),
  })

  const mutation = useMutation({
    mutationFn: (draft: ReportDraft) => createReport(user!.id, draft),
    onSuccess: (report) => {
      setCreated(report)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  })

  if (created) {
    return (
      <div className="w-full bg-background py-12 lg:py-16">
        <div className="max-w-[640px] mx-auto px-margin">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 sm:p-10 flex flex-col items-center text-center gap-space-md">
            <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center text-status-approved">
              <span className="material-symbols-outlined text-[44px]">
                check_circle
              </span>
            </div>
            <div>
              <h1 className="font-heading text-[26px] sm:text-[30px] text-on-surface font-bold leading-tight">
                Laporan Berhasil Dikirim
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Terima kasih, {user?.nama.split(' ')[0]}. Laporan Anda kini
                menunggu verifikasi Admin Kota sebelum tampil di peta publik.
              </p>
            </div>

            <div className="w-full rounded-lg bg-surface-container-low p-4 flex flex-col items-center gap-2">
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                Kode Tiket Laporan
              </span>
              <span className="font-ticket text-[24px] leading-8 font-bold text-secondary tabular-nums select-all">
                {formatTicket(created.ticketCode)}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(formatTicket(created.ticketCode))
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 2000)
                  } catch {
                    setCopied(false)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-lowest hover:bg-surface-container text-on-surface font-caption text-caption font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Tersalin!' : 'Salin kode tiket'}
              </button>
              <p className="font-caption text-caption text-on-surface-variant text-center">
                Simpan kode ini untuk memantau status laporan Anda.
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => navigate(`/laporan/${encodeURIComponent(created.ticketCode)}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-md bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-hover transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>
                Lihat Laporan
              </button>
              <Link
                to="/laporan/saya"
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-md border border-border-strong text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  folder_open
                </span>
                Laporan Saya
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (todayCount >= DAILY_LIMIT) {
    return (
      <div className="w-full bg-background py-12">
        <div className="max-w-[640px] mx-auto px-margin">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 flex flex-col items-center text-center gap-space-md">
            <div className="w-16 h-16 rounded-full bg-status-pending-soft text-status-pending flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">hourglass</span>
            </div>
            <h1 className="font-heading text-[24px] text-on-surface font-bold">
              Batas Laporan Harian Tercapai
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Anda telah mengirim {DAILY_LIMIT} laporan hari ini. Silakan coba lagi
              besok atau hubungi kantor Pemerintah Kota bila ada kebutuhan mendesak.
            </p>
            <Link
              to="/laporan/saya"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-md bg-primary text-on-primary font-label-md text-label-md font-bold"
            >
              Lihat Laporan Saya
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {todayCount > 0 ? (
        <div className="max-w-[840px] mx-auto px-margin pt-6">
          <div className="rounded-lg bg-surface-container-low px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              info
            </span>
            <p className="font-caption text-caption text-on-surface-variant">
              Anda sudah mengirim {todayCount} laporan hari ini. Sisa kuota:{' '}
              {DAILY_LIMIT - todayCount} laporan.
            </p>
          </div>
        </div>
      ) : null}
      <ReportForm
        mode="create"
        onSubmit={async (draft) => {
          await mutation.mutateAsync(draft)
        }}
        submitting={mutation.isPending}
        submitError={mutation.error instanceof Error ? mutation.error.message : null}
      />
    </>
  )
}
