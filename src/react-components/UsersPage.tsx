import * as React from 'react'
import { useEffect, useState } from 'react'
import { listUsersPublic } from '../auth/authStore'
import { useAuth } from '../auth/AuthContext'

type PublicUser = ReturnType<typeof listUsersPublic>[number]

export function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    setUsers(listUsersPublic())
  }, [])

  if (!isAdmin) {
    return (
      <div className="page">
        <p className="empty-state">Administrators only.</p>
      </div>
    )
  }

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  return (
    <div id="users-page" className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            Local accounts for Admin and User roles (demo credentials)
          </p>
        </div>
        <input
          className="search-native"
          placeholder="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="users-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Display name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}</td>
                <td>
                  <code>{u.username}</code>
                </td>
                <td>
                  <span className={`role-pill role-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  {u.role === 'admin'
                    ? 'All projects · Users page'
                    : 'Own projects · BIM tools'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint-block">
          Demo passwords: <code>admin123</code>, <code>user123</code>,{' '}
          <code>eng123</code>. Replace with a real identity provider before
          production hardening.
        </p>
      </div>
    </div>
  )
}
