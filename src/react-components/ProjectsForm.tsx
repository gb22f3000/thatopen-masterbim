import * as React from 'react'
import { ProjectsManager } from '../class/ProjectsManager'
import { IProject, ProjectStatus, Role } from '../class/Project'
import { saveProjectsToStorage } from '../storage/projectsStore'
import { useAuth } from '../auth/AuthContext'

interface Props {
  projectsManager: ProjectsManager
}

export function ProjectsForm(props: Props) {
  const { session } = useAuth()

  const onFormSubmit = (e: React.FormEvent) => {
    const projectForm = document.getElementById('new-project-form')
    if (!(projectForm && projectForm instanceof HTMLFormElement)) {
      return
    }

    e.preventDefault()
    const formData = new FormData(projectForm)

    const projectData: IProject = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as ProjectStatus,
      role: formData.get('role') as Role,
      finishDate: new Date(formData.get('finishDate') as string),
      ownerId: session?.userId,
    }

    try {
      props.projectsManager.newProject(projectData)
      saveProjectsToStorage(props.projectsManager.list)
      projectForm.reset()

      const modal = document.getElementById('new-project-modal')
      if (modal instanceof HTMLDialogElement) {
        modal.close()
      }
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <dialog id="new-project-modal">
      <dialog id="error-modal" style={{ display: 'none' }}>
        <p id="error-message" style={{ padding: 10 }} />
        <button
          id="close-error-btn"
          type="button"
          style={{ backgroundColor: '#26282b', padding: 10 }}
        >
          Close
        </button>
      </dialog>

      <form id="new-project-form" onSubmit={onFormSubmit}>
        <h2>New Project</h2>
        <div className="input-list">
          <div className="form-field-container">
            <label htmlFor="project-name">Name</label>
            <input
              id="project-name"
              name="name"
              type="text"
              placeholder="What's the name of your project?"
            />
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--font-sm)',
                marginTop: 5,
                fontStyle: 'italic',
              }}
            >
              TIP: Give it a short name (min 5 characters)
            </p>
          </div>
          <div className="form-field-container">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              name="description"
              cols={30}
              rows={5}
              placeholder="Give your description here"
              defaultValue={''}
            />
          </div>
          <div className="form-field-container">
            <label htmlFor="project-role">Role</label>
            <select id="project-role" name="role" defaultValue="Architect">
              <option value="Architect">Architect</option>
              <option value="Engineer">Engineer</option>
              <option value="Developer">Developer</option>
            </select>
          </div>
          <div className="form-field-container">
            <label htmlFor="project-status">Status</label>
            <select id="project-status" name="status" defaultValue="Pending">
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Finished">Finished</option>
            </select>
          </div>
          <div className="form-field-container">
            <label htmlFor="finishDate">Finish Date</label>
            <input id="finishDate" type="date" name="finishDate" />
          </div>
        </div>
        <div className="botton-buttons">
          <div
            style={{
              display: 'flex',
              columnGap: 10,
              padding: '10px 20px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              id="close-modal-btn"
              type="button"
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              id="submit-project-btn"
              type="submit"
              name="submit"
              style={{
                backgroundColor: 'rgb(18, 145, 18)',
                width: '50%',
                borderRadius: '5px',
                justifyContent: 'center',
                border: 'none',
                color: 'white',
                padding: '10px',
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
