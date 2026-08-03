import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/** Authenticated chrome: sidebar + main content outlet. */
export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main id="content">
        <Outlet />
      </main>
    </div>
  )
}
