import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as BUI from '@thatopen/ui'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Sidebar } from './react-components/Sidebar'
import { ProjectsPage } from './react-components/ProjectsPage'
import { ProjectDetailsPage } from './react-components/ProjectDetailsPage'
import { UsersPage } from './react-components/UsersPage'
import { ProjectsManager } from './class/ProjectsManager'
import { createDemoProjectsIfEmpty } from './storage/projectsStore'

BUI.Manager.init()

// Force That Open UI dark tokens so labels stay light on dark surfaces
// (OS light mode otherwise makes --bim-ui_bg-contrast-100 dark → invisible on dark cards)
document.documentElement.classList.add('bim-ui-dark')
document.documentElement.classList.remove('bim-ui-light')

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
  <BrowserRouter>
    <Sidebar />
    <main id="content">
      <Routes>
        <Route
          path="/"
          element={<ProjectsPage projectsManager={projectsManager} />}
        />
        <Route
          path="/project/:id"
          element={<ProjectDetailsPage projectsManager={projectsManager} />}
        />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </main>
  </BrowserRouter>
)
