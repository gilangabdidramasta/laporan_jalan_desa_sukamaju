import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { all, one, run, transaction } from '../db.js'
import { adminOnly, signAdminToken, superAdminOnly, writerOnly } from '../auth.js'
import {
  DAMAGE_TYPES,
  adminPublic,
  assert,
  citizenPublic,
  httpError,
  isSlugTaken,
  isoNow,
  mapLog,
  mapNews,
  mapReport,
  normalizeDamageTypes,
  normalizeEmail,
  parsePaging,
  persistPhoto,
  persistPhotos,
  photosByReport,
  removeUploadedFiles,
  repairPhotosByReport,
  slugify,
  uniqueSlug,
} from '../helpers.js'

export const adminRoutes = Router()

const MAX_ATTEMPTS = 5
const LOCK_WINDOW_MS = 15 * 60 * 1000
const REPORT_STATUSES = ['PENDING', 'PROSES', 'DIPERBAIKI', 'DITOLAK', 'DITARIK']

function tempPassword(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
}

function summarize(html, maxLength = 180) {
  const text = String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

/* ---------------------------------- Login --------------------------------- */

adminRoutes.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password ?? '')
    const now = Date.now()

    const attempt = await one('SELECT * FROM admin_login_attempts WHERE email = ?', [email])
    if (
      attempt &&
      attempt.count >= MAX_ATTEMPTS &&
      now - attempt.first_at < LOCK_WINDOW_MS
    ) {
      const remaining = Math.ceil(
        (LOCK_WINDOW_MS - (now - attempt.first_at)) / 60000,
      )
      throw httpError(
        429,
        `Terlalu banyak percobaan. Coba lagi dalam ${remaining} menit.`,
      )
    }

    const admin = await one('SELECT * FROM admins WHERE email = ?', [email])
    const valid = admin && bcrypt.compareSync(password, admin.password_hash)

    if (!valid) {
      const fresh = !attempt || now - attempt.first_at > LOCK_WINDOW_MS
      await run(
        `INSERT INTO admin_login_attempts (email, count, first_at) VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET count = excluded.count, first_at = excluded.first_at`,
        [email, fresh ? 1 : attempt.count + 1, fresh ? now : attempt.first_at],
      )
      throw httpError(401, 'Email atau password salah.')
    }

    if (admin.status === 'NONAKTIF') {
      throw httpError(403, 'Akun Anda dinonaktifkan. Hubungi Super Admin.')
    }

    await run('DELETE FROM admin_login_attempts WHERE email = ?', [email])
    const loginAt = isoNow()
    await run('UPDATE admins SET last_login_at = ? WHERE id = ?', [loginAt, admin.id])

    res.json({
      token: signAdminToken(admin),
      admin: adminPublic({ ...admin, last_login_at: loginAt }),
    })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/me', adminOnly, (req, res) => {
  res.json({ admin: adminPublic(req.admin) })
})

/* -------------------------------- Laporan -------------------------------- */

adminRoutes.get('/reports/stats', adminOnly, async (_req, res, next) => {
  try {
    const stats = {
      PENDING: 0,
      PROSES: 0,
      DIPERBAIKI: 0,
      DITOLAK: 0,
      DITARIK: 0,
    }
    const rows = await all('SELECT status, COUNT(*) AS total FROM reports GROUP BY status')
    for (const row of rows) {
      stats[row.status] = Number(row.total)
    }
    res.json({ stats })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/reports/pending-count', adminOnly, async (_req, res, next) => {
  try {
    const row = await one("SELECT COUNT(*) AS total FROM reports WHERE status = 'PENDING'")
    res.json({ count: Number(row?.total ?? 0) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/reports', adminOnly, async (req, res, next) => {
  try {
    const { page, perPage } = parsePaging(req.query, 20, 200)
    const status = String(req.query.status ?? 'ALL').toUpperCase()
    const damageTypes = String(req.query.damageTypes ?? '')
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter((item) => DAMAGE_TYPES.includes(item))
    const needle = String(req.query.q ?? '').trim().toLowerCase()

    const where = []
    const params = []
    if (status !== 'ALL') {
      assert(REPORT_STATUSES.includes(status), 400, 'Status laporan tidak dikenal.')
      where.push('r.status = ?')
      params.push(status)
    }
    if (damageTypes.length > 0) {
      where.push(`(${damageTypes.map(() => 'r.damage_types LIKE ?').join(' OR ')})`)
      for (const type of damageTypes) params.push(`%"${type}"%`)
    }
    if (needle) {
      where.push(
        '(LOWER(r.ticket_code) LIKE ? OR LOWER(r.alamat) LIKE ? OR LOWER(c.nama) LIKE ?)',
      )
      const like = `%${needle}%`
      params.push(like, like, like)
    }
    if (req.query.from) {
      const from = new Date(`${req.query.from}T00:00:00`)
      assert(!Number.isNaN(from.getTime()), 400, 'Tanggal awal tidak valid.')
      where.push('r.created_at >= ?')
      params.push(from.toISOString())
    }
    if (req.query.to) {
      const to = new Date(`${req.query.to}T23:59:59.999`)
      assert(!Number.isNaN(to.getTime()), 400, 'Tanggal akhir tidak valid.')
      where.push('r.created_at <= ?')
      params.push(to.toISOString())
    }

    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const totalRow = await one(
      `SELECT COUNT(*) AS total FROM reports r JOIN citizens c ON c.id = r.citizen_id ${clause}`,
      params,
    )
    const total = Number(totalRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const offset = (safePage - 1) * perPage

    let order = 'ORDER BY'
    if (status === 'PENDING') {
      order += ' r.created_at ASC'
    } else if (status === 'ALL') {
      order += ` CASE r.status
        WHEN 'PENDING' THEN 0
        WHEN 'PROSES' THEN 1
        WHEN 'DIPERBAIKI' THEN 2
        WHEN 'DITOLAK' THEN 3
        ELSE 4 END, r.created_at DESC`
    } else {
      order += ' r.created_at DESC'
    }

    const rows = await all(
      `SELECT r.*, c.nama AS reporter_nama, c.email AS reporter_email,
              c.no_wa AS reporter_no_wa, c.status AS reporter_status,
              c.created_at AS reporter_created_at
       FROM reports r JOIN citizens c ON c.id = r.citizen_id
       ${clause} ${order} LIMIT ? OFFSET ?`,
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
        reporter: citizenPublic({
          id: row.citizen_id,
          nama: row.reporter_nama,
          email: row.reporter_email,
          no_wa: row.reporter_no_wa,
          status: row.reporter_status,
          created_at: row.reporter_created_at,
        }),
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

adminRoutes.get('/reports/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const row = await one('SELECT * FROM reports WHERE id = ?', [id])
    assert(row, 404, 'Laporan tidak ditemukan.')
    const citizen = await one('SELECT * FROM citizens WHERE id = ?', [row.citizen_id])
    const photos = (await photosByReport([id])).get(id) ?? []
    const repairPhotos = (await repairPhotosByReport([id])).get(id) ?? []
    const logs = await all(
      'SELECT * FROM report_logs WHERE report_id = ? ORDER BY created_at DESC, id DESC',
      [id],
    )
    res.json({
      report: {
        ...mapReport(row, photos, repairPhotos),
        reporter: citizenPublic(citizen),
      },
      logs: logs.map(mapLog),
    })
  } catch (error) {
    next(error)
  }
})

async function applyStatus(id, nextStatus, action, actor, note, rejectionReason) {
  const current = await one('SELECT * FROM reports WHERE id = ?', [id])
  assert(current, 404, 'Laporan tidak ditemukan.')
  const now = isoNow()
  await transaction(async (tx) => {
    await tx.run(
      'UPDATE reports SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?',
      [nextStatus, nextStatus === 'DITOLAK' ? rejectionReason ?? null : null, now, id],
    )
    await tx.run(
      `INSERT INTO report_logs
        (report_id, actor_nama, actor_role, action, from_status, to_status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        actor.nama,
        actor.role,
        action,
        current.status,
        nextStatus,
        note ?? null,
        now,
      ],
    )
  })
}

adminRoutes.post('/reports/:id/approve', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT status FROM reports WHERE id = ?', [id])
    assert(current, 404, 'Laporan tidak ditemukan.')
    await applyStatus(
      id,
      'PROSES',
      current.status === 'DITOLAK' ? 'SETUJUI_ULANG' : 'SETUJUI',
      req.admin,
      req.body?.note,
    )
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/reports/:id/complete', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM reports WHERE id = ?', [id])
    assert(current, 404, 'Laporan tidak ditemukan.')
    assert(
      current.status === 'PROSES',
      409,
      'Laporan hanya dapat diselesaikan saat berstatus Proses.',
    )

    const rawPhotos = Array.isArray(req.body?.photos) ? req.body.photos : []
    assert(
      rawPhotos.length === 3,
      400,
      'Unggah tepat 3 foto bukti perbaikan.',
    )
    const photos = await persistPhotos(rawPhotos)
    const note = String(req.body?.note ?? '').trim()
    const now = isoNow()

    await transaction(async (tx) => {
      await tx.run('DELETE FROM report_repair_photos WHERE report_id = ?', [id])
      for (const [index, photo] of photos.entries()) {
        await tx.run(
          'INSERT INTO report_repair_photos (report_id, path, position) VALUES (?, ?, ?)',
          [id, photo, index],
        )
      }
      await tx.run('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?', [
        'DIPERBAIKI',
        now,
        id,
      ])
      await tx.run(
        `INSERT INTO report_logs
          (report_id, actor_nama, actor_role, action, from_status, to_status, note, created_at)
         VALUES (?, ?, ?, 'SELESAI', ?, 'DIPERBAIKI', ?, ?)`,
        [id, req.admin.nama, req.admin.role, current.status, note || null, now],
      )
    })

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/reports/:id/reject', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const reason = String(req.body?.reason ?? '').trim()
    assert(reason.length >= 10, 400, 'Alasan penolakan minimal 10 karakter.')
    await applyStatus(
      Number(req.params.id),
      'DITOLAK',
      'TOLAK',
      req.admin,
      String(req.body?.note ?? '').trim() || reason,
      reason,
    )
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/reports/:id/withdraw', adminOnly, writerOnly, async (req, res, next) => {
  try {
    await applyStatus(Number(req.params.id), 'DITARIK', 'TARIK', req.admin, req.body?.note)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/reports/:id/republish', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const repairPhotos = (await repairPhotosByReport([id])).get(id) ?? []
    await applyStatus(
      id,
      repairPhotos.length === 3 ? 'DIPERBAIKI' : 'PROSES',
      'PUBLIKASI_ULANG',
      req.admin,
      req.body?.note,
    )
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.put('/reports/:id', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const body = req.body ?? {}
    const current = await one('SELECT * FROM reports WHERE id = ?', [id])
    assert(current, 404, 'Laporan tidak ditemukan.')

    const alamat = String(body.alamat ?? current.alamat).trim()
    const deskripsi = String(body.deskripsi ?? current.deskripsi).trim()
    const damageTypes = normalizeDamageTypes(
      body.damageTypes ?? JSON.parse(current.damage_types),
    )
    assert(alamat.length >= 10, 400, 'Alamat minimal 10 karakter.')
    assert(deskripsi.length >= 20, 400, 'Deskripsi minimal 20 karakter.')
    const latitude =
      body.latitude === null || body.latitude === undefined
        ? current.latitude
        : Number(body.latitude)
    const longitude =
      body.longitude === null || body.longitude === undefined
        ? current.longitude
        : Number(body.longitude)
    assert(Number.isFinite(latitude) && Number.isFinite(longitude), 400, 'Titik lokasi tidak valid.')

    const oldPhotos = (await photosByReport([id])).get(id) ?? []
    const repairPhotos = (await repairPhotosByReport([id])).get(id) ?? []
    const rawPhotos = Array.isArray(body.photos) ? body.photos : oldPhotos
    assert(
      rawPhotos.length >= 1 && rawPhotos.length <= 3,
      400,
      'Unggah 1–3 foto kerusakan.',
    )
    const photos = await persistPhotos(rawPhotos)

    const changes = {}
    if (alamat !== current.alamat) changes.alamat = { from: current.alamat, to: alamat }
    if (deskripsi !== current.deskripsi) {
      changes.deskripsi = { from: current.deskripsi, to: deskripsi }
    }
    const currentTypes = JSON.parse(current.damage_types)
    if (damageTypes.join(',') !== currentTypes.join(',')) {
      changes.jenisKerusakan = {
        from: currentTypes.join(', '),
        to: damageTypes.join(', '),
      }
    }
    if (latitude !== current.latitude || longitude !== current.longitude) {
      changes.koordinat = {
        from: `${current.latitude}, ${current.longitude}`,
        to: `${latitude}, ${longitude}`,
      }
    }
    if (photos.join(',') !== oldPhotos.join(',')) {
      changes.foto = { from: `${oldPhotos.length} foto`, to: `${photos.length} foto` }
    }

    const note = String(body.note ?? '').trim()
    if (Object.keys(changes).length === 0 && !note) {
      res.json({ report: mapReport(current, oldPhotos, repairPhotos) })
      return
    }

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
      await tx.run(
        `INSERT INTO report_logs
          (report_id, actor_nama, actor_role, action, from_status, to_status, note, changes, created_at)
         VALUES (?, ?, ?, 'EDIT', ?, ?, ?, ?, ?)`,
        [
          id,
          req.admin.nama,
          req.admin.role,
          current.status,
          current.status,
          note || null,
          JSON.stringify(changes),
          now,
        ],
      )
    })

    await removeUploadedFiles(oldPhotos.filter((photo) => !photos.includes(photo)))

    const updated = await one('SELECT * FROM reports WHERE id = ?', [id])
    res.json({ report: mapReport(updated, photos, repairPhotos) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.delete('/reports/:id', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM reports WHERE id = ?', [id])
    assert(current, 404, 'Laporan tidak ditemukan.')
    const photos = (await photosByReport([id])).get(id) ?? []
    const repairPhotos = (await repairPhotosByReport([id])).get(id) ?? []

    await transaction(async (tx) => {
      await tx.run(
        `INSERT INTO report_logs
          (report_id, actor_nama, actor_role, action, from_status, to_status, note, created_at)
         VALUES (?, ?, ?, 'HAPUS', ?, NULL, ?, ?)`,
        [
          id,
          req.admin.nama,
          req.admin.role,
          current.status,
          `Laporan ${current.ticket_code} dihapus permanen.`,
          isoNow(),
        ],
      )
      await tx.run('DELETE FROM report_photos WHERE report_id = ?', [id])
      await tx.run('DELETE FROM report_repair_photos WHERE report_id = ?', [id])
      await tx.run('DELETE FROM reports WHERE id = ?', [id])
    })

    await removeUploadedFiles(photos)
    await removeUploadedFiles(repairPhotos)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

/* --------------------------------- Warga --------------------------------- */

adminRoutes.get('/citizens/stats', adminOnly, async (_req, res, next) => {
  try {
    const rows = await all('SELECT status, COUNT(*) AS total FROM citizens GROUP BY status')
    const stats = { total: 0, aktif: 0, nonaktif: 0 }
    for (const row of rows) {
      const total = Number(row.total)
      stats.total += total
      if (row.status === 'AKTIF') stats.aktif = total
      if (row.status === 'NONAKTIF') stats.nonaktif = total
    }
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/citizens', adminOnly, async (req, res, next) => {
  try {
    const { page, perPage } = parsePaging(req.query, 20, 200)
    const status = String(req.query.status ?? 'ALL').toUpperCase()
    const needle = String(req.query.q ?? '').trim().toLowerCase()

    const where = []
    const params = []
    if (status !== 'ALL') {
      assert(['AKTIF', 'NONAKTIF'].includes(status), 400, 'Status akun tidak dikenal.')
      where.push('c.status = ?')
      params.push(status)
    }
    if (needle) {
      where.push('(LOWER(c.nama) LIKE ? OR LOWER(c.email) LIKE ? OR c.no_wa LIKE ?)')
      params.push(`%${needle}%`, `%${needle}%`, `%${needle}%`)
    }
    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    const totalRow = await one(`SELECT COUNT(*) AS total FROM citizens c ${clause}`, params)
    const total = Number(totalRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const rows = await all(
      `SELECT c.*, (SELECT COUNT(*) FROM reports r WHERE r.citizen_id = c.id) AS report_count
       FROM citizens c ${clause}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (safePage - 1) * perPage],
    )

    res.json({
      items: rows.map((row) => ({
        ...citizenPublic(row),
        reportCount: Number(row.report_count),
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

adminRoutes.get('/citizens/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const citizen = await one('SELECT * FROM citizens WHERE id = ?', [id])
    assert(citizen, 404, 'Akun warga tidak ditemukan.')
    const rows = await all(
      'SELECT * FROM reports WHERE citizen_id = ? ORDER BY created_at DESC',
      [id],
    )
    const photos = await photosByReport(rows.map((row) => row.id))
    const repairPhotos = await repairPhotosByReport(rows.map((row) => row.id))
    res.json({
      citizen: citizenPublic(citizen),
      reports: rows.map((row) =>
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

adminRoutes.patch('/citizens/:id/status', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? '').toUpperCase()
    assert(['AKTIF', 'NONAKTIF'].includes(status), 400, 'Status akun tidak dikenal.')
    const id = Number(req.params.id)
    assert(
      await one('SELECT id FROM citizens WHERE id = ?', [id]),
      404,
      'Akun warga tidak ditemukan.',
    )
    await run('UPDATE citizens SET status = ? WHERE id = ?', [status, id])
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/citizens/:id/reset-password', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    assert(
      await one('SELECT id FROM citizens WHERE id = ?', [id]),
      404,
      'Akun warga tidak ditemukan.',
    )
    const password = tempPassword('Warga')
    await run('UPDATE citizens SET password_hash = ? WHERE id = ?', [
      bcrypt.hashSync(password, 10),
      id,
    ])
    res.json({ password })
  } catch (error) {
    next(error)
  }
})

/* -------------------------------- Akun Admin ------------------------------ */

adminRoutes.get('/admins', adminOnly, superAdminOnly, async (req, res, next) => {
  try {
    const { page, perPage } = parsePaging(req.query, 20, 200)
    const role = String(req.query.role ?? 'ALL').toUpperCase()
    const needle = String(req.query.q ?? '').trim().toLowerCase()

    const where = []
    const params = []
    if (role !== 'ALL') {
      assert(['ADMIN', 'SUPER_ADMIN'].includes(role), 400, 'Role tidak dikenal.')
      where.push('role = ?')
      params.push(role)
    }
    if (needle) {
      where.push('(LOWER(nama) LIKE ? OR LOWER(email) LIKE ?)')
      params.push(`%${needle}%`, `%${needle}%`)
    }
    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const totalRow = await one(`SELECT COUNT(*) AS total FROM admins ${clause}`, params)
    const total = Number(totalRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const rows = await all(
      `SELECT * FROM admins ${clause} ORDER BY created_at ASC LIMIT ? OFFSET ?`,
      [...params, perPage, (safePage - 1) * perPage],
    )

    res.json({
      items: rows.map(adminPublic),
      total,
      page: safePage,
      perPage,
      totalPages,
    })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/admins', adminOnly, superAdminOnly, async (req, res, next) => {
  try {
    const body = req.body ?? {}
    const nama = String(body.nama ?? '').trim()
    const email = normalizeEmail(body.email)
    const password = String(body.password ?? '')
    const role = String(body.role ?? 'ADMIN').toUpperCase()

    assert(nama.length >= 3, 400, 'Nama minimal 3 karakter.')
    assert(/^\S+@\S+\.\S+$/.test(email), 400, 'Masukkan alamat email yang valid.')
    assert(password.length >= 8, 400, 'Password minimal 8 karakter.')
    assert(['ADMIN', 'SUPER_ADMIN'].includes(role), 400, 'Role tidak dikenal.')
    assert(
      !(await one('SELECT id FROM admins WHERE email = ?', [email])),
      409,
      'Email sudah digunakan.',
    )
    if (role === 'SUPER_ADMIN') {
      assert(
        !(await one("SELECT id FROM admins WHERE role = 'SUPER_ADMIN' AND status = 'AKTIF'")),
        400,
        'Sudah ada Super Admin aktif. Nonaktifkan akun tersebut terlebih dahulu.',
      )
    }

    const result = await run(
      `INSERT INTO admins (nama, email, password_hash, role, status, created_at)
       VALUES (?, ?, ?, ?, 'AKTIF', ?)`,
      [nama, email, bcrypt.hashSync(password, 10), role, isoNow()],
    )
    const created = await one('SELECT * FROM admins WHERE id = ?', [
      result.lastInsertRowid,
    ])
    res.status(201).json({ admin: adminPublic(created) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.patch('/admins/:id/status', adminOnly, superAdminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const status = String(req.body?.status ?? '').toUpperCase()
    assert(['AKTIF', 'NONAKTIF'].includes(status), 400, 'Status akun tidak dikenal.')
    const target = await one('SELECT * FROM admins WHERE id = ?', [id])
    assert(target, 404, 'Akun admin tidak ditemukan.')
    assert(
      !(target.id === req.admin.id && status === 'NONAKTIF'),
      400,
      'Anda tidak dapat menonaktifkan akun sendiri.',
    )
    if (target.role === 'SUPER_ADMIN' && status === 'NONAKTIF') {
      const active = await one(
        "SELECT COUNT(*) AS total FROM admins WHERE role = 'SUPER_ADMIN' AND status = 'AKTIF'",
      )
      assert(Number(active?.total ?? 0) > 1, 400, 'Minimal satu Super Admin harus aktif.')
    }
    await run('UPDATE admins SET status = ? WHERE id = ?', [status, id])
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/admins/:id/reset-password', adminOnly, superAdminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    assert(
      await one('SELECT id FROM admins WHERE id = ?', [id]),
      404,
      'Akun admin tidak ditemukan.',
    )
    const password = tempPassword('Admin')
    await run('UPDATE admins SET password_hash = ? WHERE id = ?', [
      bcrypt.hashSync(password, 10),
      id,
    ])
    res.json({ password })
  } catch (error) {
    next(error)
  }
})

/* --------------------------------- Berita -------------------------------- */

async function normalizeNewsInput(body, exceptId) {
  const judul = String(body.judul ?? '').trim()
  const isi = String(body.isi ?? '')
  const slug = slugify(body.slug || judul)
  assert(judul.length > 0, 400, 'Judul berita wajib diisi.')
  assert(slug.length > 0, 400, 'Slug berita wajib diisi.')
  assert(
    isi.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0,
    400,
    'Isi berita wajib diisi.',
  )
  assert(!(await isSlugTaken(slug, exceptId)), 409, 'Slug sudah dipakai berita lain.')
  return {
    judul,
    slug,
    isi,
    ringkasan: String(body.ringkasan ?? '').trim() || summarize(isi),
  }
}

adminRoutes.get('/news/slug-check', adminOnly, async (req, res, next) => {
  try {
    const slug = slugify(req.query.slug)
    const exceptId = req.query.exceptId ? Number(req.query.exceptId) : undefined
    res.json({ taken: Boolean(slug) && (await isSlugTaken(slug, exceptId)) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/news/unique-slug', adminOnly, async (req, res, next) => {
  try {
    const exceptId = req.query.exceptId ? Number(req.query.exceptId) : undefined
    res.json({ slug: await uniqueSlug(String(req.query.base ?? ''), exceptId) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/news', adminOnly, async (req, res, next) => {
  try {
    const { page, perPage } = parsePaging(req.query, 20, 200)
    const status = String(req.query.status ?? 'ALL').toUpperCase()
    const needle = String(req.query.q ?? '').trim().toLowerCase()

    const where = []
    const params = []
    if (status !== 'ALL') {
      assert(['DRAFT', 'TERBIT'].includes(status), 400, 'Status berita tidak dikenal.')
      where.push('status = ?')
      params.push(status)
    }
    if (needle) {
      where.push('(LOWER(judul) LIKE ? OR LOWER(slug) LIKE ?)')
      params.push(`%${needle}%`, `%${needle}%`)
    }
    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const totalRow = await one(`SELECT COUNT(*) AS total FROM news ${clause}`, params)
    const total = Number(totalRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const rows = await all(
      `SELECT * FROM news ${clause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (safePage - 1) * perPage],
    )

    res.json({
      items: rows.map(mapNews),
      total,
      page: safePage,
      perPage,
      totalPages,
    })
  } catch (error) {
    next(error)
  }
})

adminRoutes.get('/news/:id', adminOnly, async (req, res, next) => {
  try {
    const row = await one('SELECT * FROM news WHERE id = ?', [Number(req.params.id)])
    assert(row, 404, 'Berita tidak ditemukan.')
    res.json({ item: mapNews(row) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/news', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const body = req.body ?? {}
    const input = await normalizeNewsInput(body)
    const status = String(body.status ?? 'DRAFT').toUpperCase()
    assert(['DRAFT', 'TERBIT'].includes(status), 400, 'Status berita tidak dikenal.')
    const cover = body.cover ? await persistPhoto(body.cover, 'news') : ''
    assert(
      status !== 'TERBIT' || cover.length > 0,
      400,
      'Gambar sampul wajib diunggah sebelum menerbitkan berita.',
    )
    const now = isoNow()

    const result = await run(
      `INSERT INTO news (slug, judul, ringkasan, isi, cover, status, author_nama,
        created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.slug,
        input.judul,
        input.ringkasan,
        input.isi,
        cover,
        status,
        req.admin.nama,
        now,
        now,
        status === 'TERBIT' ? now : null,
      ],
    )
    const created = await one('SELECT * FROM news WHERE id = ?', [
      result.lastInsertRowid,
    ])
    res.status(201).json({ item: mapNews(created) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.put('/news/:id', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM news WHERE id = ?', [id])
    assert(current, 404, 'Berita tidak ditemukan.')
    const body = req.body ?? {}
    const input = await normalizeNewsInput(body, id)
    const status = String(body.status ?? current.status).toUpperCase()
    assert(['DRAFT', 'TERBIT'].includes(status), 400, 'Status berita tidak dikenal.')

    const cover = body.cover ? await persistPhoto(body.cover, 'news') : ''
    assert(
      status !== 'TERBIT' || cover.length > 0,
      400,
      'Gambar sampul wajib diunggah sebelum menerbitkan berita.',
    )
    const now = isoNow()
    const publishedAt =
      status === 'TERBIT' ? current.published_at ?? now : current.published_at

    await run(
      `UPDATE news SET slug = ?, judul = ?, ringkasan = ?, isi = ?, cover = ?,
        status = ?, updated_at = ?, published_at = ? WHERE id = ?`,
      [
        input.slug,
        input.judul,
        input.ringkasan,
        input.isi,
        cover,
        status,
        now,
        publishedAt,
        id,
      ],
    )

    if (current.cover && current.cover !== cover) {
      await removeUploadedFiles([current.cover])
    }

    const updated = await one('SELECT * FROM news WHERE id = ?', [id])
    res.json({ item: mapNews(updated) })
  } catch (error) {
    next(error)
  }
})

adminRoutes.delete('/news/:id', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM news WHERE id = ?', [id])
    assert(current, 404, 'Berita tidak ditemukan.')
    await run('DELETE FROM news WHERE id = ?', [id])
    if (current.cover) await removeUploadedFiles([current.cover])
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

adminRoutes.post('/news/:id/unpublish', adminOnly, writerOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await one('SELECT * FROM news WHERE id = ?', [id])
    assert(current, 404, 'Berita tidak ditemukan.')
    await run("UPDATE news SET status = 'DRAFT', updated_at = ? WHERE id = ?", [
      isoNow(),
      id,
    ])
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
