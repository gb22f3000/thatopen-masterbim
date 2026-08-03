import * as React from 'react'
import { Project } from '../class/Project'

interface Props {
  project: Project
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'P'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function ProjectCard(props: Props) {
  return (
    <div className="project-card">
      <div className="card-header">
        <p
          style={{
            backgroundColor: '#ca8134',
            padding: 10,
            borderRadius: 8,
            aspectRatio: 1,
            color: '#fff',
            fontWeight: 700,
            minWidth: 40,
            textAlign: 'center',
          }}
        >
          {initials(props.project.name)}
        </p>
        <div>
          <p className="card-title">{props.project.name}</p>
          <p className="card-subtitle">{props.project.description}</p>
        </div>
      </div>
      <div className="card-content">
        <div className="card-property">
          <span className="meta-label">Status</span>
          <span className="meta-value">{props.project.status}</span>
        </div>
        <div className="card-property">
          <span className="meta-label">Role</span>
          <span className="meta-value">{props.project.role}</span>
        </div>
        <div className="card-property">
          <span className="meta-label">Cost</span>
          <span className="meta-value">${props.project.cost}</span>
        </div>
        <div className="card-property">
          <span className="meta-label">Estimated progress</span>
          <span className="meta-value">
            {Math.round(props.project.progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
