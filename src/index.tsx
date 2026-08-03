import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as BUI from '@thatopen/ui'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppShell } from './react-components/AppShell'
import { LoginPage } from './react-components/LoginPage'
import { ProtectedRoute } from './react-components/ProtectedRoute'
import { ProjectsPage } from './react-components/ProjectsPage'
import { ProjectDetailsPage } from './react-components/ProjectDetailsPage'
import { UsersPage } from './react-components/UsersPage'
import { ProjectsManager } from './class/ProjectsManager'
import { createDemoProjectsIfEmpty } from './storage/projectsStore'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import { ensureDefaultUsers } from './auth/authStore'
import { readAppTheme, writeAppTheme } from './theme/themeStore'

BUI.Manager.init()
ensureDefaultUsers()
writeAppTheme(readAppTheme())

;(() => {
  const id = 'app-theme-lock'
  document.getElementById(id)?.remove()
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    html.bim-ui-dark {
      color-scheme: dark;
      --bim-ui_bg-contrast-100: #f0f0f0 !important;
      --bim-label--c: #f3f4f6 !important;
    }
    html.bim-ui-light {
      color-scheme: light;
      --bim-ui_bg-contrast-100: #1a1a1e !important;
      --bim-label--c: #1a1a1e !important;
    }
    bim-label, bim-button, bim-text-input, bim-panel, bim-table {
      --bim-label--c: var(--text-primary) !important;
      --bim-icon--c: var(--text-primary) !important;
    }
  `
  document.head.appendChild(style)
})()

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['bim-grid']: any
      ['bim-label']: any
      ['bim-button']: any
      ['bim-text-input']: any
      ['bim-table']: any
      ['bim-dropdown']: any
      ['bim-option']: any
      ['bim-viewport']: any
      ['bim-panel']: any
      ['bim-panel-section']: any
      ['bim-toolbar']: any
      ['bim-toolbar-section']: any
    }
  }
}

const projectsManager = new ProjectsManager()
createDemoProjectsIfEmpty(projectsManager)

const rootElement = document.getElementById('app') as HTMLElement
const appRoot = ReactDOM.createRoot(rootElement)

appRoot.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route
                path="/"
                element={<ProjectsPage projectsManager={projectsManager} />}
              />
              <Route
                path="/project/:id"
                element={
                  <ProjectDetailsPage projectsManager={projectsManager} />
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
)
