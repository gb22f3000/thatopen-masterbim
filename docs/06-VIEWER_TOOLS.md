# 06 — Viewer & tools

Primary file: `src/react-components/IFCViewer.tsx`

## Boot sequence

```ts
fragments.init(fragmentsWorkerUrl)          // local worker
ifcLoader.setup({ wasm: { path: '/wasm/', absolute: true } })
highlighter.setup({ world })
lengthMeasurer / areaMeasurer / clipper
TodoCreator.setup()
```

## Viewer backgrounds

```ts
VIEWER_BACKGROUNDS = {
  dark:  { hex: 0x202124, css: '#202124' },
  sky:   { hex: 0xb8d4f0, css: '#b8d4f0' },
  mist:  { hex: 0xd9e2ec, css: '#d9e2ec' },
  white: { hex: 0xf4f6f8, css: '#f4f6f8' },
}
```

Toolbar section **View BG** calls `setViewerBg` + `applyViewerBackground`.

## Measurements

- Length: two double-clicks (`create` → `endCreation`)
- Area: N double-clicks + **Enter** (`endCreation`)
- Highlighter disabled while measuring

## IFC converter

`src/bim-components/IfcConverter/index.ts`

```ts
await convertIfcToFrag({ components, file, wasmPath, loadIntoViewer, onProgress })
downloadFragFile(buffer, fileName)
```

## Related older docs

Pointers: `docs/MEASUREMENTS.md`, `docs/IFC_CONVERTER.md` → this package.
