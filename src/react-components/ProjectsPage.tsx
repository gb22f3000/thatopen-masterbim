import * as React from 'react'
import { useState, useEffect } from 'react'
import * as Router from 'react-router-dom'

import { Project } from '../class/Project'
import { ProjectsManager } from '../class/ProjectsManager'
import { ProjectCard } from './ProjectCard'
import { SearchBox } from './SearchBox'
import { ProjectsForm } from './ProjectsForm'
import { saveProjectsToStorage } from '../storage/projectsStore'
import * as BUI from '@thatopen/ui'

interface Props {
  projectsManager: ProjectsManager
}

export function ProjectsPage(props: Props) {
  const [projects, setProjects] = useState<Project[]>([
    ...props.projectsManager.list,
  ])

  const refresh = () => {
    setProjects([...props.projectsManager.list])
    saveProjectsToStorage(props.projectsManager.list)
  }

  props.projectsManager.onProjectCreated = () => refresh()
  props.projectsManager.onProjectDeleted = () => refresh()
  props.projectsManager.onProjectUpdate = () => refresh()

  useEffect(() => {
    setProjects([...props.projectsManager.list])
  }, [])

  const projectCards = projects.map((project) => {
    return (
      <Router.Link to={`/project/${project.id}`} key={project.id}>
        <ProjectCard project={project} />
      </Router.Link>
    )
  })

  const onNewProjectClick = () => {
    const modal = document.getElementById('new-project-modal')
    if (!(modal && modal instanceof HTMLDialogElement)) return
    modal.showModal()
  }

  const onImportProject = () => {
    props.projectsManager.importFromJSON()
    refresh()
  }

  const onExportProject = () => {
    props.projectsManager.exportToJSON()
  }

  const onProjectSearch = (value: string) => {
    setProjects(props.projectsManager.filterProjects(value))
  }

  const importButton = BUI.Component.create<BUI.Button>(() => {
    return BUI.html`
      <bim-button
        id="import-projects-btn"
        icon="iconoir:import"
        @click=${onImportProject}
      ></bim-button>
    `
  })

  const exportButton = BUI.Component.create<BUI.Button>(() => {
    return BUI.html`
      <bim-button
        id="export-projects-btn"
        icon="ph:export"
        @click=${onExportProject}
      ></bim-button>
    `
  })

  const newProjectButton = BUI.Component.create<BUI.Button>(() => {
    return BUI.html`
      <bim-button
        id="new-project-btn"
        label="New project"
        icon="fluent:add-20-regular"
        @click=${onNewProjectClick}
      ></bim-button>
    `
  })

  useEffect(() => {
    const projectControls = document.getElementById('project-page-controls')
    projectControls?.appendChild(importButton)
    projectControls?.appendChild(exportButton)
    projectControls?.appendChild(newProjectButton)

    const cancelButton = document.getElementById('close-modal-btn')
    const onCancel = () => {
      const modal = document.getElementById('new-project-modal')
      if (modal instanceof HTMLDialogElement) modal.close()
    }
    cancelButton?.addEventListener('click', onCancel)

    return () => {
      importButton.remove()
      exportButton.remove()
      newProjectButton.remove()
      cancelButton?.removeEventListener('click', onCancel)
    }
  }, [])

  return (
    <div id="projects-page" className="page" style={{ display: 'block' }}>
      <ProjectsForm projectsManager={props.projectsManager} />
      <header>
        <bim-label>Projects</bim-label>
        <SearchBox onChange={(value) => onProjectSearch(value)} />
        <div
          id="project-page-controls"
          style={{ display: 'flex', alignItems: 'center', columnGap: 15 }}
        ></div>
      </header>
      {projects.length > 0 ? (
        <div id="projects-list">{projectCards}</div>
      ) : (
        <p>There are no projects to display</p>
      )}
    </div>
  )
}
