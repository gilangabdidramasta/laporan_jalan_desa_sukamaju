import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { all, one, run, transaction } from '../db.js'
import { citizenOnly } from '../auth.js'
import { signCitizenToken } from '../auth.js'
import {
  DAMAGE_TYPES,
  assert,
  citizenPublic,
  digitsOnly,
  httpError,
  isEmail,
  isoNow,
  mapNews,
  mapReport,
  nextTicketCode,
  normalizeCoordinates,
  normalizeDamageTypes,
  normalizeEmail,
  parsePaging,
  persistPhotos,
  photosByReport,
  removeUploadedFiles,
  repairPhotosByReport,
} from '../helpers.js'

export const publicRoutes = Router()

const DAILY_REPORT_LIMIT = 10

function normalizeTicket(value) {
  return decodeURIComponent(String(value ?? '')).replace(/^#/, '').toUpperCase()
}

function startOfTodayIso() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

/* ---------------------------------- Akun ---------------------------------- */

publicRoutes.post('/auth/register', async (req, res, next) => {
  try {
    const body = req.body ?? {}
    const nama = String(body.nama ?? '').trim()
    const email = normalizeEmail(body.email)
    const noWa = digitsOnly(body.noWa)
    const password = String(body.password ?? '')

    assert(nama.length >= 3, 400, 'Nama minimal 3 karakter.')
    assert(isEmail(email), 400, 'Masukkan alamat email yang valid.')
    assert(
      noWa.length >= 9 && noWa.length <= 15,
      400,
      'Nomor WhatsApp tidak valid (9–15 digit).',
    )
    assert(password.length >= 8, 400, 'Password minimal 8 karakter.')
    assert(
      !(await one('SELECT id FROM citizens WHERE email = ?', [email])),
      409,
      'Email sudah digunakan.',
    )

    const now = isoNow()
    const result = await run(
      `INSERT INTO citizens (nama, email, no_wa, password_hash, status, created_at)
       VALUES (?, ?, ?, ?, 'AKTIF', ?)`,
      [nama, email, noWa, bcrypt.hashSync(password, 10), now],
    )
    const citizen = await one('SELECT * FROM citizens WHERE id = ?', [
      result.lastInsertRowid,
    ])

    res.status(201).json({
      token: signCitizenToken(citizen),
      user: citizenPublic(citizen),
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.post('/auth/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password ?? '')
    const citizen = await one('SELECT * FROM citizens WHERE email = ?', [email])

    assert(
      citizen && bcrypt.compareSync(password, citizen.password_hash),
      401,
      'Email atau password salah.',
    )
    assert(
      citizen.status === 'AKTIF',
      403,
      'Akun Anda dinonaktifkan. Hubungi Admin Kota.',
    )

    res.json({
      token: signCitizenToken(citizen),
      user: citizenPublic(citizen),
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/auth/me', citizenOnly, (req, res) => {
  res.json({ user: citizenPublic(req.citizen) })
})

/* -------------------------------- Laporan -------------------------------- */

publicRoutes.get('/reports/stats', async (_req, res, next) => {
  try {
    const rows = await all(
      "SELECT damage_types, created_at FROM reports WHERE status = 'PROSES'",
    )
    const damageTypes = new Set()
    let lastUpdated = null
    for (const row of rows) {
      for (const type of JSON.parse(row.damage_types)) damageTypes.add(type)
      if (!lastUpdated || row.created_at > lastUpdated) lastUpdated = row.created_at
    }
    res.json({
      totalReports: rows.length,
      damageTypeCount: damageTypes.size,
      lastUpdated,
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/reports/ticket/:code', async (req, res, next) => {
  try {
    const code = normalizeTicket(req.params.code)
    const row = await one(
      `SELECT r.*, c.nama AS reporter_nama
       FROM reports r JOIN citizens c ON c.id = r.citizen_id
       WHERE r.ticket_code = ?`,
      [code],
    )
    assert(row, 404, 'Laporan tidak ditemukan.')
    const photos = (await photosByReport([row.id])).get(row.id) ?? []
    const repairPhotos = (await repairPhotosByReport([row.id])).get(row.id) ?? []
    res.json({
      report: {
        ...mapReport(row, photos, repairPhotos),
        reporterNama: row.reporter_nama,
      },
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/reports/mine', citizenOnly, async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT * FROM reports WHERE citizen_id = ? ORDER BY created_at DESC',
      [req.citizen.id],
    )
    const photos = await photosByReport(rows.map((row) => row.id))
    const repairPhotos = await repairPhotosByReport(rows.map((row) => row.id))
    res.json({
      items: rows.map((row) =>
        mapReport(
          row,
          photos.get(row.id) ?? [],
          repairPhotos.get(row.id) ?? [],
        ),
      ),
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/reports/today-count', citizenOnly, async (req, res, next) => {
  try {
    const row = await one(
      'SELECT COUNT(*) AS total FROM reports WHERE citizen_id = ? AND created_at >= ?',
      [req.citizen.id, startOfTodayIso()],
    )
    res.json({ count: Number(row?.total ?? 0) })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/reports', async (req, res, next) => {
  try {
    const { page, perPage } = parsePaging(req.query, 9, 200)
    const status = String(req.query.status ?? '').toUpperCase()
    const damageTypes = String(req.query.damageTypes ?? '')
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter((item) => DAMAGE_TYPES.includes(item))
    const needle = String(req.query.ticket ?? '').trim().toUpperCase().replace(/^#?/, '')

    const where = []
    const params = []
    if (status) {
      assert(
        ['PROSES', 'DIPERBAIKI'].includes(status),
        400,
        'Status laporan publik tidak dikenal.',
      )
      where.push('r.status = ?')
      params.push(status)
    } else {
      where.push("r.status IN ('PROSES', 'DIPERBAIKI')")
    }
    if (damageTypes.length > 0) {
      where.push(`(${damageTypes.map(() => 'r.damage_types LIKE ?').join(' OR ')})`)
      for (const type of damageTypes) params.push(`%"${type}"%`)
    }
    if (needle) {
      where.push('(UPPER(r.ticket_code) LIKE ? OR UPPER(r.alamat) LIKE ?)')
      params.push(`%${needle}%`, `%${needle}%`)
    }

    const clause = where.join(' AND ')
    const totalRow = await one(
      `SELECT COUNT(*) AS total FROM reports r WHERE ${clause}`,
      params,
    )
    const total = Number(totalRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const offset = (safePage - 1) * perPage

    const rows = await all(
      `SELECT r.*, c.nama AS reporter_nama
       FROM reports r JOIN citizens c ON c.id = r.citizen_id
       WHERE ${clause}
       ORDER BY CASE r.status WHEN 'PROSES' THEN 0 ELSE 1 END,
                r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
    )
    const photos = await photosByReport(rows.map((row) => row.id))
    const repairPhotos = await repairPhotosByReport(rows.map((row) => row.id))

    res.json({
      items: rows.map((row) => ({
        ...mapReport(
          row,
          photos.get(row.id) ?? [],
          repairPhotos.get(row.id) ?? [],
        ),
        reporterNama: row.reporter_nama,
      })),
      total,
      page: safePage,
      perPage,
      totalPages,
    })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/reports/:id', citizenOnly, async (req, res, next) => {
  try {
    const row = await one('SELECT * FROM reports WHERE id = ? AND citizen_id = ?', [
      Number(req.params.id),
      req.citizen.id,
    ])
    assert(row, 404, 'Laporan tidak ditemukan.')
    const photos = (await photosByReport([row.id])).get(row.id) ?? []
    const repairPhotos = (await repairPhotosByReport([row.id])).get(row.id) ?? []
    res.json({ report: mapReport(row, photos, repairPhotos) })
  } catch (error) {
    next(error)
  }
})

publicRoutes.post('/reports', citizenOnly, async (req, res, next) => {
  try {
    const body = req.body ?? {}
    const alamat = String(body.alamat ?? '').trim()
    const deskripsi = String(body.deskripsi ?? '').trim()
    const damageTypes = normalizeDamageTypes(body.damageTypes)
    const { latitude, longitude } = normalizeCoordinates(body)
    const rawPhotos = Array.isArray(body.photos) ? body.photos : []

    assert(alamat.length >= 10, 400, 'Alamat minimal 10 karakter.')
    assert(deskripsi.length >= 20, 400, 'Deskripsi minimal 20 karakter.')
    assert(
      rawPhotos.length >= 1 && rawPhotos.length <= 3,
      400,
      'Unggah 1–3 foto kerusakan.',
    )

    const todayRow = await one(
      'SELECT COUNT(*) AS total FROM reports WHERE citizen_id = ? AND created_at >= ?',
      [req.citizen.id, startOfTodayIso()],
    )
    const todayCount = Number(todayRow?.total ?? 0)
    assert(
      todayCount < DAILY_REPORT_LIMIT,
      429,
      `Batas ${DAILY_REPORT_LIMIT} laporan per hari tercapai. Coba lagi besok.`,
    )

    const photos = await persistPhotos(rawPhotos)
    const now = isoNow()

    const created = await transaction(async (tx) => {
      const ticketCode = await nextTicketCode(tx, new Date())
      const result = await tx.run(
        `INSERT INTO reports
          (ticket_code, citizen_id, alamat, latitude, longitude, deskripsi,
           damage_types, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
        [
          ticketCode,
          req.citizen.id,
          alamat,
          latitude,
          longitude,
          deskripsi,
          JSON.stringify(damageTypes),
          now,
          now,
        ],
      )
      const id = result.lastInsertRowid
      for (const [index, photo] of photos.entries()) {
        await tx.run(
          'INSERT INTO report_photos (report_id, path, position) VALUES (?, ?, ?)',
          [id, photo, index],
        )
      }
      await tx.run(
        `INSERT INTO report_logs
          (report_id, actor_nama, actor_role, action, from_status, to_status, created_at)
         VALUES (?, ?, 'SISTEM', 'DIBUAT', NULL, 'PENDING', ?)`,
        [id, req.citizen.nama, now],
      )
      return tx.one('SELECT * FROM reports WHERE id = ?', [id])
    })

    res.status(201).json({ report: mapReport(created, photos) })
  } catch (error) {
    next(error)
  }
})

publicRoutes.put('/reports/:id', citizenOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM reports WHERE id = ?', [id])
    assert(current, 404, 'Laporan tidak ditemukan.')
    assert(current.citizen_id === req.citizen.id, 403, 'Akses ditolak.')
    assert(
      current.status === 'PENDING',
      409,
      'Laporan sudah diverifikasi dan tidak dapat diubah.',
    )

    const body = req.body ?? {}
    const alamat = String(body.alamat ?? '').trim()
    const deskripsi = String(body.deskripsi ?? '').trim()
    const damageTypes = normalizeDamageTypes(body.damageTypes)
    const latitude =
      body.latitude === null || body.latitude === undefined
        ? current.latitude
        : Number(body.latitude)
    const longitude =
      body.longitude === null || body.longitude === undefined
        ? current.longitude
        : Number(body.longitude)
    assert(alamat.length >= 10, 400, 'Alamat minimal 10 karakter.')
    assert(deskripsi.length >= 20, 400, 'Deskripsi minimal 20 karakter.')
    assert(Number.isFinite(latitude) && Number.isFinite(longitude), 400, 'Titik lokasi tidak valid.')
    const rawPhotos = Array.isArray(body.photos) ? body.photos : []
    assert(
      rawPhotos.length >= 1 && rawPhotos.length <= 3,
      400,
      'Unggah 1–3 foto kerusakan.',
    )

    const oldPhotos = (await photosByReport([id])).get(id) ?? []
    const photos = await persistPhotos(rawPhotos)
    const now = isoNow()

    await transaction(async (tx) => {
      await tx.run(
        `UPDATE reports SET alamat = ?, latitude = ?, longitude = ?, deskripsi = ?,
           damage_types = ?, updated_at = ? WHERE id = ?`,
        [alamat, latitude, longitude, deskripsi, JSON.stringify(damageTypes), now, id],
      )
      await tx.run('DELETE FROM report_photos WHERE report_id = ?', [id])
      for (const [index, photo] of photos.entries()) {
        await tx.run(
          'INSERT INTO report_photos (report_id, path, position) VALUES (?, ?, ?)',
          [id, photo, index],
        )
      }
    })

    await removeUploadedFiles(oldPhotos.filter((photo) => !photos.includes(photo)))

    const updated = await one('SELECT * FROM reports WHERE id = ?', [id])
    res.json({ report: mapReport(updated, photos) })
  } catch (error) {
    next(error)
  }
})

/* --------------------------------- Berita -------------------------------- */

publicRoutes.get('/news', async (_req, res, next) => {
  try {
    const rows = await all(
      "SELECT * FROM news WHERE status = 'TERBIT' ORDER BY published_at DESC, id DESC",
    )
    res.json({ items: rows.map(mapNews) })
  } catch (error) {
    next(error)
  }
})

publicRoutes.get('/news/:slug', async (req, res, next) => {
  try {
    const row = await one("SELECT * FROM news WHERE slug = ? AND status = 'TERBIT'", [
      String(req.params.slug),
    ])
    if (!row) throw httpError(404, 'Berita tidak ditemukan.')
    res.json({ item: mapNews(row) })
  } catch (error) {
    next(error)
  }
})
