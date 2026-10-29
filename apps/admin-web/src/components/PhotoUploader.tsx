import { useRef, useState, type DragEvent } from 'react'
import { cn } from '../lib/format'
import { compressPhoto, validatePhoto } from '../lib/image'

const MAX_PHOTOS = 3

export function PhotoUploader({
  photos,
  onChange,
  label = 'Foto Kerusakan',
  hint = 'Unggah 1–3 foto yang jelas. Maksimal 5 MB per foto, otomatis dikompresi oleh sistem.',
}: {
  photos: string[]
  onChange: (photos: string[]) => void
  label?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const remaining = MAX_PHOTOS - photos.length

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return

    setError(null)

    if (list.length > remaining) {
      setError(
        `Maksimal ${MAX_PHOTOS} foto per laporan. Sisa slot: ${remaining}.`,
      )
      return
    }

    for (const file of list) {
      const message = validatePhoto(file)
      if (message) {
        setError(message)
        return
      }
    }

    setBusy(true)
    try {
      const results: string[] = []
      for (const file of list) {
        results.push(await compressPhoto(file))
      }
      onChange([...photos, ...results].slice(0, MAX_PHOTOS))
    } catch {
      setError('Foto gagal diproses. Silakan coba berkas lain.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, position) => position !== index))
    setError(null)
  }

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-baseline justify-between">
        <span className="font-label-md text-label-md font-bold text-on-surface">
          {label} <span className="text-tertiary">*</span>
        </span>
        <span className="font-caption text-caption text-on-surface-variant">
          {photos.length} / {MAX_PHOTOS} foto
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm">
        {photos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-surface-container group"
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-on-surface/75 text-on-primary font-caption text-[11px]">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-on-surface/80 text-on-primary flex items-center justify-center hover:bg-status-rejected transition-colors"
              aria-label={`Hapus foto ${index + 1}`}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}

        {remaining > 0 ? (
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-2 transition-colors',
              dragging
                ? 'border-primary bg-primary-soft/60'
                : 'border-border-strong bg-surface-container-low hover:border-primary hover:bg-primary-soft/30',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) void handleFiles(event.target.files)
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex flex-col items-center justify-center gap-1 w-full h-full"
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[28px]',
                  busy ? 'text-on-surface-variant animate-pulse' : 'text-primary',
                )}
              >
                {busy ? 'hourglass_top' : 'add_a_photo'}
              </span>
              <span className="font-caption text-caption text-on-surface font-semibold">
                {busy ? 'Memproses…' : 'Tambah Foto'}
              </span>
              <span className="font-caption text-[11px] text-on-surface-variant">
                JPG, PNG, WebP
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-start gap-1.5 text-status-rejected">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
            warning
          </span>
          <p className="font-caption text-caption font-semibold">{error}</p>
        </div>
      ) : (
        <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  )
}
