import bcrypt from 'bcryptjs'

/**
 * Fasad akses basis data.
 *
 * - Bila TURSO_DATABASE_URL diisi  -> backend Turso (libSQL), dipakai di Vercel.
 * - Bila tidak                      -> backend SQLite lokal (dev / Railway).
 *
 * Semua fungsi async, sehingga kode route identik untuk kedua backend.
 */

export const USES_TURSO = Boolean(process.env.TURSO_DATABASE_URL)

if (!USES_TURSO && process.env.VERCEL) {
  throw new Error(
    'TURSO_DATABASE_URL belum diisi. Vercel tidak menyediakan disk permanen, ' +
      'jadi basis data SQLite lokal tidak dapat dipakai di sana.',
  )
}

const backend = USES_TURSO
  ? await import('./db/turso.js')
  : await import('./db/local.js')

export const DB_DRIVER = backend.driver

export const all = (sql, params = []) => backend.all(sql, params)
export const one = (sql, params = []) => backend.one(sql, params)
export const run = (sql, params = []) => backend.run(sql, params)
export const transaction = (fn) => backend.transaction(fn)

export {
  API_ROOT,
  DATA_DIR,
  NEWS_UPLOAD_DIR,
  REPORT_UPLOAD_DIR,
  STORAGE_ROOT,
  UPLOAD_ROOT,
} from './paths.js'

/**
 * Satu-satunya akun yang dibuat otomatis saat basis data masih kosong.
 * Akun Admin dibuat oleh Super Admin melalui dashboard (menu Akun Admin)
 * atau lewat perintah `npm run create-admin`.
 */
export async function seedSuperAdmin() {
  const existing = await one('SELECT id FROM admins LIMIT 1')
  if (existing) return

  const email = (process.env.SUPERADMIN_EMAIL ?? 'superadmin@pekanbaru.go.id').toLowerCase()
  const password = process.env.SUPERADMIN_PASSWORD ?? 'super12345'
  const now = new Date().toISOString()

  await run(
    `INSERT INTO admins (nama, email, password_hash, role, status, created_at)
     VALUES (?, ?, ?, 'SUPER_ADMIN', 'AKTIF', ?)`,
    ['Super Admin Kota', email, bcrypt.hashSync(password, 10), now],
  )

  console.log(`[seed] Akun Super Admin dibuat: ${email}`)
}

await backend.init()
await seedSuperAdmin()
