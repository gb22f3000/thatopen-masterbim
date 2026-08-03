import * as React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type LoginMode = 'admin' | 'user'

export function LoginPage() {
  const { login, isAuthenticated, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const [mode, setMode] = React.useState<LoginMode>('user')
  const [username, setUsername] = React.useState('user')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  React.useEffect(() => {
    if (mode === 'admin') {
      setUsername('admin')
      setPassword('')
    } else {
      setUsername('user')
      setPassword('')
    }
    setError('')
  }, [mode])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const result = login(username, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error || 'Login failed')
      return
    }
    navigate(from, { replace: true })
  }

  if (isAuthenticated && session) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="login-page">
      <div className="login-stage">
        <div className="login-brand">
          <p className="login-brand-mark">Master BIM</p>
          <h1 className="login-headline">Sign in to your workspace</h1>
          <p className="login-sub">
            Admin manages users and all projects. Users open models, measure,
            and coordinate inside assigned workspaces.
          </p>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={mode === 'user' ? 'active' : ''}
              aria-selected={mode === 'user'}
              onClick={() => setMode('user')}
            >
              User
            </button>
            <button
              type="button"
              role="tab"
              className={mode === 'admin' ? 'active' : ''}
              aria-selected={mode === 'admin'}
              onClick={() => setMode('admin')}
            >
              Admin
            </button>
          </div>

          <label className="login-field">
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : `Sign in as ${mode}`}
          </button>

          <div className="login-hints">
            <p>
              <strong>Admin</strong> — <code>admin</code> / <code>admin123</code>
            </p>
            <p>
              <strong>User</strong> — <code>user</code> / <code>user123</code>
            </p>
            <p>
              <strong>Engineer</strong> — <code>engineer</code> /{' '}
              <code>eng123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
