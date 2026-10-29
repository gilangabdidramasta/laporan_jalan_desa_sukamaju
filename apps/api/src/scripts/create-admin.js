import bcrypt from 'bcryptjs'
import { one, run } from '../db.js'

const [, , rawEmail, rawPassword, rawName, rawRole] = process.argv
const email = String(rawEmail ?? '').trim().toLowerCase()
const password = String(rawPassword ?? '')
const nama = String(rawName ?? '').trim() || 'Admin Kota'
const role = String(rawRole ?? 'ADMIN').toUpperCase()

if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
  console.log(
    'Pemakaian: npm run create-admin -- <email> <password> ["Nama Admin"] [ADMIN|SUPER_ADMIN]',
  )
  process.exit(1)
}

if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
  console.error('Role harus ADMIN atau SUPER_ADMIN.')
  process.exit(1)
}

if (await one('SELECT id FROM admins WHERE email = ?', [email])) {
  console.error(`Email ${email} sudah terdaftar.`)
  process.exit(1)
}

await run(
  `INSERT INTO admins (nama, email, password_hash, role, status, created_at)
   VALUES (?, ?, ?, ?, 'AKTIF', ?)`,
  [nama, email, bcrypt.hashSync(password, 10), role, new Date().toISOString()],
)

console.log(`Akun ${role} ${email} berhasil dibuat.`)
