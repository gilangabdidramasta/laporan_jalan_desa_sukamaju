import { all, one } from './db.js'
import {
  MAX_PHOTO_BYTES,
  persistPhoto,
  persistPhotos,
  removeUploadedFiles,
} from './storage.js'

export {
  MAX_PHOTO_BYTES,
  persistPhoto,
  persistPhotos,
  removeUploadedFiles,
}

export const DAMAGE_TYPES = [
  'LUBANG',
  'RETAK',
  'AMBLAS',
  'BERGELOMBANG',
  'MENGELUPAS',
  'TERGENANG',
]

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export function assert(condition, status, message) {
  if (!condition) throw httpError(status, message)
}

export function isoNow() {
  return new Date().toISOString()
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D+/g, '')
}

export function isEmail(value) {
  return EMAIL_RE.test(value)
}

export function parsePaging(query, defaultPerPage = 20, maxPerPage = 200) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const perPage = Math.min(
    maxPerPage,
    Math.max(1, Number.parseInt(String(query.perPage ?? defaultPerPage), 10) || defaultPerPage),
  )
  return { page, perPage }
}

export function paginate(items, page, perPage) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  }
}

/* --------------------------------- Akun ---------------------------------- */

export function adminPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    nama: row.nama,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    ...(row.last_login_at ? { lastLoginAt: row.last_login_at } : {}),
  }
}

export function citizenPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    nama: row.nama,
    email: row.email,
    noWa: row.no_wa,
    status: row.status,
    createdAt: row.created_at,
  }
}

/* -------------------------------- Laporan -------------------------------- */

export async function photosByReport(reportIds) {
  const map = new Map()
  if (reportIds.length === 0) return map
  const placeholders = reportIds.map(() => '?').join(',')
  const rows = await all(
    `SELECT report_id, path FROM report_photos
     WHERE report_id IN (${placeholders})
     ORDER BY position ASC, id ASC`,
    reportIds,
  )
  for (const row of rows) {
    const list = map.get(row.report_id) ?? []
    list.push(row.path)
    map.set(row.report_id, list)
  }
  return map
}

export async function repairPhotosByReport(reportIds) {
  const map = new Map()
  if (reportIds.length === 0) return map
  const placeholders = reportIds.map(() => '?').join(',')
  const rows = await all(
    `SELECT report_id, path FROM report_repair_photos
     WHERE report_id IN (${placeholders})
     ORDER BY position ASC, id ASC`,
    reportIds,
  )
  for (const row of rows) {
    const list = map.get(row.report_id) ?? []
    list.push(row.path)
    map.set(row.report_id, list)
  }
  return map
}

export function mapReport(row, photos = [], repairPhotos = []) {
  const report = {
    id: row.id,
    ticketCode: row.ticket_code,
    citizenId: row.citizen_id,
    alamat: row.alamat,
    latitude: row.latitude,
    longitude: row.longitude,
    deskripsi: row.deskripsi,
    damageTypes: JSON.parse(row.damage_types),
    photos,
    repairPhotos,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (row.rejection_reason) report.rejectionReason = row.rejection_reason
  return report
}

export function mapLog(row) {
  return {
    id: row.id,
    reportId: row.report_id,
    actorNama: row.actor_nama,
    actorRole: row.actor_role,
    action: row.action,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    ...(row.note ? { note: row.note } : {}),
    ...(row.changes ? { changes: JSON.parse(row.changes) } : {}),
    createdAt: row.created_at,
  }
}

/**
 * Kode tiket berurutan per hari. Menerima `tx` supaya pembacaan ikut berada
 * di dalam transaksi yang sama saat backend Turso dipakai.
 */
export async function nextTicketCode(tx, date = new Date()) {
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`
  const prefix = `RPT-${day}-`
  const rows = await tx.all('SELECT ticket_code FROM reports WHERE ticket_code LIKE ?', [
    `${prefix}%`,
  ])
  let highest = 0
  for (const row of rows) {
    const sequence = Number.parseInt(String(row.ticket_code).slice(prefix.length), 10)
    if (Number.isFinite(sequence)) highest = Math.max(highest, sequence)
  }
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

export function normalizeDamageTypes(value) {
  assert(Array.isArray(value), 400, 'Jenis kerusakan tidak valid.')
  const unique = [...new Set(value.map((item) => String(item).toUpperCase()))]
  assert(unique.length > 0, 400, 'Pilih minimal satu jenis kerusakan.')
  for (const item of unique) {
    assert(DAMAGE_TYPES.includes(item), 400, 'Jenis kerusakan tidak dikenal.')
  }
  return unique
}

export function normalizeCoordinates(body) {
  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)
  assert(
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90,
    400,
    'Titik lokasi pada peta wajib dipilih.',
  )
  assert(
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180,
    400,
    'Titik lokasi pada peta wajib dipilih.',
  )
  return { latitude, longitude }
}

/* --------------------------------- Berita -------------------------------- */

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function isSlugTaken(slug, exceptId) {
  const row = exceptId
    ? await one('SELECT id FROM news WHERE slug = ? AND id <> ?', [slug, exceptId])
    : await one('SELECT id FROM news WHERE slug = ?', [slug])
  return Boolean(row)
}

export async function uniqueSlug(base, exceptId) {
  const safeBase = slugify(base) || 'berita'
  let candidate = safeBase
  let counter = 2
  while (await isSlugTaken(candidate, exceptId)) {
    candidate = `${safeBase}-${counter}`
    counter += 1
  }
  return candidate
}

export function mapNews(row) {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    ringkasan: row.ringkasan,
    isi: row.isi,
    cover: row.cover,
    status: row.status,
    authorNama: row.author_nama,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}
