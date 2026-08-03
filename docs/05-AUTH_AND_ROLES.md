# 05 — Auth & roles (with code)

## Seeded users

Defined in `src/auth/authStore.ts`:

```ts
export const DEFAULT_USERS: AppUser[] = [
  { id: 'admin-001', username: 'admin', displayName: 'Site Admin', role: 'admin', password: 'admin123' },
  { id: 'user-001', username: 'user', displayName: 'Project User', role: 'user', password: 'user123' },
  { id: 'user-002', username: 'engineer', displayName: 'Field Engineer', role: 'user', password: 'eng123' },
]
```

## Login

```ts
const next = authenticate(username, password)
if (!next) return { ok: false, error: 'Invalid username or password.' }
writeSession(next)
```

Session shape:

```ts
type AuthSession = {
  userId: string
  username: string
  displayName: string
  role: 'admin' | 'user'
  loggedInAt: string
}
```

## Route guard

```tsx
<ProtectedRoute>
  <AppShell />
</ProtectedRoute>

<ProtectedRoute adminOnly>
  <UsersPage />
</ProtectedRoute>
```

Unauthenticated → `/login`  
Non-admin on admin route → `/`

## React context

```tsx
const { session, isAdmin, login, logout } = useAuth()
```

## Production hardening

Replace `authenticate()` body with Firebase Auth / JWT API while keeping `AuthSession` and `ProtectedRoute` unchanged.
