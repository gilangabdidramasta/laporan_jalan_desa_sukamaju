import jwt from 'jsonwebtoken'
import { one } from './db.js'
import { httpError } from './helpers.js'

const SECRET = process.env.JWT_SECRET ?? 'lapor-pekanbaru-dev-secret-ganti-di-produksi'
const CITIZEN_TTL = '7d'
const ADMIN_TTL = '12h'

export function signCitizenToken(citizen) {
  return jwt.sign({ sub: String(citizen.id), type: 'citizen' }, SECRET, {
    expiresIn: CITIZEN_TTL,
  })
}

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: String(admin.id), type: 'admin', role: admin.role },
    SECRET,
    { expiresIn: ADMIN_TTL },
  )
}

function readPayload(req) {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) return null
  try {
    return jwt.verify(header.slice(7).trim(), SECRET)
  } catch {
    return null
  }
}

/**
 * Express 4 tidak menangkap promise yang reject dari middleware async,
 * jadi setiap middleware membungkus dirinya sendiri dengan try/catch.
 */
export async function citizenOnly(req, _res, next) {
  try {
    const payload = readPayload(req)
    if (!payload || payload.type !== 'citizen') {
      return next(httpError(401, 'Sesi Anda berakhir. Silakan masuk kembali.'))
    }
    const citizen = await one('SELECT * FROM citizens WHERE id = ?', [Number(payload.sub)])
    if (!citizen) {
      return next(httpError(401, 'Sesi Anda berakhir. Silakan masuk kembali.'))
    }
    if (citizen.status === 'NONAKTIF') {
      return next(httpError(403, 'Akun Anda dinonaktifkan. Hubungi Admin Kota.'))
    }
    req.citizen = citizen
    return next()
  } catch (error) {
    return next(error)
  }
}

export async function adminOnly(req, _res, next) {
  try {
    const payload = readPayload(req)
    if (!payload || payload.type !== 'admin') {
      return next(httpError(401, 'Sesi Anda berakhir. Silakan masuk kembali.'))
    }
    const admin = await one('SELECT * FROM admins WHERE id = ?', [Number(payload.sub)])
    if (!admin) {
      return next(httpError(401, 'Sesi Anda berakhir. Silakan masuk kembali.'))
    }
    if (admin.status === 'NONAKTIF') {
      return next(httpError(403, 'Akun Anda dinonaktifkan. Hubungi Super Admin.'))
    }
    req.admin = admin
    return next()
  } catch (error) {
    return next(error)
  }
}

/** Hanya ADMIN yang boleh mengubah laporan, berita, dan akun warga. */
export function writerOnly(req, _res, next) {
  if (req.admin?.role !== 'ADMIN') {
    return next(
      httpError(403, 'Mode baca saja. Hanya akun Admin yang dapat mengubah data ini.'),
    )
  }
  return next()
}

/** Modul Akun Admin hanya untuk SUPER_ADMIN. */
export function superAdminOnly(req, _res, next) {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    return next(httpError(403, 'Halaman ini hanya dapat diakses oleh Super Admin.'))
  }
  return next()
}

export async function optionalCitizen(req, _res, next) {
  try {
    const payload = readPayload(req)
    if (payload?.type === 'citizen') {
      const citizen = await one('SELECT * FROM citizens WHERE id = ?', [Number(payload.sub)])
      if (citizen && citizen.status === 'AKTIF') req.citizen = citizen
    }
    return next()
  } catch (error) {
    return next(error)
  }
}
