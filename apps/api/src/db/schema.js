/**
 * Skema basis data. Dipakai bersama oleh backend SQLite lokal dan Turso.
 * Setiap pernyataan dijalankan terpisah supaya kompatibel dengan libSQL.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TEXT NOT NULL,
    last_login_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    no_wa TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS reports (
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
  )`,

  `CREATE TABLE IF NOT EXISTS report_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS report_repair_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS report_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    actor_nama TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    note TEXT,
    changes TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    judul TEXT NOT NULL,
    ringkasan TEXT NOT NULL DEFAULT '',
    isi TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'TERBIT')),
    author_nama TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS admin_login_attempts (
    email TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    first_at INTEGER NOT NULL
  )`,

  'CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)',
  'CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_reports_citizen ON reports(citizen_id)',
  'CREATE INDEX IF NOT EXISTS idx_photos_report ON report_photos(report_id)',
  'CREATE INDEX IF NOT EXISTS idx_repair_photos_report ON report_repair_photos(report_id)',
  'CREATE INDEX IF NOT EXISTS idx_logs_report ON report_logs(report_id)',
  'CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)',
]

/** Tabel yang perlu disalin saat memindahkan data ke Turso, urut sesuai relasi. */
export const DATA_TABLES = [
  'admins',
  'citizens',
  'reports',
  'report_photos',
  'report_repair_photos',
  'report_logs',
  'news',
  'admin_login_attempts',
]
