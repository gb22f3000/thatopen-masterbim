import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import * as Router from 'react-router-dom'

import { Project } from '../class/Project'
import { ProjectsManager } from '../class/ProjectsManager'
import { ProjectCard } from './ProjectCard'
import { SearchBox } from './SearchBox'
import { ProjectsForm } from './ProjectsForm'
import { saveProjectsToStorage } from '../storage/projectsStore'
import { useAuth } from '../auth/AuthContext'

interface Props {
  projectsManager: ProjectsManager
}

export function ProjectsPage(props: Props) {
  const { session, isAdmin } = useAuth()
  const [projects, setProjects] = useState<Project[]>([
    ...props.projectsManager.list,
  ])
  const [query, setQuery] = useState('')

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

  const visible = useMemo(() => {
    let list = projects
    if (!isAdmin && session) {
      list = list.filter(
        (p) => !p.ownerId || p.ownerId === session.userId
      )
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [projects, isAdmin, session, query])

  const onNewProjectClick = () => {
    const modal = document.getElementById('new-project-modal')
    if (!(modal && modal instanceof HTMLDialogElement)) return
    modal.showModal()
  }

  useEffect(() => {
    const cancelButton = document.getElementById('close-modal-btn')
    const onCancel = () => {
      const modal = document.getElementById('new-project-modal')
      if (modal instanceof HTMLDialogElement) modal.close()
    }
    cancelButton?.addEventListener('click', onCancel)
    return () => cancelButton?.removeEventListener('click', onCancel)
  }, [])

  return (
    <div id="projects-page" className="page">
      <ProjectsForm projectsManager={props.projectsManager} />
      <header className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Administrator view — all workspaces'
              : 'Your workspaces and shared demos'}
          </p>
        </div>
        <SearchBox onChange={setQuery} />
        <div className="page-actions">
          {isAdmin ? (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  props.projectsManager.importFromJSON()
                  refresh()
                }}
              >
                Import
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => props.projectsManager.exportToJSON()}
              >
                Export
              </button>
            </>
          ) : null}
          <button type="button" className="btn-primary" onClick={onNewProjectClick}>
            New project
          </button>
        </div>
      </header>
      {visible.length > 0 ? (
        <div id="projects-list">
          {visible.map((project) => (
            <Router.Link to={`/project/${project.id}`} key={project.id}>
              <ProjectCard project={project} />
            </Router.Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">No projects match this view.</p>
      )}
    </div>
  )
}
