const MAX_DIMENSION = 1440
const TARGET_QUALITY = 0.72

export interface ValidatedFile {
  file: File
  error?: string
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function validatePhoto(file: File): string | null {
  if (!ALLOWED.includes(file.type)) {
    return 'Format harus JPG, PNG, atau WebP.'
  }
  if (file.size > MAX_BYTES) {
    return 'Ukuran foto maksimal 5 MB.'
  }
  return null
}

/**
 * Kompresi di sisi klien supaya unggahan ringan.
 * Menghasilkan data URL JPEG dengan sisi terpanjang maksimal 1440 px.
 */
export function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca berkas foto.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Berkas bukan gambar yang valid.'))
      image.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
        const width = Math.round(image.width * scale)
        const height = Math.round(image.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Peramban tidak mendukung pemrosesan gambar.'))
          return
        }

        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', TARGET_QUALITY))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
