import * as THREE from 'three'
import * as OBC from '@thatopen/components'
import * as OBCF from '@thatopen/components-front'
import * as BUI from '@thatopen/ui'
import { TodoData, TodoInput } from './base-types'

export class TodoCreator extends OBC.Component implements OBC.Disposable {
  static uuid = '43eda07b-486c-44a3-b10d-80d144de4155'
  enabled = true
  onTodoCreated = new OBC.Event<TodoData>()
  onTodoDeleted = new OBC.Event<TodoData>()
  onDisposed = new OBC.Event<any>()

  private _world: OBC.World
  private _list: TodoData[] = []
  private _markers = new Map<string, OBCF.Mark>()

  constructor(components: OBC.Components) {
    super(components)
    this.components.add(TodoCreator.uuid, this)
  }

  async dispose() {
    this.enabled = false
    for (const marker of this._markers.values()) {
      marker.dispose()
    }
    this._markers.clear()
    this._list = []
    this.onDisposed.trigger()
  }

  setup() {
    const highlighter = this.components.get(OBCF.Highlighter)
    const styles: Array<{ id: string; color: string }> = [
      { id: 'Low', color: '#59bc59' },
      { id: 'Medium', color: '#597cff' },
      { id: 'High', color: '#ff7676' },
    ]

    for (const style of styles) {
      const name = `${TodoCreator.uuid}-priority-${style.id}`
      if (!highlighter.styles.has(name)) {
        highlighter.styles.set(name, {
          color: new THREE.Color(style.color),
          opacity: 1,
          transparent: false,
          renderedFaces: 0,
        })
      }
    }
  }

  set world(world: OBC.World) {
    this._world = world
  }

  set enablePriorityHighlight(value: boolean) {
    if (!this.enabled) return

    const fragments = this.components.get(OBC.FragmentsManager)
    const highlighter = this.components.get(OBCF.Highlighter)

    if (value) {
      for (const todo of this._list) {
        void fragments.guidsToModelIdMap(todo.ifcGuids).then((modelIdMap) => {
          highlighter.highlightByID(
            `${TodoCreator.uuid}-priority-${todo.priority}`,
            modelIdMap,
            false,
            false
          )
        })
      }
    } else {
      void highlighter.clear()
    }
  }

  get list(): TodoData[] {
    return [...this._list]
  }

  async addTodo(data: TodoInput) {
    if (!this.enabled) return

    const fragments = this.components.get(OBC.FragmentsManager)
    const highlighter = this.components.get(OBCF.Highlighter)
    const selection = highlighter.selection.select
    const guids = await fragments.modelIdMapToGuids(selection)

    const camera = this._world.camera
    if (!camera.hasCameraControls()) {
      throw new Error(
        'Camera controls are not available in the current camera setup.'
      )
    }

    const position = new THREE.Vector3()
    camera.controls.getPosition(position)
    const target = new THREE.Vector3()
    camera.controls.getTarget(target)

    const todoData: TodoData = {
      id: OBC.UUID.create(),
      name: data.name,
      task: data.task,
      priority: data.priority,
      ifcGuids: guids,
      camera: { position, target },
    }

    this._list.push(todoData)
    this.onTodoCreated.trigger(todoData)
  }

  deleteTodo(todo: TodoData) {
    if (!this.enabled) return

    const marker = this._markers.get(todo.id)
    if (marker) {
      marker.dispose()
      this._markers.delete(todo.id)
    }

    this._list = this._list.filter((t) => t.id !== todo.id)
    this.onTodoDeleted.trigger(todo)
  }

  async highlightTodo(todo: TodoData) {
    if (!this.enabled) return

    const fragments = this.components.get(OBC.FragmentsManager)
    const modelIdMap = await fragments.guidsToModelIdMap(todo.ifcGuids)
    const highlighter = this.components.get(OBCF.Highlighter)
    await highlighter.highlightByID('select', modelIdMap)

    if (!this._world) {
      throw new Error('World is not set for TodoCreator')
    }

    const camera = this._world.camera
    if (!camera.hasCameraControls()) {
      throw new Error(
        'Camera controls are not available in the current camera setup.'
      )
    }

    await camera.controls.setLookAt(
      todo.camera.position.x,
      todo.camera.position.y,
      todo.camera.position.z,
      todo.camera.target.x,
      todo.camera.target.y,
      todo.camera.target.z,
      true
    )
  }

  async addTodoMarker(todo: TodoData) {
    if (!this.enabled) return
    if (todo.ifcGuids.length === 0) return
    if (this._markers.has(todo.id)) return

    const fragments = this.components.get(OBC.FragmentsManager)
    const modelIdMap = await fragments.guidsToModelIdMap(todo.ifcGuids)
    const boundingBoxer = this.components.get(OBC.BoundingBoxer)
    const center = await boundingBoxer.getCenter(modelIdMap)

    const label = BUI.Component.create<BUI.Label>(() => {
      return BUI.html`
        <bim-label
          @mouseover=${() => {
            const highlighter = this.components.get(OBCF.Highlighter)
            void highlighter.highlightByID('hover', modelIdMap, true, false)
          }}
          style="background-color: var(--bim-ui_bg-contrast-100); cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 999px; pointer-events: all;"
          icon="fa:map-marker"
        ></bim-label>
      `
    })

    const marker = new OBCF.Mark(this._world, label)
    marker.three.position.copy(center)
    this._markers.set(todo.id, marker)
  }
}
