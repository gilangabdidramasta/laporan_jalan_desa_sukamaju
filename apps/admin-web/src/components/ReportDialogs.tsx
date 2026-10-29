import { useEffect, useState } from 'react'
import { ActionDialog } from './ActionDialog'
import { PhotoUploader } from './PhotoUploader'
import { formatTicket } from '../lib/format'

const QUICK_REASONS = [
  'Foto tidak jelas',
  'Bukan jalan rusak',
  'Duplikat',
  'Lokasi tidak valid',
]

export function ApproveReportDialog({
  open,
  ticketCode,
  mode,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticketCode: string
  mode: 'approve' | 'republish'
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  return (
    <ActionDialog
      open={open}
      title={mode === 'approve' ? 'Setujui laporan?' : 'Publikasikan ulang laporan?'}
      description={`Laporan ${formatTicket(ticketCode)} akan masuk status Proses dan tampil di peta serta daftar laporan publik.`}
      confirmLabel={mode === 'approve' ? 'Setujui & Proses' : 'Publikasikan Ulang'}
      loading={submitting}
      onClose={onClose}
      onConfirm={async () => {
        setSubmitting(true)
        setError(null)
        try {
          await onConfirm()
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Aksi gagal.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      {error ? (
        <p className="font-caption text-caption font-semibold text-status-rejected">
          {error}
        </p>
      ) : null}
    </ActionDialog>
  )
}

export function CompleteReportDialog({
  open,
  ticketCode,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticketCode: string
  onClose: () => void
  onConfirm: (photos: string[]) => Promise<void>
}) {
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <ActionDialog
      open={open}
      title="Tandai laporan selesai diperbaiki?"
      description={`Laporan ${formatTicket(ticketCode)} akan berubah ke status Diperbaiki dan hilang dari peta sebaran, tetapi tetap tampil di daftar serta detail laporan publik.`}
      confirmLabel="Tandai Diperbaiki"
      loading={submitting}
      confirmDisabled={photos.length !== 3}
      onClose={onClose}
      onConfirm={async () => {
        setSubmitting(true)
        setError(null)
        try {
          await onConfirm(photos)
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Aksi gagal.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <PhotoUploader
        photos={photos}
        onChange={setPhotos}
        label="Foto Bukti Perbaikan"
        hint="Wajib unggah tepat 3 foto kondisi jalan setelah diperbaiki. Maksimal 5 MB per foto, otomatis dikompresi oleh sistem."
      />
      {error ? (
        <p className="font-caption text-caption font-semibold text-status-rejected">
          {error}
        </p>
      ) : null}
    </ActionDialog>
  )
}

export function RejectReportDialog({
  open,
  ticketCode,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticketCode: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const tooShort = reason.trim().length > 0 && reason.trim().length < 10

  return (
    <ActionDialog
      open={open}
      title={`Tolak laporan ${formatTicket(ticketCode)}`}
      description="Alasan penolakan akan ditampilkan kepada pelapor pada halaman Laporan Saya."
      confirmLabel="Tolak Laporan"
      variant="danger"
      loading={submitting}
      confirmDisabled={reason.trim().length < 10}
      onClose={onClose}
      onConfirm={async () => {
        setSubmitting(true)
        setError(null)
        try {
          await onConfirm(reason.trim())
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Aksi gagal.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setReason(item)}
            className="px-2.5 py-1 rounded-full border border-border-strong font-caption text-caption text-on-surface hover:border-primary hover:bg-primary-soft/40 transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-bold text-on-surface">
          Alasan penolakan <span className="text-tertiary">*</span>
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          placeholder="Jelaskan alasan penolakan secara jelas (minimal 10 karakter)."
          className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
        />
        <span className="font-caption text-caption text-on-surface-variant">
          {reason.trim().length} / minimal 10 karakter
          {tooShort ? ' — masih kurang' : ''}
        </span>
      </label>

      {error ? (
        <p className="font-caption text-caption font-semibold text-status-rejected">
          {error}
        </p>
      ) : null}
    </ActionDialog>
  )
}

export function WithdrawReportDialog({
  open,
  ticketCode,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticketCode: string
  onClose: () => void
  onConfirm: (note: string) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNote('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  return (
    <ActionDialog
      open={open}
      title={`Tarik laporan ${formatTicket(ticketCode)}?`}
      description="Laporan akan hilang dari peta dan daftar publik. Data tetap tersimpan dan dapat dipublikasikan ulang."
      confirmLabel="Tarik Laporan"
      variant="danger"
      loading={submitting}
      onClose={onClose}
      onConfirm={async () => {
        setSubmitting(true)
        setError(null)
        try {
          await onConfirm(note.trim())
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Aksi gagal.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-bold text-on-surface">
          Catatan internal <span className="text-on-surface-variant font-normal">(opsional)</span>
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Catatan ini hanya terlihat oleh admin."
          className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
        />
      </label>

      {error ? (
        <p className="font-caption text-caption font-semibold text-status-rejected">
          {error}
        </p>
      ) : null}
    </ActionDialog>
  )
}

export function DeleteReportDialog({
  open,
  ticketCode,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticketCode: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  return (
    <ActionDialog
      open={open}
      title="Hapus laporan permanen"
      description={`Laporan ${formatTicket(ticketCode)} beserta seluruh fotonya akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
      confirmLabel="Hapus Permanen"
      variant="danger"
      loading={submitting}
      confirmDisabled={text.trim().toUpperCase() !== 'HAPUS'}
      onClose={onClose}
      onConfirm={async () => {
        setSubmitting(true)
        setError(null)
        try {
          await onConfirm()
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Aksi gagal.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-body-sm text-body-sm text-on-surface">
          Ketik <strong>HAPUS</strong> untuk mengaktifkan tombol penghapusan.
        </span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="HAPUS"
          className="h-10 rounded-md border border-border-strong bg-surface-container-lowest px-3 font-body-sm text-body-sm outline-none focus:border-status-rejected focus:ring-2 focus:ring-status-rejected/15"
        />
      </label>

      {error ? (
        <p className="font-caption text-caption font-semibold text-status-rejected">
          {error}
        </p>
      ) : null}
    </ActionDialog>
  )
}
