import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** Akar folder `apps/api`. */
export const API_ROOT = path.resolve(here, '..')

/**
 * Semua data yang harus bertahan (database SQLite + foto) disimpan di bawah
 * satu folder. Di Railway arahkan STORAGE_DIR ke mount volume, mis. /data.
 */
export const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : API_ROOT

export const DATA_DIR = path.join(STORAGE_ROOT, 'data')
export const UPLOAD_ROOT = path.join(STORAGE_ROOT, 'uploads')
export const REPORT_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'reports')
export const NEWS_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'news')
