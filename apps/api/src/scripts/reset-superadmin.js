import bcrypt from 'bcryptjs'
import { one, run } from '../db.js'

const [, , rawPassword] = process.argv
const password = String(rawPassword ?? '').trim()

if (password.length < 8) {
  console.log('Pemakaian: npm run reset-superadmin -- <password-baru>')
  process.exit(1)
}

const superAdmin = await one(
  "SELECT id, email FROM admins WHERE role = 'SUPER_ADMIN' ORDER BY id ASC LIMIT 1",
)

if (!superAdmin) {
  console.error('Tidak ada akun SUPER_ADMIN. Jalankan npm run create-admin terlebih dahulu.')
  process.exit(1)
}

await run("UPDATE admins SET password_hash = ?, status = 'AKTIF' WHERE id = ?", [
  bcrypt.hashSync(password, 10),
  superAdmin.id,
])
await run('DELETE FROM admin_login_attempts WHERE email = ?', [superAdmin.email])
console.log(`Password Super Admin ${superAdmin.email} berhasil direset.`)
