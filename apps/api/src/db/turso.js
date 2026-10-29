import { createClient } from '@libsql/client/web'
import { SCHEMA_STATEMENTS } from './schema.js'

/**
 * Backend Turso (libSQL). Dipakai otomatis bila TURSO_DATABASE_URL diisi,
 * misalnya saat aplikasi berjalan sebagai Vercel Function.
 */

const rawUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

/** Klien web memakai HTTP/WebSocket; samakan skema libsql:// menjadi https://. */
const url = rawUrl?.startsWith('libsql://')
  ? `https://${rawUrl.slice('libsql://'.length)}`
  : rawUrl

export const client = createClient({ url, authToken })

export const driver = 'turso'

/** libSQL menolak nilai undefined; ubah menjadi NULL. */
function toArgs(params = []) {
  return params.map((value) => (value === undefined ? null : value))
}

function normalizeRow(row) {
  if (!row) return null
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'bigint' ? Number(value) : value
  }
  return out
}

function normalizeRows(rows) {
  return rows.map(normalizeRow)
}

export async function all(sql, params = []) {
  const result = await client.execute({ sql, args: toArgs(params) })
  return normalizeRows(result.rows)
}

export async function one(sql, params = []) {
  const result = await client.execute({ sql, args: toArgs(params) })
  return normalizeRow(result.rows[0] ?? null)
}

export async function run(sql, params = []) {
  const result = await client.execute({ sql, args: toArgs(params) })
  return {
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    changes: Number(result.rowsAffected ?? 0),
  }
}

export async function transaction(fn) {
  const trx = await client.transaction('write')
  try {
    const tx = {
      all: async (sql, params = []) => {
        const result = await trx.execute({ sql, args: toArgs(params) })
        return normalizeRows(result.rows)
      },
      one: async (sql, params = []) => {
        const result = await trx.execute({ sql, args: toArgs(params) })
        return normalizeRow(result.rows[0] ?? null)
      },
      run: async (sql, params = []) => {
        const result = await trx.execute({ sql, args: toArgs(params) })
        return {
          lastInsertRowid: Number(result.lastInsertRowid ?? 0),
          changes: Number(result.rowsAffected ?? 0),
        }
      },
    }
    const result = await fn(tx)
    await trx.commit()
    return result
  } catch (error) {
    try {
      await trx.rollback()
    } catch {
      /* transaksi mungkin sudah ditutup */
    }
    throw error
  }
}

export async function init() {
  await client.batch(SCHEMA_STATEMENTS, 'write')
}
