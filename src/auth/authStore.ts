export type UserRole = 'admin' | 'user'

export interface AppUser {
  id: string
  username: string
  displayName: string
  role: UserRole
  password: string
}

export interface AuthSession {
  userId: string
  username: string
  displayName: string
  role: UserRole
  loggedInAt: string
}

export const AUTH_USERS_KEY = 'thatopen-masterbim-users'
export const AUTH_SESSION_KEY = 'thatopen-masterbim-session'

/** Demo accounts for local / deploy demos — change passwords before production. */
export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'admin-001',
    username: 'admin',
    displayName: 'Site Admin',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: 'user-001',
    username: 'user',
    displayName: 'Project User',
    role: 'user',
    password: 'user123',
  },
  {
    id: 'user-002',
    username: 'engineer',
    displayName: 'Field Engineer',
    role: 'user',
    password: 'eng123',
  },
]

export function ensureDefaultUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fall through
  }
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(DEFAULT_USERS))
  return [...DEFAULT_USERS]
}

export function listUsersPublic() {
  return ensureDefaultUsers().map(({ password: _p, ...rest }) => rest)
}

export function authenticate(
  username: string,
  password: string
): AuthSession | null {
  const users = ensureDefaultUsers()
  const found = users.find(
    (u) =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password
  )
  if (!found) return null
  return {
    userId: found.id,
    username: found.username,
    displayName: found.displayName,
    role: found.role,
    loggedInAt: new Date().toISOString(),
  }
}

export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (!session?.userId || !session?.role) return null
    return session
  } catch {
    return null
  }
}

export function writeSession(session: AuthSession) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY)
}
