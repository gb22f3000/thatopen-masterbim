import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'
import { APP_THEMES, AppThemeId } from '../theme/themeStore'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, logout, isAdmin } = useAuth()
  const { appTheme, setAppTheme } = useTheme()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials =
    session?.displayName
      ?.split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MB'

  return (
    <aside id="sidebar">
      <div className="sidebar-brand">
        <img id="company-logo" src="/assets/company-logo.svg" alt="" />
        <div>
          <p className="sidebar-brand-title">Master BIM</p>
          <p className="sidebar-brand-sub">That Open Engine</p>
        </div>
      </div>

      <ul id="nav-buttons">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <li>
            <span className="nav-icon material-symbols-rounded">apartment</span>
            <span>Projects</span>
          </li>
        </Link>
        {isAdmin ? (
          <Link
            to="/users"
            className={location.pathname.startsWith('/users') ? 'active' : ''}
          >
            <li>
              <span className="nav-icon material-symbols-rounded">group</span>
              <span>Users</span>
            </li>
          </Link>
        ) : null}
      </ul>

      <div className="sidebar-theme">
        <p className="sidebar-section-label">Workspace theme</p>
        <div className="theme-chip-row">
          {(Object.keys(APP_THEMES) as AppThemeId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`theme-chip ${appTheme === id ? 'active' : ''}`}
              onClick={() => setAppTheme(id)}
              title={APP_THEMES[id].description}
            >
              {APP_THEMES[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">
              {session?.displayName || 'Signed out'}
            </div>
            <div className="sidebar-user-role">
              {session?.role === 'admin' ? 'Administrator' : 'Project user'}
            </div>
          </div>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            logout
          </span>
          Log out
        </button>
      </div>
    </aside>
  )
}
