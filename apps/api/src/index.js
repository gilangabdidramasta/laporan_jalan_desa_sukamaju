import app from './app.js'

/**
 * Entry point untuk server biasa (lokal, Railway, VPS).
 * Di Vercel, berkas ini juga aman diekspor karena listen() dilewati.
 */

export default app

const IS_VERCEL = Boolean(process.env.VERCEL)

if (!IS_VERCEL) {
  const PORT = Number(process.env.PORT ?? 4000)
  const server = app.listen(PORT, () => {
    console.log(`[api] Berjalan di http://localhost:${PORT}`)
  })

  function shutdown(signal) {
    console.log(`[api] ${signal} diterima, menutup server…`)
    server.close(() => process.exit(0))
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
