import { v4 as uuidv4 } from 'uuid'
import { Utils } from './Utils'

export type ProjectStatus = 'pending' | 'active' | 'finished'
export type Role = 'architect' | 'engineer' | 'developer'

export interface IProject {
  name: string
  description: string
  status: ProjectStatus
  role: Role
  finishDate: Date
  /** Owning auth user id — admins see all; users see own + shared demos */
  ownerId?: string
}

export class Project implements IProject {
  name: string
  description: string
  status: ProjectStatus
  role: Role
  finishDate: Date

  cost: number = 500000
  progress: number = 0.8
  id: string
  avatarColor: string = '#ffffff'
  ownerId?: string

  constructor(data: IProject, id = uuidv4()) {
    // Assign each property from data to this instance
    Object.assign(this, data)
    this.id = id
  }
}
