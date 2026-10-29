/**
 * Menyalin seluruh data dari SQLite lokal (STORAGE_DIR/data/lapor.db) ke Turso.
 *
 * Pemakaian:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
 *   npm run migrate:turso
 *
 * Tambahkan --with-photos bila foto di folder uploads juga ingin diunggah ke
 * Vercel Blob dan path di database diganti menjadi URL absolut.
 * Perintah ini membutuhkan BLOB_READ_WRITE_TOKEN.
 */
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { createClient } from '@libsql/client/web'
import { DATA_DIR, UPLOAD_ROOT } from '../paths.js'
import { DATA_TABLES, SCHEMA_STATEMENTS } from '../db/schema.js'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
const withPhotos = process.argv.includes('--with-photos')
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

if (!url) {
  console.error('TURSO_DATABASE_URL belum diisi.')
  process.exit(1)
}
if (withPhotos && !blobToken) {
  console.error('--with-photos membutuhkan BLOB_READ_WRITE_TOKEN.')
  process.exit(1)
}

const dbFile = path.join(DATA_DIR, 'lapor.db')
if (!fs.existsSync(dbFile)) {
  console.error(`Basis data lokal tidak ditemukan: ${dbFile}`)
  process.exit(1)
}

const local = new DatabaseSync(dbFile, { readOnly: true })
const client = createClient({ url, authToken })

function normalize(row) {
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'bigint' ? Number(value) : value
  }
  return out
}

async function uploadPhotos() {
  const { put } = await import('@vercel/blob')
  const map = new Map()
  let uploaded = 0

  for (const kind of ['reports', 'news']) {
    const dir = path.join(UPLOAD_ROOT, kind)
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name)
      if (!fs.statSync(file).isFile()) continue
      const buffer = fs.readFileSync(file)
      const ext = path.extname(name).slice(1).toLowerCase() || 'jpg'
      const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      const blob = await put(`uploads/${kind}/${name}`, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        token: blobToken,
      })
      map.set(`/uploads/${kind}/${name}`, blob.url)
      uploaded += 1
    }
  }
  console.log(`[foto] ${uploaded} berkas diunggah ke Blob.`)
  return map
}

function rewrite(value, photoMap) {
  if (typeof value !== 'string') return value
  return photoMap.get(value) ?? value
}

async function main() {
  console.log(`[skema] menyiapkan ${SCHEMA_STATEMENTS.length} pernyataan…`)
  await client.batch(SCHEMA_STATEMENTS, 'write')

  const photoMap = withPhotos ? await uploadPhotos() : new Map()

  for (const table of DATA_TABLES) {
    let rows = []
    try {
      rows = local.prepare(`SELECT * FROM ${table}`).all().map(normalize)
    } catch {
      console.log(`[lewati] tabel ${table} tidak ada di basis data lokal.`)
      continue
    }
    if (rows.length === 0) {
      console.log(`[kosong] ${table}`)
      continue
    }

    const columns = Object.keys(rows[0])
    const placeholders = columns.map(() => '?').join(', ')
    const statements = rows.map((row) => ({
      sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      args: columns.map((column) => {
        const value = row[column]
        if (column === 'path' || column === 'cover') return rewrite(value, photoMap)
        return value === undefined ? null : value
      }),
    }))

    await client.batch(statements, 'write')
    console.log(`[salin] ${table}: ${rows.length} baris`)
  }

  console.log('[selesai] data berhasil dipindahkan ke Turso.')
}

await main()
