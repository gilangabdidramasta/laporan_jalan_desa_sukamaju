import { useEffect, useState } from 'react'

export function PhotoGallery({
  photos,
  alt = 'Foto laporan',
  height = 380,
}: {
  photos: string[]
  alt?: string
  height?: number
}) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') {
        setActive((current) => (current + 1) % photos.length)
      }
      if (event.key === 'ArrowLeft') {
        setActive((current) =>
          current === 0 ? photos.length - 1 : current - 1,
        )
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, photos.length])

  if (photos.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant"
        style={{ height }}
      >
        <span className="material-symbols-outlined text-[40px]">no_photography</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-lg overflow-hidden bg-surface-container group"
        style={{ height }}
        aria-label="Perbesar foto"
      >
        <img
          src={photos[active]}
          alt={`${alt} ${active + 1}`}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-on-surface/70 px-2.5 py-1 font-caption text-caption text-on-primary">
          <span className="material-symbols-outlined text-[15px]">zoom_in</span>
          {active + 1} / {photos.length}
        </span>
      </button>

      {photos.length > 1 ? (
        <div className="flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`w-20 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                index === active ? 'border-primary' : 'border-transparent'
              }`}
              aria-label={`Lihat foto ${index + 1}`}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-label="Tutup foto"
          />
          <img
            src={photos[active]}
            alt={`${alt} ${active + 1}`}
            className="relative max-w-full max-h-[85vh] object-contain rounded-md"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setActive((current) =>
                    current === 0 ? photos.length - 1 : current - 1,
                  )
                }
                className="absolute left-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
                aria-label="Foto sebelumnya"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActive((current) => (current + 1) % photos.length)
                }
                className="absolute right-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
                aria-label="Foto berikutnya"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
