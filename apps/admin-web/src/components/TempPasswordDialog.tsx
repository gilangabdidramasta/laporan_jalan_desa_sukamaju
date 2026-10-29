import { useState } from 'react'
import { ActionDialog } from './ActionDialog'

export function TempPasswordDialog({
  open,
  password,
  targetName,
  onClose,
}: {
  open: boolean
  password: string | null
  targetName: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  return (
    <ActionDialog
      open={open}
      title="Password sementara"
      description={`Password baru untuk ${targetName}. Sampaikan kepada yang bersangkutan melalui kanal resmi.`}
      confirmLabel="Selesai"
      cancelLabel="Tutup"
      onClose={() => {
        setCopied(false)
        onClose()
      }}
      onConfirm={() => {
        setCopied(false)
        onClose()
      }}
    >
      <div className="rounded-lg bg-surface-container-low p-4 flex items-center justify-between gap-3">
        <span className="font-ticket text-[20px] font-bold text-on-surface select-all tabular-nums">
          {password}
        </span>
        <button
          type="button"
          onClick={async () => {
            if (!password) return
            try {
              await navigator.clipboard.writeText(password)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            } catch {
              setCopied(false)
            }
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-surface-container-lowest border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <div className="flex items-start gap-2 rounded-md bg-status-pending-soft px-3 py-2.5 text-status-pending">
        <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
        <p className="font-caption text-caption font-semibold leading-relaxed">
          Password hanya ditampilkan satu kali. Setelah dialog ditutup, password
          tidak dapat dilihat kembali.
        </p>
      </div>
    </ActionDialog>
  )
}
