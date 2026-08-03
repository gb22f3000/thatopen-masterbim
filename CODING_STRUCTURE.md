# Coding Structure

Architecture and code map for **That Open Master BIM**, upgraded to That Open Engine **v3.4**.

Official docs: [https://docs.thatopen.com/](https://docs.thatopen.com/)

---

## Stack

| Layer | Technology |
| --- | --- |
| App shell | React 18 + React Router 7 + Vite 5 |
| Language | TypeScript |
| 3D engine | Three.js r182 |
| BIM engine | `@thatopen/components` + `@thatopen/components-front` |
| Geometry format | `@thatopen/fragments` (worker-based) |
| IFC parsing | `web-ifc` 0.0.77 |
| UI kit | `@thatopen/ui` + `@thatopen/ui-obc` (web components) |
| Persistence | `localStorage` (Firebase helpers optional) |

---

## High-level architecture

```mermaid
graph TD
  A[src/index.tsx] --> B[BrowserRouter]
  B --> C[ProjectsPage]
  B --> D[ProjectDetailsPage]
  B --> E[UsersPage]

  A --> F[ProjectsManager]
  C --> F
  D --> F
  F --> G[localStorage projectsStore]

  D --> H[IFCViewer]
  H --> I[OBC.Components]
  I --> J[Worlds / Scene / Camera / PostproductionRenderer]
  I --> K[FragmentsManager + worker]
  I --> L[IfcLoader]
  I --> M[Highlighter / Hider / Classifier / Clipper]
  I --> N[LengthMeasurement / AreaMeasurement]
  H --> O[TodoCreator]
  H --> P[SimpleQTO]
  H --> R[IfcConverter]
  H --> Q[@thatopen/ui-obc tables and buttons]
```

---

## Directory map

```text
src/
  index.tsx                 # App bootstrap, BUI init, routes, seed projects
  storage/
    projectsStore.ts        # localStorage load / save / demo seed
  firebase/
    index.ts                # Optional Firestore helpers (off by default)
  class/
    Project.ts              # Project domain model
    ProjectsManager.ts      # In-memory project CRUD + JSON import/export
    UIManager.ts            # Legacy modal helpers (mostly unused by React flow)
    Utils.ts                # Shared utilities
  react-components/
    Sidebar.tsx             # Left navigation
    ProjectsPage.tsx        # Project list UI
    ProjectsForm.tsx        # New-project dialog
    ProjectCard.tsx         # Card for one project
    ProjectDetailsPage.tsx  # Dashboard + todos + IFCViewer
    IFCViewer.tsx           # Main That Open 3D integration
    SearchBox.tsx
    UsersPage.tsx
  bim-components/
    TodoCreator/            # Custom OBC.Component for issues + markers
    SimpleQTO/              # Custom quantity aggregation component
    IfcConverter/           # Local IFC → .frag convert + download helpers
docs/
  USER_GUIDE.md             # End-to-end usage
  MEASUREMENTS.md           # Length / Area interaction guide
  IFC_CONVERTER.md          # Converter pipeline and tips
```

---

## Entry point

`src/index.tsx`:

1. Calls `BUI.Manager.init()` so `bim-*` web components work.
2. Creates a shared `ProjectsManager`.
3. Seeds demo projects via `createDemoProjectsIfEmpty`.
4. Mounts React routes under `#app`.

---

## Domain / state

### `Project` / `ProjectsManager`

- `Project` holds name, description, status, role, dates, cost, progress, id.
- `ProjectsManager` validates names, keeps the list, and supports JSON import/export.
- Mutations are mirrored to `localStorage` from the React pages.

### Persistence

`src/storage/projectsStore.ts` is the source of truth for offline use. Firebase is gated behind `isFirebaseConfigured` so missing / placeholder env vars do not break startup.

---

## 3D engine integration (`IFCViewer.tsx`)

This is the core BIM module. Lifecycle (in `useEffect`):

1. Create `World` with `SimpleScene`, `OrthoPerspectiveCamera`, `PostproductionRenderer`.
2. `components.init()` then create grid + raycaster.
3. `FragmentsManager.getWorker()` → `fragments.init(workerUrl)` (v3 worker API).
4. Wire camera updates → `fragments.core.update()`.
5. On model load (`fragments.list.onItemSet`): `model.useCamera(...)`, add `model.object` to the scene.
6. Configure `IfcLoader.setup({ wasm... })`.
7. Configure `Highlighter`, measurements, clipper, TodoCreator.
8. Build floating `bim-grid` toolbar / panels with `@thatopen/ui` + `@thatopen/ui-obc`.

### Important v3 API shifts (from previous v2.x code)

| Old (v2) | New (v3) |
| --- | --- |
| `onFragmentsLoaded` + add group directly | `fragments.list.onItemSet` + `world.scene.three.add(model.object)` |
| `FragmentIdMap` | `ModelIdMap` (`Record<string, Set<number>>`) |
| `fragmentsManager.export(group)` | `model.getBuffer(false)` |
| `CUI.tables.elementProperties({ fragmentIdMap })` | `CUI.tables.itemsData({ modelIdMap })` |
| `CUI.tables.classificationTree` | `Classifier` + `CUI.tables.spatialTree` / models list |
| Sync fragments load | Async worker init via `FragmentsManager.getWorker()` |

---

## Custom BIM components

### `TodoCreator`

Extends `OBC.Component`:

- Reads current Highlighter selection as `ModelIdMap`.
- Converts to IFC GUIDs with `fragments.modelIdMapToGuids`.
- Stores camera look-at for later restore.
- Priority styles via `highlighter.styles.set`.
- Markers via `OBCF.Mark` at `BoundingBoxer.getCenter(...)`.

### `SimpleQTO`

- Uses `fragments.getData(modelIdMap, ...)` and walks `ItemData` for quantity-like numeric attributes.
- Always reports selection **Count**.
- Renders into a `bim-table` created by `qtoTool`.

---

## UI composition pattern

That Open UI is web-component based (Lit). React hosts them by:

1. Declaring JSX intrinsic elements in `index.tsx`.
2. Creating panels with `BUI.Component.create` / `BUI.html`.
3. Mounting toolbar layouts on `bim-grid.layouts`.

`@thatopen/ui-obc` supplies ready-made BIM widgets:

- `buttons.loadIfc` / `buttons.loadFrag`
- `tables.itemsData`
- `tables.modelsList`
- `tables.spatialTree`

---

## Styling

- Global theme: `style.css` (dark BIM UI palette).
- Component tokens come from `@thatopen/ui` (`--bim-ui_*` CSS variables).
- Layout: CSS grid `#app` → `#sidebar` + `#content`.
- Project details: left dashboard column + right viewport (`#project-details > .main-page-content`).

---

## Scripts

| Command | Purpose |
| --- | --- |
| `yarn dev` | Vite development server |
| `yarn build` | Typecheck + production bundle |
| `yarn preview` | Preview production build |

---

## Extending the app

Useful That Open building blocks already available in the installed packages:

- `OBC.ItemsFinder` — advanced queries (walls on a storey, etc.)
- `OBC.Classifier` — static + dynamic groupings
- `OBCF.ClipStyler` — styled section fills / outlines
- `OBC.BCFTopics` / viewpoints — issue exchange (BCF)
- `OBCF.AreaMeasurement` / `LengthMeasurement` — already wired in the toolbar

When adding a tool:

1. Get the singleton: `components.get(SomeComponent)`.
2. Assign `world` if the tool needs a scene.
3. Toggle `enabled` so it does not fight the Highlighter.
4. Expose a `bim-button` in the floating toolbar.

---

## Testing locally

1. `yarn dev`
2. Open a demo project.
3. Click **Demo Model**.
4. Select elements, isolate, measure, clip, create a to-do.
5. Export `.frag` and reload it with Import to verify the Fragments round-trip.
