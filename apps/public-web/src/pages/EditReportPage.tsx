import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ReportForm } from '../components/ReportForm'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../lib/auth'
import { fetchReportByTicket, updateReport } from '../lib/store'
import type { ReportDraft } from '../lib/types'

export function EditReportPage() {
  const { ticketCode = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', ticketCode],
    queryFn: () => fetchReportByTicket(ticketCode),
  })

  const mutation = useMutation({
    mutationFn: (draft: ReportDraft) =>
      updateReport(report!.id, user!.id, draft),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['report', ticketCode] })
      void queryClient.invalidateQueries({ queryKey: ['my-reports'] })
      void queryClient.invalidateQueries({ queryKey: ['public-reports'] })
      navigate(`/laporan/${encodeURIComponent(updated.ticketCode)}`)
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-[840px] mx-auto px-margin py-space-xl flex flex-col gap-space-md">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-16">
        <EmptyState
          icon="search_off"
          title="Laporan Tidak Ditemukan"
          description="Kode tiket tidak dikenali atau laporan sudah tidak tersedia."
          actionLabel="Kembali ke Laporan Saya"
          actionTo="/laporan/saya"
        />
      </div>
    )
  }

  const isOwner = report.citizenId === user?.id

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-16">
        <EmptyState
          icon="lock"
          title="Bukan Laporan Anda"
          description="Anda hanya dapat mengubah laporan yang Anda kirim sendiri."
          actionLabel="Kembali ke Laporan Saya"
          actionTo="/laporan/saya"
        />
      </div>
    )
  }

  if (report.status !== 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto px-margin py-16">
        <EmptyState
          icon="lock_clock"
          title="Laporan Tidak Dapat Diubah"
          description="Laporan sudah diverifikasi Admin Kota. Perubahan hanya dapat dilakukan selama status masih menunggu verifikasi."
          actionLabel="Lihat Detail Laporan"
          actionTo={`/laporan/${encodeURIComponent(report.ticketCode)}`}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="max-w-[840px] mx-auto px-margin pt-6 w-full">
        <Link
          to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
          className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke detail laporan
        </Link>
      </div>
      <ReportForm
        mode="edit"
        initial={{
          photos: report.photos,
          alamat: report.alamat,
          latitude: report.latitude,
          longitude: report.longitude,
          damageTypes: report.damageTypes,
          deskripsi: report.deskripsi,
        }}
        onSubmit={async (draft) => {
          await mutation.mutateAsync(draft)
        }}
        submitting={mutation.isPending}
        submitError={mutation.error instanceof Error ? mutation.error.message : null}
      />
    </div>
  )
}
