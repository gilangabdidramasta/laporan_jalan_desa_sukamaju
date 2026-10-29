import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  NEWS_UPLOAD_DIR,
  REPORT_UPLOAD_DIR,
  UPLOAD_ROOT,
} from './paths.js'

/**
 * Penyimpanan foto.
 *
 * - Bila BLOB_READ_WRITE_TOKEN diisi -> Vercel Blob (URL absolut).
 * - Bila tidak                      -> disk lokal (dev / Railway volume).
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
export const USING_BLOB = Boolean(BLOB_TOKEN)
const IS_VERCEL = Boolean(process.env.VERCEL)

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const LOCAL_PATH_RE = /^\/uploads\/(reports|news)\/[\w.-]+$/
const REMOTE_URL_RE = /^https?:\/\/\S+$/

let blobModule = null
async function blob() {
  if (!blobModule) blobModule = await import('@vercel/blob')
  return blobModule
}

export function isManagedPhoto(value) {
  if (typeof value !== 'string') return false
  const raw = value.trim()
  return LOCAL_PATH_RE.test(raw) || REMOTE_URL_RE.test(raw)
}

function invalidPhoto(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

/**
 * Menerima data URL hasil kompresi di peramban atau path/URL yang sudah ada.
 * Mengembalikan path lokal atau URL publik.
 */
export async function persistPhoto(value, kind = 'reports') {
  const raw = String(value ?? '').trim()
  if (!raw) throw invalidPhoto('Foto tidak valid.')

  if (isManagedPhoto(raw)) return raw

  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(raw)
  if (!match) throw invalidPhoto('Format foto harus JPG, PNG, atau WebP.')

  const [, extension, base64] = match
  const buffer = Buffer.from(base64.replace(/\s+/g, ''), 'base64')
  if (buffer.length === 0) throw invalidPhoto('Foto tidak valid.')
  if (buffer.length > MAX_PHOTO_BYTES) {
    throw invalidPhoto('Ukuran foto maksimal 5 MB.', 413)
  }

  const ext = extension.toLowerCase() === 'jpeg' ? 'jpg' : extension.toLowerCase()
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  const folder = kind === 'news' ? 'news' : 'reports'
  const name = `${Date.now()}-${randomUUID()}.${ext}`

  if (USING_BLOB) {
    const { put } = await blob()
    const result = await put(`uploads/${folder}/${name}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    })
    return result.url
  }

  const dir = folder === 'news' ? NEWS_UPLOAD_DIR : REPORT_UPLOAD_DIR
  if (IS_VERCEL) {
    throw invalidPhoto(
      'Penyimpanan foto belum dikonfigurasi. Hubungkan Vercel Blob (BLOB_READ_WRITE_TOKEN).',
      500,
    )
  }
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, name), buffer)
  return `/uploads/${folder}/${name}`
}

export async function persistPhotos(list, kind = 'reports') {
  if (!Array.isArray(list)) throw new Error('Foto tidak valid.')
  const results = []
  for (const item of list) {
    results.push(await persistPhoto(item, kind))
  }
  return results
}

export async function removeUploadedFiles(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return

  const remote = []
  for (const item of paths) {
    if (typeof item !== 'string') continue

    if (item.startsWith('/uploads/')) {
      const target = path.resolve(UPLOAD_ROOT, `.${item.replace('/uploads', '')}`)
      if (!target.startsWith(UPLOAD_ROOT)) continue
      try {
        fs.unlinkSync(target)
      } catch {
        /* berkas mungkin sudah dihapus */
      }
      continue
    }

    if (REMOTE_URL_RE.test(item)) remote.push(item)
  }

  if (remote.length > 0 && USING_BLOB) {
    try {
      const { del } = await blob()
      await del(remote, { token: BLOB_TOKEN })
    } catch (error) {
      console.warn('[storage] gagal menghapus berkas Blob:', error?.message ?? error)
    }
  }
}
