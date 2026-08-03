import * as React from 'react'
import * as Router from 'react-router-dom'
import { ProjectsManager } from '../class/ProjectsManager'
import { ProjectsForm } from './ProjectsForm'
import { IFCViewer } from './IFCViewer'
import { saveProjectsToStorage } from '../storage/projectsStore'
import * as OBC from '@thatopen/components'
import * as BUI from '@thatopen/ui'
import { todoTool, TodoData, TodoCreator } from '../bim-components/TodoCreator'
import { useAuth } from '../auth/AuthContext'

interface Props {
  projectsManager: ProjectsManager
}

export function ProjectDetailsPage(props: Props) {
  const routeParams = Router.useParams<{ id: string }>()
  const { session, isAdmin } = useAuth()

  if (!routeParams.id) {
    return <p className="empty-state">Project not found</p>
  }

  const project = props.projectsManager.getProject(routeParams.id)

  if (!project) {
    return (
      <p className="empty-state">
        The Project ID {routeParams.id} wasn&apos;t found.
      </p>
    )
  }

  const canDelete =
    isAdmin || !project.ownerId || project.ownerId === session?.userId

  const components = new OBC.Components()
  const dashboard = React.useRef<HTMLDivElement>(null)
  const todoContainer = React.useRef<HTMLDivElement>(null)

  const navigateTo = Router.useNavigate()

  const onDelete = () => {
    if (!canDelete) return
    if (!window.confirm(`Delete project “${project.name}”?`)) return
    props.projectsManager.deleteProject(project.id)
    saveProjectsToStorage(props.projectsManager.list)
    navigateTo('/')
  }

  const onEditProjectClick = () => {
    const modal = document.getElementById('new-project-modal')
    if (!(modal && modal instanceof HTMLDialogElement)) return
    modal.showModal()
  }

  const onRowCreated = (event: any) => {
    event.stopImmediatePropagation()
    const { row } = event.detail
    row.addEventListener('click', () => {
      void todoCreator.highlightTodo({
        id: row.data.Id,
        name: row.data.Name,
        task: row.data.Task,
        priority: row.data.Priority,
        ifcGuids: JSON.parse(row.data.Guids),
        camera: JSON.parse(row.data.Camera),
      })
    })
  }

  const todoTable = BUI.Component.create<BUI.Table>(() => {
    return BUI.html`
      <bim-table @rowcreated=${onRowCreated}></bim-table>
    `
  })

  const addTodo = (data: TodoData) => {
    if (!todoTable) return
    const newData = {
      data: {
        Id: data.id,
        Name: data.name,
        Task: data.task,
        Priority: data.priority,
        Date: new Date().toDateString(),
        Guids: JSON.stringify(data.ifcGuids),
        Camera: data.camera ? JSON.stringify(data.camera) : '',
        Actions: '',
      },
    }
    todoTable.data = [...todoTable.data, newData]
    todoTable.hiddenColumns = ['Id', 'Guids', 'Camera']
  }

  const removeTodo = (deletedTodo: TodoData) => {
    if (!todoTable) return
    todoTable.data = todoTable.data.filter(
      (row: any) => row.data.Id !== deletedTodo.id
    )
  }

  const todoCreator = components.get(TodoCreator)
  todoCreator.onTodoCreated.add((data) => addTodo(data))
  todoCreator.onTodoDeleted.add((data) => removeTodo(data))

  React.useEffect(() => {
    dashboard.current?.appendChild(todoTable)

    todoTable.dataTransform = {
      Actions: (_value, rowData) => {
        const todoId = rowData.Id
        const todo = todoCreator.list.find((t) => t.id === todoId)
        if (!todo) return BUI.html``

        return BUI.html`
          <div style="display:flex; gap: 6px;">
            <bim-button
              @click=${() => todoCreator.deleteTodo(todo)}
              icon="material-symbols:delete"
              style="background-color: red;"
            ></bim-button>
            <bim-button
              icon="ion:navigate"
              @click=${() => void todoCreator.addTodoMarker(todo)}
            ></bim-button>
          </div>
        `
      },
    }

    const [todoButton, todoPriorityButton] = todoTool({ components })
    todoContainer.current?.appendChild(todoButton)
    todoContainer.current?.appendChild(todoPriorityButton)

    todoCreator.onDisposed.add(() => {
      todoTable.data = []
      todoTable.remove()
      todoButton.remove()
      todoPriorityButton.remove()
    })
  }, [])

  return (
    <div id="project-details" className="page">
      <ProjectsForm projectsManager={props.projectsManager} />
      <header className="page-header">
        <div>
          <h1 className="page-title" data-project-info="name">
            {project.name}
          </h1>
          <p className="page-subtitle" data-project-info="description">
            {project.description}
          </p>
        </div>
        <div className="page-actions">
          {canDelete ? (
            <button type="button" className="btn-danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
        </div>
      </header>
      <div className="main-page-content">
        <div className="project-sidebar">
          <div className="dashboard-card" style={{ padding: '30px 0' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0px 30px',
                marginBottom: 30,
              }}
            >
              <p
                style={{
                  fontSize: 20,
                  backgroundColor: '#ca8134',
                  aspectRatio: 1,
                  borderRadius: '100%',
                  padding: 12,
                  color: '#fff',
                  fontWeight: 700,
                  minWidth: 48,
                  textAlign: 'center',
                }}
              >
                {project.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? '')
                  .join('') || 'P'}
              </p>
              <div>
                <bim-button
                  label="Edit"
                  icon="material-symbols:edit"
                  className="btn-secondary"
                  onClick={() => onEditProjectClick()}
                ></bim-button>
              </div>
            </div>
            <div style={{ padding: '0 30px' }}>
              <div>
                <p className="card-title" data-project-info="cardName">
                  {project.name}
                </p>
                <p
                  className="card-subtitle"
                  data-project-info="cardDescription"
                >
                  {project.description}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  columnGap: 30,
                  padding: '30px 0px',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p className="meta-label">Status</p>
                  <p className="meta-value">{project.status}</p>
                </div>
                <div>
                  <p className="meta-label">Cost</p>
                  <p className="meta-value">${project.cost}</p>
                </div>
                <div>
                  <p className="meta-label">Role</p>
                  <p className="meta-value">{project.role}</p>
                </div>
                <div>
                  <p className="meta-label">Finish Date</p>
                  <p className="meta-value">{project.finishDate.toDateString()}</p>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#404040',
                  borderRadius: 9999,
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    width: `${project.progress * 100}%`,
                    backgroundColor: 'green',
                    padding: '4px 0',
                    textAlign: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {Math.round(project.progress * 100)}%
                </div>
              </div>
            </div>
          </div>
          <div
            className="dashboard-card"
            style={{ flexGrow: 1 }}
            ref={dashboard}
          >
            <div
              style={{
                padding: '20px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 className="page-title" style={{ fontSize: 'var(--font-lg)' }}>
                To-Do
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'end',
                  columnGap: 20,
                }}
                ref={todoContainer}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: 10,
                  }}
                >
                  <bim-label icon="material-symbols:search"></bim-label>
                  <bim-text-input placeholder="Search To-Do's name"></bim-text-input>
                </div>
              </div>
            </div>
          </div>
        </div>
        <IFCViewer components={components} />
      </div>
    </div>
  )
}

