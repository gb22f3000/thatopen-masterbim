import * as React from 'react'
import { Project } from '../class/Project'

interface Props {
  project: Project
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
          }}
        >
          FP
        </p>
        <div>
          <bim-label
            style={
              {
                fontSize: '16px',
                fontWeight: 'bold',
                ['--bim-label--c' as any]: 'var(--text-primary)',
              } as React.CSSProperties
            }
          >
            {props.project.name}
          </bim-label>
          <bim-label
            className="muted"
            style={
              {
                ['--bim-label--c' as any]: 'var(--text-secondary)',
              } as React.CSSProperties
            }
          >
            {props.project.description}
          </bim-label>
        </div>
      </div>
      <div className="card-content">
        <div className="card-property">
          <bim-label className="muted">Status</bim-label>
          <bim-label>{props.project.status}</bim-label>
        </div>
        <div className="card-property">
          <bim-label className="muted">Role</bim-label>
          <bim-label>{props.project.role}</bim-label>
        </div>
        <div className="card-property">
          <bim-label className="muted">Cost</bim-label>
          <bim-label>${props.project.cost}</bim-label>
        </div>
        <div className="card-property">
          <bim-label className="muted">Estimated progress</bim-label>
          <bim-label>{props.project.progress * 100}%</bim-label>
        </div>
      </div>
    </div>
  )
}
