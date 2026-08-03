import { IProject, Project } from '../class/Project'

const STORAGE_KEY = 'thatopen-masterbim-projects'

function serializeProject(project: Project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    role: project.role,
    finishDate: project.finishDate.toISOString(),
    cost: project.cost,
    progress: project.progress,
    ownerId: project.ownerId,
  }
}

export function loadProjectsFromStorage(): IProject & { id?: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    return parsed.map((item) => ({
      ...(item as any),
      finishDate: new Date(String(item.finishDate)),
    }))
  } catch {
    return []
  }
}

export function saveProjectsToStorage(projects: Project[]) {
  const payload = projects.map(serializeProject)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function createDemoProjectsIfEmpty(manager: {
  list: Project[]
  newProject: (data: IProject, id?: string) => Project
}) {
  if (manager.list.length > 0) return

  const stored = loadProjectsFromStorage()
  if (stored.length > 0) {
    for (const project of stored) {
      try {
        manager.newProject(project, (project as any).id)
      } catch {
        // Skip invalid / duplicate entries
      }
    }
    return
  }

  manager.newProject({
    name: 'Demo School Campus',
    description:
      'Sample BIM project. Open it and load the demo Fragments model or your own IFC file.',
    status: 'active',
    role: 'architect',
    finishDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
  })

  manager.newProject({
    name: 'Office Tower Alpha',
    description: 'Commercial tower coordination workspace for architecture and structure.',
    status: 'pending',
    role: 'engineer',
    finishDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240),
  })

  saveProjectsToStorage(manager.list)
}
