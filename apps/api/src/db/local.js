import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  DATA_DIR,
  NEWS_UPLOAD_DIR,
  REPORT_UPLOAD_DIR,
  UPLOAD_ROOT,
} from '../paths.js'
import { SCHEMA_STATEMENTS } from './schema.js'

/**
 * Backend SQLite lokal (dev, Railway, atau server biasa).
 * Semua fungsi diekspos sebagai async supaya kode pemanggil sama dengan
 * backend Turso, meskipun di sini operasinya sebenarnya sinkron.
 */

for (const dir of [DATA_DIR, UPLOAD_ROOT, REPORT_UPLOAD_DIR, NEWS_UPLOAD_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}

const db = new DatabaseSync(path.join(DATA_DIR, 'lapor.db'))
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

function normalizeRow(row) {
  if (!row) return null
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'bigint' ? Number(value) : value
  }
  return out
}

function allSync(sql, params = []) {
  return db.prepare(sql).all(...params).map(normalizeRow)
}

function oneSync(sql, params = []) {
  const row = db.prepare(sql).get(...params)
  return row ? normalizeRow(row) : null
}

function runSync(sql, params = []) {
  const result = db.prepare(sql).run(...params)
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: Number(result.changes),
  }
}

export const driver = 'sqlite'

export async function all(sql, params = []) {
  return allSync(sql, params)
}

export async function one(sql, params = []) {
  return oneSync(sql, params)
}

export async function run(sql, params = []) {
  return runSync(sql, params)
}

/**
 * Transaksi lokal berjalan sinkron di dalam SATU tick event loop, sehingga
 * tidak ada request lain yang bisa menyelip di antara BEGIN dan COMMIT.
 */
export async function transaction(fn) {
  db.exec('BEGIN IMMEDIATE;')
  try {
    const tx = {
      all: async (sql, params = []) => allSync(sql, params),
      one: async (sql, params = []) => oneSync(sql, params),
      run: async (sql, params = []) => runSync(sql, params),
    }
    const result = await fn(tx)
    db.exec('COMMIT;')
    return result
  } catch (error) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      /* transaksi mungkin sudah dibatalkan */
    }
    throw error
  }
}

/**
 * Basis data lama masih memakai status DISETUJUI sementara CHECK constraint
 * sekarang hanya menerima PROSES. Tabel `reports` perlu dibangun ulang.
 */
function migrateReportStatuses() {
  const current = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'reports'")
    .get()
  if (!current || String(current.sql).includes("'PROSES'")) return

  db.exec('PRAGMA foreign_keys = OFF;')
  try {
    db.exec(`
      BEGIN IMMEDIATE;
      DROP TABLE IF EXISTS reports_new;
      CREATE TABLE reports_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_code TEXT NOT NULL UNIQUE,
        citizen_id INTEGER NOT NULL REFERENCES citizens(id),
        alamat TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        deskripsi TEXT NOT NULL,
        damage_types TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROSES', 'DIPERBAIKI', 'DITOLAK', 'DITARIK')),
        rejection_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO reports_new
        (id, ticket_code, citizen_id, alamat, latitude, longitude, deskripsi,
         damage_types, status, rejection_reason, created_at, updated_at)
      SELECT id, ticket_code, citizen_id, alamat, latitude, longitude, deskripsi,
             damage_types,
             CASE status WHEN 'DISETUJUI' THEN 'PROSES' ELSE status END,
             rejection_reason, created_at, updated_at
      FROM reports;
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;
      COMMIT;
    `)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
      CREATE INDEX IF NOT EXISTS idx_reports_citizen ON reports(citizen_id);
    `)
    console.log('[migrasi] Status DISETUJUI diubah menjadi PROSES.')
  } catch (error) {
    try {
      db.exec('ROLLBACK;')
    } catch {
      /* transaksi mungkin sudah dibatalkan */
    }
    throw error
  } finally {
    db.exec('PRAGMA foreign_keys = ON;')
  }
}

export async function init() {
  for (const statement of SCHEMA_STATEMENTS) {
    db.exec(statement)
  }
  migrateReportStatuses()
}
