import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as store from './store'
import type { SessionUser } from './store'

interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<SessionUser>
  register: (input: store.RegisterInput) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => store.getSession())

  // Token kedaluwarsa atau akun dinonaktifkan → keluar dari sesi lokal.
  useEffect(() => {
    const onUnauthorized = () => {
      store.setSession(null)
      setUser(null)
    }
    window.addEventListener('lapor:unauthorized', onUnauthorized)
    return () => window.removeEventListener('lapor:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await store.login(email, password)
    store.setSession(session)
    setUser(session)
    return session
  }, [])

  const register = useCallback(async (input: store.RegisterInput) => {
    const session = await store.register(input)
    store.setSession(session)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    store.setSession(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return context
}
