import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import * as OBC from '@thatopen/components'
import * as OBCF from '@thatopen/components-front'
import * as BUI from '@thatopen/ui'
import * as CUI from '@thatopen/ui-obc'
import * as FRAGS from '@thatopen/fragments'
// Local worker avoids unpkg/blob failures that break .frag loading
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url'
import { TodoCreator } from '../bim-components/TodoCreator'
import { SimpleQTO, qtoTool } from '../bim-components/SimpleQTO'
import {
  convertIfcToFrag,
  downloadFragFile,
} from '../bim-components/IfcConverter'
import { useTheme } from '../theme/ThemeContext'
import {
  VIEWER_BACKGROUNDS,
  ViewerBgId,
} from '../theme/themeStore'

interface Props {
  components: OBC.Components
}

const DEMO_FRAG_URL =
  'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag'

export function IFCViewer(props: Props) {
  const components = props.components
  const { viewerBg, setViewerBg } = useTheme()
  const viewerBgRef = useRef(viewerBg)
  viewerBgRef.current = viewerBg
  const worldRef = useRef<OBC.SimpleWorld<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBCF.PostproductionRenderer
  > | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  const applyViewerBackground = (id: ViewerBgId) => {
    const cfg = VIEWER_BACKGROUNDS[id]
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = cfg.css
    }
    const scene = worldRef.current?.scene?.three
    if (scene) {
      scene.background = new THREE.Color(cfg.hex)
    }
  }

  useEffect(() => {
    applyViewerBackground(viewerBg)
  }, [viewerBg])

  useEffect(() => {
    let disposed = false
    let world: OBC.SimpleWorld<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBCF.PostproductionRenderer
    > | null = null
    let floatingGrid: BUI.Grid | null = null
    let resizeObserver: ResizeObserver | null = null

    const cleanupFns: Array<() => void> = []

    const init = async () => {
      const viewerContainer = document.getElementById(
        'viewer-container'
      ) as HTMLElement | null
      if (!viewerContainer || disposed) return

      containerRef.current = viewerContainer
      const initialBg = VIEWER_BACKGROUNDS[viewerBgRef.current]
      viewerContainer.style.backgroundColor = initialBg.css
      viewerContainer.style.borderRadius = '12px'
      viewerContainer.style.overflow = 'hidden'

      const worlds = components.get(OBC.Worlds)
      world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBCF.PostproductionRenderer
      >()
      worldRef.current = world

      world.scene = new OBC.SimpleScene(components)
      world.scene.setup()
      world.scene.three.background = new THREE.Color(initialBg.hex)

      world.renderer = new OBCF.PostproductionRenderer(
        components,
        viewerContainer
      )
      world.camera = new OBC.OrthoPerspectiveCamera(components)

      components.init()

      world.renderer.postproduction.enabled = true
      await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25)
      world.camera.updateAspect()

      components.get(OBC.Raycasters).get(world)
      components.get(OBC.Grids).create(world)

      if (disposed) return

      const fragments = components.get(OBC.FragmentsManager)
      if (!fragments.initialized) {
        fragments.init(fragmentsWorkerUrl)
      }

      world.camera.controls.addEventListener('update', () => {
        fragments.core.update()
      })

      world.onCameraChanged.add((camera) => {
        for (const [, model] of fragments.list) {
          model.useCamera(camera.three)
        }
        fragments.core.update(true)
      })

      fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(world!.camera.three)
        world!.scene.three.add(model.object)
        fragments.core.update(true)
      })

      fragments.core.models.materials.list.onItemSet.add(
        ({ value: material }) => {
          if (!('isLodMaterial' in material && material.isLodMaterial)) {
            material.polygonOffset = true
            material.polygonOffsetUnits = 1
            material.polygonOffsetFactor = Math.random()
          }
        }
      )

      const uniqueModelId = (base: string) => {
        const cleaned = base.replace(/[^\w.-]+/g, '_') || 'model'
        if (!fragments.list.has(cleaned)) return cleaned
        return `${cleaned}-${Date.now()}`
      }

      const notifyError = (action: string, error: unknown) => {
        console.error(`[IFCViewer] ${action} failed`, error)
        const message =
          error instanceof Error ? error.message : String(error)
        const isOldFormat =
          /flatbuffer|offset|version|magic|invalid|corrupt|parse/i.test(
            message
          )
        window.alert(
          isOldFormat
            ? `${action} failed.\n\nThis looks like an old Fragments v2 .frag file. Engine 3.x only opens v3 .frag files.\n\nFix: load the original IFC (Load IFC) or convert it again with That Open v3, then save a new .frag.\n\nDetails: ${message}`
            : `${action} failed.\n\n${message}`
        )
      }

      const loadFragBuffer = async (
        buffer: ArrayBuffer,
        modelId: string
      ) => {
        const data = new Uint8Array(buffer)
        // Tiny heuristic: empty / tiny files are never valid v3 fragments
        if (data.byteLength < 64) {
          throw new Error(
            'File is too small to be a valid Fragments model.'
          )
        }

        const id = uniqueModelId(modelId)
        const model = await fragments.core.load(data, {
          modelId: id,
          camera: world!.camera.three,
        })
        await fragments.core.update(true)
        // Ensure renderer has real pixel size before fitting camera
        world!.renderer?.resize()
        world!.camera.updateAspect()
        await fitToModels()
        return model
      }

      const ifcLoader = components.get(OBC.IfcLoader)
      // Local WASM (public/wasm) — avoids slow unpkg downloads on every IFC load
      const wasmPath = `${window.location.origin}/wasm/`
      await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: wasmPath,
          absolute: true,
        },
      })
      // Faster IFC parsing defaults
      ifcLoader.settings.webIfc = {
        ...ifcLoader.settings.webIfc,
        COORDINATE_TO_ORIGIN: true,
      }

      const highlighter = components.get(OBCF.Highlighter)
      highlighter.setup({
        world,
        selectMaterialDefinition: {
          color: new THREE.Color('#bcf124'),
          opacity: 1,
          transparent: false,
          renderedFaces: 0,
        },
      })
      highlighter.zoomToSelection = true

      const lengthMeasurer = components.get(OBCF.LengthMeasurement)
      lengthMeasurer.world = world
      lengthMeasurer.color = new THREE.Color('#494cb6')
      lengthMeasurer.mode = 'free'
      lengthMeasurer.snappings = [
        FRAGS.SnappingClass.POINT,
        FRAGS.SnappingClass.LINE,
      ]
      lengthMeasurer.enabled = false

      const areaMeasurer = components.get(OBCF.AreaMeasurement)
      areaMeasurer.world = world
      areaMeasurer.color = new THREE.Color('#6528d7')
      areaMeasurer.mode = 'free'
      areaMeasurer.snappings = [
        FRAGS.SnappingClass.POINT,
        FRAGS.SnappingClass.LINE,
        FRAGS.SnappingClass.FACE,
      ]
      areaMeasurer.enabled = false

      const clipper = components.get(OBC.Clipper)
      clipper.enabled = false

      const todoCreator = components.get(TodoCreator)
      todoCreator.world = world
      todoCreator.setup()

      type ToolMode = 'select' | 'length' | 'area' | 'clip'
      let activeToolMode: ToolMode = 'select'

      const measureHint = document.createElement('div')
      measureHint.className = 'viewer-tool-hint'
      measureHint.hidden = true
      viewerContainer.appendChild(measureHint)
      cleanupFns.push(() => measureHint.remove())

      const toolHints: Record<ToolMode, string> = {
        select: '',
        length:
          'Length: hover until snap marker appears → double-click start → double-click end. Delete removes hovered dimension. Esc cancels.',
        area:
          'Area: double-click 3+ boundary points → press Enter to close polygon. Esc cancels. Delete removes hovered area.',
        clip:
          'Clip: double-click a surface to place a section plane. Delete removes hovered clip.',
      }

      const setMeasureHint = (mode: ToolMode) => {
        const text = toolHints[mode]
        if (!text) {
          measureHint.hidden = true
          measureHint.textContent = ''
          return
        }
        measureHint.hidden = false
        measureHint.textContent = text
      }

      const syncToolButtons = () => {
        const map: Record<string, ToolMode> = {
          'tool-select': 'select',
          'tool-length': 'length',
          'tool-area': 'area',
          'tool-clip': 'clip',
        }
        for (const [id, mode] of Object.entries(map)) {
          const btn = viewerContainer.querySelector(
            `[data-tool="${id}"]`
          ) as BUI.Button | null
          if (btn) btn.active = activeToolMode === mode
        }
      }

      const setToolMode = (mode: ToolMode) => {
        // Always disable first so Measurement.cancelCreation runs cleanly
        lengthMeasurer.enabled = false
        areaMeasurer.enabled = false
        clipper.enabled = false

        activeToolMode = mode

        if (mode === 'length') {
          lengthMeasurer.mode = 'free'
          lengthMeasurer.snappings = [
            FRAGS.SnappingClass.POINT,
            FRAGS.SnappingClass.LINE,
          ]
          lengthMeasurer.enabled = true
          highlighter.enabled = false
          void highlighter.clear('select')
        } else if (mode === 'area') {
          areaMeasurer.mode = 'free'
          areaMeasurer.snappings = [
            FRAGS.SnappingClass.POINT,
            FRAGS.SnappingClass.LINE,
            FRAGS.SnappingClass.FACE,
          ]
          areaMeasurer.enabled = true
          highlighter.enabled = false
          void highlighter.clear('select')
        } else if (mode === 'clip') {
          clipper.enabled = true
          highlighter.enabled = false
          void highlighter.clear('select')
        } else {
          highlighter.enabled = true
        }

        setMeasureHint(mode)
        syncToolButtons()
      }

      const clearAllMeasurements = () => {
        lengthMeasurer.list.clear()
        areaMeasurer.list.clear()
      }

      const onDblClick = (event: MouseEvent) => {
        // Ignore double-clicks that land on floating UI controls
        const target = event.target as HTMLElement | null
        if (
          target?.closest?.(
            'bim-toolbar, bim-panel, bim-button, bim-text-input, bim-table'
          )
        ) {
          return
        }
        if (lengthMeasurer.enabled) void lengthMeasurer.create()
        else if (areaMeasurer.enabled) void areaMeasurer.create()
        else if (clipper.enabled) void clipper.create(world!)
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Enter' || event.code === 'NumpadEnter') {
          if (areaMeasurer.enabled) {
            event.preventDefault()
            areaMeasurer.endCreation()
          }
          return
        }

        if (event.code === 'Escape') {
          if (lengthMeasurer.enabled) lengthMeasurer.cancelCreation()
          if (areaMeasurer.enabled) areaMeasurer.cancelCreation()
          return
        }

        if (event.code === 'Delete' || event.code === 'Backspace') {
          // Don't steal Backspace while typing in inputs
          const el = event.target as HTMLElement | null
          if (
            el &&
            (el.tagName === 'INPUT' ||
              el.tagName === 'TEXTAREA' ||
              el.isContentEditable)
          ) {
            return
          }
          if (lengthMeasurer.enabled) lengthMeasurer.delete()
          else if (areaMeasurer.enabled) areaMeasurer.delete()
          else if (clipper.enabled) void clipper.delete(world!)
        }
      }

      viewerContainer.addEventListener('dblclick', onDblClick)
      window.addEventListener('keydown', onKeyDown)
      cleanupFns.push(() => {
        viewerContainer.removeEventListener('dblclick', onDblClick)
        window.removeEventListener('keydown', onKeyDown)
      })

      resizeObserver = new ResizeObserver(() => {
        world?.renderer?.resize()
        world?.camera?.updateAspect()
      })
      resizeObserver.observe(viewerContainer)

      const fitToModels = async () => {
        if (!world || fragments.list.size === 0) return
        const boxer = components.get(OBC.BoundingBoxer)
        boxer.list.clear()
        boxer.addFromModels()
        const box = boxer.get()
        const sphere = new THREE.Sphere()
        box.getBoundingSphere(sphere)
        await world.camera.controls.fitToSphere(sphere, true)
        boxer.list.clear()
      }

      const loadDemoModel = async () => {
        try {
          const file = await fetch(DEMO_FRAG_URL)
          if (!file.ok) {
            throw new Error(`Could not download demo model (${file.status})`)
          }
          const buffer = await file.arrayBuffer()
          await loadFragBuffer(buffer, 'school_arq')
        } catch (error) {
          notifyError('Demo model load', error)
        }
      }

      const setLoadingButton = (btn: BUI.Button | null, loading: boolean, label?: string) => {
        if (!btn) return
        btn.loading = loading
        if (label !== undefined) btn.tooltipTitle = label
      }

      let ifcLoadButton: BUI.Button | null = null
      let ifcConvertButton: BUI.Button | null = null

      const onIfcImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.ifc'
        input.addEventListener('change', async () => {
          const file = input.files?.[0]
          if (!file) return

          const started = performance.now()
          setLoadingButton(ifcLoadButton, true, 'Converting IFC…')
          try {
            const result = await convertIfcToFrag({
              components,
              file,
              wasmPath,
              loadIntoViewer: true,
              onProgress: ({ percent, message }) => {
                setLoadingButton(
                  ifcLoadButton,
                  true,
                  message || `IFC ${percent}%`
                )
              },
            })

            await fragments.core.update(true)
            world!.renderer?.resize()
            world!.camera.updateAspect()
            await fitToModels()

            const seconds = (
              (performance.now() - started) /
              1000
            ).toFixed(1)
            setLoadingButton(ifcLoadButton, false, 'Load IFC')

            const saveFrag = window.confirm(
              `IFC converted in ${seconds}s and loaded into the viewer.\n\nDownload a .frag file for fast reload next time?`
            )
            if (saveFrag) {
              downloadFragFile(result.fragBuffer, result.fileName)
            }
          } catch (error) {
            setLoadingButton(ifcLoadButton, false, 'Load IFC')
            notifyError(`IFC import "${file.name}"`, error)
          }
        })
        input.click()
      }

      const onIfcConvertOnly = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.ifc'
        input.multiple = true
        input.addEventListener('change', async () => {
          const files = [...(input.files ?? [])]
          if (files.length === 0) return

          setLoadingButton(ifcConvertButton, true, 'Converting…')
          const loadAfter = window.confirm(
            `${files.length} IFC file(s) selected.\n\nOK = convert, download .frag, AND load into viewer\nCancel = convert & download only (no viewer load)`
          )

          let ok = 0
          try {
            for (let i = 0; i < files.length; i++) {
              const file = files[i]
              setLoadingButton(
                ifcConvertButton,
                true,
                `File ${i + 1}/${files.length}`
              )
              const result = await convertIfcToFrag({
                components,
                file,
                wasmPath,
                loadIntoViewer: loadAfter,
                onProgress: ({ percent, message }) => {
                  setLoadingButton(
                    ifcConvertButton,
                    true,
                    `${i + 1}/${files.length}: ${message || percent + '%'}`
                  )
                },
              })
              downloadFragFile(result.fragBuffer, result.fileName)
              ok++
            }

            if (loadAfter) {
              await fragments.core.update(true)
              world!.renderer?.resize()
              world!.camera.updateAspect()
              await fitToModels()
            }

            window.alert(
              `Converted ${ok}/${files.length} IFC file(s) to .frag.\nSaved downloads to your browser download folder.`
            )
          } catch (error) {
            notifyError('IFC → .frag conversion', error)
          } finally {
            setLoadingButton(ifcConvertButton, false, 'Convert IFC')
          }
        })
        input.click()
      }

      const onFragmentExport = async () => {
        try {
          const [model] = fragments.list.values()
          if (!model) {
            window.alert('No Fragments model is loaded to export.')
            return
          }
          const fragsBuffer = await model.getBuffer(false)
          const file = new File([fragsBuffer], `${model.modelId}.frag`)
          const link = document.createElement('a')
          link.href = URL.createObjectURL(file)
          link.download = file.name
          link.click()
          URL.revokeObjectURL(link.href)
        } catch (error) {
          notifyError('Export .frag', error)
        }
      }

      const onFragmentImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.frag'
        input.addEventListener('change', async () => {
          const file = input.files?.[0]
          if (!file) return
          try {
            const buffer = await file.arrayBuffer()
            const modelId =
              file.name.replace(/\.frag$/i, '') || `model-${Date.now()}`
            await loadFragBuffer(buffer, modelId)
          } catch (error) {
            notifyError(`Import "${file.name}"`, error)
          }
        })
        input.click()
      }

      const onFragmentDispose = async () => {
        const ids = [...fragments.list.keys()]
        for (const id of ids) {
          await fragments.core.disposeModel(id)
        }
      }

      const onToggleVisibility = async () => {
        const selection = highlighter.selection.select
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return
        const hider = components.get(OBC.Hider)
        await hider.toggle(selection)
      }

      const onIsolate = async () => {
        const selection = highlighter.selection.select
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return
        const hider = components.get(OBC.Hider)
        await hider.isolate(selection)
      }

      const onShowAll = async () => {
        const hider = components.get(OBC.Hider)
        await hider.set(true)
      }

      const onClassify = async () => {
        const classifier = components.get(OBC.Classifier)
        await classifier.byCategory()
        await classifier.byIfcBuildingStorey({ classificationName: 'Levels' })
        if (floatingGrid) floatingGrid.layout = 'classifier'
      }

      // ---- UI ----
      floatingGrid = BUI.Component.create<BUI.Grid>(() => {
        return BUI.html`
          <bim-grid floating style="padding: 20px"></bim-grid>
        `
      })

      const [propsTable, updatePropsTable] = CUI.tables.itemsData({
        components,
        modelIdMap: {},
      })

      highlighter.events.select.onHighlight.add(async (modelIdMap) => {
        if (!floatingGrid) return
        floatingGrid.layout = 'second'
        updatePropsTable({ modelIdMap })
        propsTable.expanded = false

        const simpleQTO = components.get(SimpleQTO)
        await simpleQTO.sumQuantities(modelIdMap)
      })

      highlighter.events.select.onClear.add(() => {
        updatePropsTable({ modelIdMap: {} })
        if (floatingGrid && floatingGrid.layout === 'second') {
          floatingGrid.layout = 'main'
        }
        components.get(SimpleQTO).resetQuantities()
      })

      const elementPropertyPanel = BUI.Component.create<BUI.Panel>(() => {
        const search = (e: Event) => {
          const input = e.target as BUI.TextInput
          propsTable.queryString = input.value
        }

        return BUI.html`
          <bim-panel>
            <bim-panel-section
              name="property"
              label="Property Information"
              icon="solar:document-bold"
              fixed
            >
              <bim-text-input @input=${search} placeholder="Search..."></bim-text-input>
              ${propsTable}
            </bim-panel-section>
          </bim-panel>
        `
      })

      const [modelsList] = CUI.tables.modelsList({
        components,
        actions: { visibility: true, download: true, dispose: true },
      })

      const [spatialTree, updateSpatialTree] = CUI.tables.spatialTree({
        components,
        models: fragments.list.values(),
      })

      fragments.list.onItemSet.add(() => {
        updateSpatialTree({ models: fragments.list.values() })
      })

      fragments.list.onItemDeleted.add(() => {
        updateSpatialTree({ models: fragments.list.values() })
      })

      const modelsPanel = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
          <bim-panel>
            <bim-panel-section name="models" label="Models" icon="tabler:box" fixed>
              ${modelsList}
            </bim-panel-section>
          </bim-panel>
        `
      })

      const classifierPanel = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
          <bim-panel>
            <bim-panel-section
              name="classifier"
              label="Spatial / Categories"
              icon="tabler:sitemap"
              fixed
            >
              <bim-button label="Build Classifications" @click=${onClassify}></bim-button>
              ${spatialTree}
            </bim-panel-section>
          </bim-panel>
        `
      })

      const qtoTable = qtoTool({ components })
      const qtoPanel = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
          <bim-panel>
            <bim-panel-section
              name="qto"
              label="Quantities"
              icon="mdi:summation"
              fixed
            >
              ${qtoTable}
            </bim-panel-section>
          </bim-panel>
        `
      })

      const toolsPanel = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
          <bim-panel>
            <bim-panel-section name="tools" label="Tools Help" icon="mdi:help-circle" fixed>
              <bim-label>Select: click elements (Ctrl+click multi)</bim-label>
              <bim-label>Length: double-click start point, then double-click end point</bim-label>
              <bim-label>Area: double-click 3+ polygon points, then press Enter</bim-label>
              <bim-label>Esc: cancel in-progress measurement</bim-label>
              <bim-label>Delete / Backspace: remove hovered measurement or clip</bim-label>
              <bim-label>Convert IFC: local IFC → .frag (download / optional load)</bim-label>
              <bim-label>Clip: double-click a surface to place a section plane</bim-label>
            </bim-panel-section>
          </bim-panel>
        `
      })

      const toggleLayout = (layout: string) => {
        if (!floatingGrid) return
        floatingGrid.layout =
          floatingGrid.layout === layout ? 'main' : (layout as any)
      }

      const toolbar = BUI.Component.create<BUI.Toolbar>(() => {
        const [loadFragBtn] = CUI.buttons.loadFrag({ components, world })
        loadFragBtn.tooltipTitle = 'Load Fragments'
        loadFragBtn.label = ''

        ifcLoadButton = BUI.Component.create<BUI.Button>(() => {
          return BUI.html`
            <bim-button
              tooltip-title="Load IFC"
              icon="mdi:file-cad"
              @click=${onIfcImport}
            ></bim-button>
          `
        })

        ifcConvertButton = BUI.Component.create<BUI.Button>(() => {
          return BUI.html`
            <bim-button
              tooltip-title="Convert IFC → .frag"
              icon="mdi:file-swap-outline"
              @click=${onIfcConvertOnly}
            ></bim-button>
          `
        })

        // Defer active-state sync until buttons exist in the DOM
        queueMicrotask(() => syncToolButtons())

        return BUI.html`
          <bim-toolbar style="justify-self: center;">
            <bim-toolbar-section label="Models">
              <bim-button
                tooltip-title="Demo Model"
                icon="mdi:school"
                @click=${() => void loadDemoModel()}
              ></bim-button>
              ${ifcLoadButton}
              ${ifcConvertButton}
              ${loadFragBtn}
              <bim-button
                tooltip-title="Import .frag"
                icon="tabler:package-import"
                @click=${onFragmentImport}
              ></bim-button>
              <bim-button
                tooltip-title="Export .frag"
                icon="tabler:package-export"
                @click=${() => void onFragmentExport()}
              ></bim-button>
              <bim-button
                tooltip-title="Dispose Models"
                icon="tabler:trash"
                @click=${() => void onFragmentDispose()}
              ></bim-button>
              <bim-button
                tooltip-title="Models List"
                icon="tabler:list"
                @click=${() => toggleLayout('models')}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="View BG">
              <bim-button
                tooltip-title="Dark background"
                icon="mdi:weather-night"
                @click=${() => {
                  setViewerBg('dark')
                  applyViewerBackground('dark')
                }}
              ></bim-button>
              <bim-button
                tooltip-title="Sky blue background"
                icon="mdi:weather-partly-cloudy"
                @click=${() => {
                  setViewerBg('sky')
                  applyViewerBackground('sky')
                }}
              ></bim-button>
              <bim-button
                tooltip-title="Mist background"
                icon="mdi:cloud"
                @click=${() => {
                  setViewerBg('mist')
                  applyViewerBackground('mist')
                }}
              ></bim-button>
              <bim-button
                tooltip-title="White background"
                icon="mdi:white-balance-sunny"
                @click=${() => {
                  setViewerBg('white')
                  applyViewerBackground('white')
                }}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="Selection">
              <bim-button
                data-tool="tool-select"
                tooltip-title="Select Mode"
                icon="mdi:cursor-default-click"
                @click=${() => setToolMode('select')}
              ></bim-button>
              <bim-button
                tooltip-title="Visibility"
                icon="material-symbols:visibility-outline"
                @click=${() => void onToggleVisibility()}
              ></bim-button>
              <bim-button
                tooltip-title="Isolate"
                icon="mdi:filter"
                @click=${() => void onIsolate()}
              ></bim-button>
              <bim-button
                tooltip-title="Show All"
                icon="tabler:eye-filled"
                @click=${() => void onShowAll()}
              ></bim-button>
              <bim-button
                tooltip-title="Fit View"
                icon="material-symbols:fit-screen"
                @click=${() => void fitToModels()}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="Measure">
              <bim-button
                data-tool="tool-length"
                tooltip-title="Length"
                icon="mdi:ruler"
                @click=${() => setToolMode('length')}
              ></bim-button>
              <bim-button
                data-tool="tool-area"
                tooltip-title="Area"
                icon="mdi:vector-square"
                @click=${() => setToolMode('area')}
              ></bim-button>
              <bim-button
                tooltip-title="Clear Measurements"
                icon="mdi:ruler-square"
                @click=${clearAllMeasurements}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="Section">
              <bim-button
                data-tool="tool-clip"
                tooltip-title="Clip Mode"
                icon="mdi:content-cut"
                @click=${() => setToolMode('clip')}
              ></bim-button>
              <bim-button
                tooltip-title="Clear Clips"
                icon="mdi:scissors-cutting"
                @click=${() => void clipper.deleteAll()}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="Data">
              <bim-button
                tooltip-title="Quantities"
                icon="mdi:summation"
                @click=${() => toggleLayout('qtos')}
              ></bim-button>
              <bim-button
                tooltip-title="Classifier"
                icon="tabler:sitemap"
                @click=${() => toggleLayout('classifier')}
              ></bim-button>
              <bim-button
                tooltip-title="Help"
                icon="mdi:help-circle-outline"
                @click=${() => toggleLayout('help')}
              ></bim-button>
            </bim-toolbar-section>
          </bim-toolbar>
        `
      })

      floatingGrid.layouts = {
        main: {
          template: `
            "empty" 1fr
            "toolbar" auto
            /1fr
          `,
          elements: { toolbar },
        },
        second: {
          template: `
            "empty elementPropertyPanel" 1fr
            "toolbar toolbar" auto
            /1fr 22rem
          `,
          elements: { toolbar, elementPropertyPanel },
        },
        models: {
          template: `
            "empty modelsPanel" 1fr
            "toolbar toolbar" auto
            /1fr 22rem
          `,
          elements: { toolbar, modelsPanel },
        },
        classifier: {
          template: `
            "empty classifierPanel" 1fr
            "toolbar toolbar" auto
            /1fr 22rem
          `,
          elements: { toolbar, classifierPanel },
        },
        qtos: {
          template: `
            "empty qtoPanel" 1fr
            "toolbar toolbar" auto
            /1fr 22rem
          `,
          elements: { toolbar, qtoPanel },
        },
        help: {
          template: `
            "empty toolsPanel" 1fr
            "toolbar toolbar" auto
            /1fr 22rem
          `,
          elements: { toolbar, toolsPanel },
        },
      }

      floatingGrid.layout = 'main'
      viewerContainer.appendChild(floatingGrid)

      // Force a layout pass so the canvas gets a real width/height
      requestAnimationFrame(() => {
        world?.renderer?.resize()
        world?.camera?.updateAspect()
      })
    }

    void init()

    return () => {
      disposed = true
      for (const fn of cleanupFns) fn()
      resizeObserver?.disconnect()
      floatingGrid?.remove()
      worldRef.current = null
      containerRef.current = null
      try {
        components.dispose()
      } catch {
        // Components may already be disposed
      }
    }
  }, [])

  return <bim-viewport id="viewer-container" />
}
