import express from 'express'
import cors from 'cors'
import { UPLOAD_ROOT } from './paths.js'
import { USING_BLOB } from './storage.js'
import { adminRoutes } from './routes/admin.js'
import { publicRoutes } from './routes/public.js'

/**
 * Aplikasi Express tanpa `listen()` supaya bisa dipakai dua cara:
 * - Vercel mendeteksi file ini sebagai entry point Express (default export).
 * - `src/index.js` memanggil listen() untuk pengembangan lokal.
 */

const app = express()
const IS_VERCEL = Boolean(process.env.VERCEL)

// Vercel Functions membatasi body request 4,5 MB.
const JSON_LIMIT = process.env.JSON_BODY_LIMIT ?? (IS_VERCEL ? '4mb' : '40mb')

app.disable('x-powered-by')
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json({ limit: JSON_LIMIT }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'lapor-jalan-pekanbaru', time: new Date().toISOString() })
})

app.use('/api/admin', adminRoutes)
app.use('/api', publicRoutes)

// Di Vercel, foto publik disajikan dari Blob (URL absolut) sehingga folder
// uploads tidak perlu dilayani. express.static juga diabaikan oleh Vercel.
if (!USING_BLOB && !IS_VERCEL) {
  app.use(
    '/uploads',
    express.static(UPLOAD_ROOT, {
      maxAge: '7d',
      fallthrough: false,
    }),
  )
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Alamat API tidak ditemukan.' })
})

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Ukuran data terlalu besar. Perkecil foto lalu coba lagi.' })
    return
  }
  const status = Number(error?.status) || 500
  if (status >= 500) {
    console.error('[api]', error)
  }
  res.status(status).json({
    error: status >= 500 ? 'Terjadi kesalahan pada server.' : error.message,
  })
})

export default app
