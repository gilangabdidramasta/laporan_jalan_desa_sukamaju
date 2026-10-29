import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginAdmin, logoutAdmin } from './store'
import type { Admin, AdminRole } from './types'

const KEY_SESSION = 'lapor.admin.session.v1'

interface AuthContextValue {
  admin: Admin | null
  role: AdminRole | null
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  readOnly: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<Admin>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Admin | null {
  try {
    const raw =
      localStorage.getItem(KEY_SESSION) ?? sessionStorage.getItem(KEY_SESSION)
    if (!raw) return null
    return JSON.parse(raw) as Admin
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => readSession())

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY_SESSION) {
        setAdmin(readSession())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Token kedaluwarsa atau akun dinonaktifkan → keluar dari sesi lokal.
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(KEY_SESSION)
      sessionStorage.removeItem(KEY_SESSION)
      setAdmin(null)
    }
    window.addEventListener('lapor:unauthorized', onUnauthorized)
    return () => window.removeEventListener('lapor:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const next = await loginAdmin(email, password)
      const target = remember ? localStorage : sessionStorage
      const other = remember ? sessionStorage : localStorage
      other.removeItem(KEY_SESSION)
      target.setItem(KEY_SESSION, JSON.stringify(next))
      setAdmin(next)
      return next
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(KEY_SESSION)
    sessionStorage.removeItem(KEY_SESSION)
    logoutAdmin()
    setAdmin(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      role: admin?.role ?? null,
      isAuthenticated: Boolean(admin),
      isAdmin: admin?.role === 'ADMIN',
      isSuperAdmin: admin?.role === 'SUPER_ADMIN',
      readOnly: admin?.role === 'SUPER_ADMIN',
      login,
      logout,
    }),
    [admin, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return context
}
