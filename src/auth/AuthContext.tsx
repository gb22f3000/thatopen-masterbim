import * as React from 'react'
import {
  AuthSession,
  authenticate,
  clearSession,
  readSession,
  writeSession,
  ensureDefaultUsers,
  UserRole,
} from './authStore'

type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  role: UserRole | null
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(() => {
    ensureDefaultUsers()
    return readSession()
  })

  const login = (username: string, password: string) => {
    const next = authenticate(username, password)
    if (!next) {
      return { ok: false, error: 'Invalid username or password.' }
    }
    writeSession(next)
    setSession(next)
    return { ok: true }
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  const value: AuthContextValue = {
    session,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === 'admin',
    login,
    logout,
    role: session?.role ?? null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
