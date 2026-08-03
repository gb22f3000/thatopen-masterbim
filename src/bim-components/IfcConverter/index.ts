import * as OBC from '@thatopen/components'
import * as FRAGS from '@thatopen/fragments'

export type ConvertProgress = {
  percent: number
  stage: 'reading' | 'converting' | 'writing' | 'done' | 'error'
  message: string
}

export type ConvertResult = {
  modelId: string
  fileName: string
  fragBuffer: ArrayBuffer
  model: FRAGS.FragmentsModel
  elapsedMs: number
}

/**
 * Local IFC → Fragments (.frag) converter using That Open Engine.
 * Uses the already-configured IfcLoader (local WASM) and returns a
 * downloadable .frag buffer plus the loaded Fragments model.
 */
export async function convertIfcToFrag(options: {
  components: OBC.Components
  file: File
  wasmPath: string
  loadIntoViewer?: boolean
  onProgress?: (progress: ConvertProgress) => void
}): Promise<ConvertResult> {
  const { components, file, wasmPath, onProgress } = options
  const started = performance.now()

  const report = (
    percent: number,
    stage: ConvertProgress['stage'],
    message: string
  ) => onProgress?.({ percent, stage, message })

  report(2, 'reading', `Reading ${file.name}…`)
  const bytes = new Uint8Array(await file.arrayBuffer())

  const ifcLoader = components.get(OBC.IfcLoader)
  ifcLoader.settings.autoSetWasm = false
  ifcLoader.settings.wasm = { path: wasmPath, absolute: true }
  ifcLoader.settings.webIfc = {
    ...ifcLoader.settings.webIfc,
    COORDINATE_TO_ORIGIN: true,
  }

  const baseName = file.name.replace(/\.ifc$/i, '') || `model-${Date.now()}`
  const fragments = components.get(OBC.FragmentsManager)
  let modelId = baseName.replace(/[^\w.-]+/g, '_')
  if (fragments.list.has(modelId)) {
    modelId = `${modelId}-${Date.now()}`
  }

  report(5, 'converting', 'Converting IFC → Fragments…')

  const model = await ifcLoader.load(bytes, true, modelId, {
    processData: {
      progressCallback: (progress: number) => {
        const pct = Math.min(95, Math.max(5, Math.round((progress || 0) * 90) + 5))
        report(pct, 'converting', `Converting… ${pct}%`)
      },
    },
  })

  report(96, 'writing', 'Encoding .frag buffer…')
  const fragBuffer = await model.getBuffer(false)

  // If caller only wanted a file, dispose the model from the viewer list
  if (options.loadIntoViewer === false) {
    await fragments.core.disposeModel(model.modelId)
  }

  report(100, 'done', 'Conversion complete')

  return {
    modelId: model.modelId,
    fileName: `${model.modelId}.frag`,
    fragBuffer,
    model,
    elapsedMs: performance.now() - started,
  }
}

export function downloadFragFile(buffer: ArrayBuffer, fileName: string) {
  const file = new File([buffer], fileName)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  URL.revokeObjectURL(link.href)
}
