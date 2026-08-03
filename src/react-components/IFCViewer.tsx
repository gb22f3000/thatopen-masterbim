import { useEffect } from 'react'
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

interface Props {
  components: OBC.Components
}

const DEMO_FRAG_URL =
  'https://thatopen.github.io/engine_components/resources/frags/school_arq.frag'

export function IFCViewer(props: Props) {
  const components = props.components

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

      viewerContainer.style.backgroundColor = '#26282B'
      viewerContainer.style.borderRadius = '8px'
      viewerContainer.style.overflow = 'hidden'

      const worlds = components.get(OBC.Worlds)
      world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBCF.PostproductionRenderer
      >()

      world.scene = new OBC.SimpleScene(components)
      world.scene.setup()
      world.scene.three.background = new THREE.Color(0x202124)

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
      lengthMeasurer.enabled = false
      lengthMeasurer.snappings = [
        FRAGS.SnappingClass.POINT,
        FRAGS.SnappingClass.LINE,
      ]

      const areaMeasurer = components.get(OBCF.AreaMeasurement)
      areaMeasurer.world = world
      areaMeasurer.enabled = false

      const clipper = components.get(OBC.Clipper)
      clipper.enabled = false

      const todoCreator = components.get(TodoCreator)
      todoCreator.world = world
      todoCreator.setup()

      const setToolMode = (mode: 'select' | 'length' | 'area' | 'clip') => {
        lengthMeasurer.enabled = mode === 'length'
        areaMeasurer.enabled = mode === 'area'
        clipper.enabled = mode === 'clip'
        highlighter.enabled = mode === 'select'
      }

      const onDblClick = () => {
        if (lengthMeasurer.enabled) lengthMeasurer.create()
        else if (areaMeasurer.enabled) void areaMeasurer.create()
        else if (clipper.enabled) void clipper.create(world!)
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Delete' || event.code === 'Backspace') {
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
            const buffer = new Uint8Array(await file.arrayBuffer())
            const modelId = uniqueModelId(
              file.name.replace(/\.ifc$/i, '') || `ifc-${Date.now()}`
            )

            // Keep wasm on local path (CUI's built-in button wrongly resets it to unpkg)
            ifcLoader.settings.autoSetWasm = false
            ifcLoader.settings.wasm = { path: wasmPath, absolute: true }

            let lastPct = -1
            const model = await ifcLoader.load(buffer, true, modelId, {
              processData: {
                progressCallback: (progress: number) => {
                  const pct = Math.round((progress || 0) * 100)
                  if (pct !== lastPct) {
                    lastPct = pct
                    setLoadingButton(
                      ifcLoadButton,
                      true,
                      `IFC ${pct}%`
                    )
                  }
                },
              },
            })

            // onItemSet already adds the model to the scene
            await fragments.core.update(true)
            world!.renderer?.resize()
            world!.camera.updateAspect()
            await fitToModels()

            const seconds = ((performance.now() - started) / 1000).toFixed(1)
            setLoadingButton(ifcLoadButton, false, 'Load IFC')

            // Offer saving .frag so next open is instant
            const saveFrag = window.confirm(
              `IFC converted in ${seconds}s.\n\nSave a .frag file for fast reload next time?`
            )
            if (saveFrag) {
              const fragsBuffer = await model.getBuffer(false)
              const out = new File([fragsBuffer], `${model.modelId}.frag`)
              const link = document.createElement('a')
              link.href = URL.createObjectURL(out)
              link.download = out.name
              link.click()
              URL.revokeObjectURL(link.href)
            }
          } catch (error) {
            setLoadingButton(ifcLoadButton, false, 'Load IFC')
            notifyError(`IFC import "${file.name}"`, error)
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
              <bim-label>Length / Area: double-click to place</bim-label>
              <bim-label>Clip: double-click a surface</bim-label>
              <bim-label>Delete / Backspace: remove active tool item</bim-label>
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

        return BUI.html`
          <bim-toolbar style="justify-self: center;">
            <bim-toolbar-section label="Models">
              <bim-button
                tooltip-title="Demo Model"
                icon="mdi:school"
                @click=${() => void loadDemoModel()}
              ></bim-button>
              ${ifcLoadButton}
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

            <bim-toolbar-section label="Selection">
              <bim-button
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
                tooltip-title="Length"
                icon="mdi:ruler"
                @click=${() => setToolMode('length')}
              ></bim-button>
              <bim-button
                tooltip-title="Area"
                icon="mdi:vector-square"
                @click=${() => setToolMode('area')}
              ></bim-button>
              <bim-button
                tooltip-title="Clear Length"
                icon="mdi:ruler-square"
                @click=${() => lengthMeasurer.list.clear()}
              ></bim-button>
            </bim-toolbar-section>

            <bim-toolbar-section label="Section">
              <bim-button
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
      try {
        components.dispose()
      } catch {
        // Components may already be disposed
      }
    }
  }, [])

  return <bim-viewport id="viewer-container" />
}
