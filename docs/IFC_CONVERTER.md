# Local IFC → Fragments (`.frag`) Converter

Convert IFC files entirely in the browser to That Open Engine **v3 Fragments** (`.frag`), then open them instantly later.

Official IFC loading tutorial: [IfcLoader](https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader)

---

## Why convert?

| Format | Typical use |
| --- | --- |
| `.ifc` | Source exchange format — slow to parse every time |
| `.frag` (v3) | Runtime geometry for That Open Engine — fast load |

Convert once, keep the `.frag`, reopen in seconds.

---

## How to use in the app

### A. Load IFC (convert + view)

Toolbar → **Load IFC**

1. Pick a `.ifc` file.
2. Progress shows on the button tooltip.
3. Model appears in the viewer.
4. Confirm dialog offers downloading the `.frag`.

### B. Convert IFC → `.frag` (dedicated)

Toolbar → **Convert IFC → .frag**

1. Pick one or more `.ifc` files.
2. Confirm:
   - **OK** — convert, download `.frag`, **and** load into the viewer
   - **Cancel** — convert & download only (model not kept in the scene)
3. Browser downloads `*.frag` files.
4. Later: **Import `.frag`** to open them quickly.

---

## Technical pipeline

```text
.ifc bytes
   ↓  web-ifc WASM (public/wasm/)
IfcLoader.load(...)
   ↓
FragmentsModel in FragmentsManager
   ↓  model.getBuffer(false)
.frag ArrayBuffer → download / optional keep in viewer
```

Module: `src/bim-components/IfcConverter/index.ts`

```ts
convertIfcToFrag({
  components,
  file,
  wasmPath: `${origin}/wasm/`,
  loadIntoViewer: true | false,
  onProgress,
})

downloadFragFile(buffer, fileName)
```

### Local WASM

Files under `public/wasm/`:

- `web-ifc.wasm`
- `web-ifc-mt.wasm`

The viewer sets `ifcLoader.settings.autoSetWasm = false` and points `wasm.path` at `/wasm/` so conversion does **not** pull WASM from unpkg on every run.

---

## Compatibility

- Output `.frag` is Engine **3.x** only.
- Do not mix with Fragments **v2** files from older course builds.
- If an imported `.frag` fails with flatbuffer / magic / parse errors, re-convert the IFC with this converter.

---

## Performance tips

1. Prefer **Demo Model** while testing tools.
2. For production models: convert once → keep `.frag` → Import `.frag`.
3. Large IFCs can take minutes in the browser; leave the tab focused during conversion.
4. Multi-file convert downloads one `.frag` per IFC sequentially.

---

## Troubleshooting

| Issue | Resolution |
| --- | --- |
| Conversion hangs / fails immediately | Confirm `public/wasm/*.wasm` exists; hard-refresh |
| Downloaded `.frag` won’t open elsewhere | Target app must use That Open Fragments **v3** |
| Model missing after “convert only” | Expected — choose OK on the confirm to also load |
| Duplicate model ids | Converter suffixes ids when a name already exists |
