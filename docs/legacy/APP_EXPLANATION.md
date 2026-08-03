# Architectural Explanation (legacy)

> Historical overview from the earlier course docs.  
> Prefer the current package:
>
> - [01-OVERVIEW.md](../01-OVERVIEW.md)
> - [04-ARCHITECTURE.md](../04-ARCHITECTURE.md)
> - [08-CODE_WALKTHROUGH.md](../08-CODE_WALKTHROUGH.md)
> - [11-FUNCTIONALITY.md](../11-FUNCTIONALITY.md)
> - [12-CODING_STRUCTURE.md](../12-CODING_STRUCTURE.md)

---

## 1. Overview

The application is a modern **Building Information Modeling (BIM)** platform. Users manage projects, inspect 3D IFC / Fragments models in the browser, calculate material quantities, measure geometry, create clipping sections, and manage issues (to-dos) linked to 3D elements.

### Architecture at a glance

```mermaid
graph TD
  A[index.tsx - Entry Point] --> B[BrowserRouter & Routes]
  B --> C[ProjectsPage]
  B --> D[ProjectDetailsPage]
  B --> E[UsersPage]

  C --> F[ProjectsManager - State Layer]
  D --> F
  F --> L[localStorage]

  D --> G[IFCViewer - 3D Engine]
  G --> H[@thatopen/components v3 + Three.js]
  G --> I[SimpleQTO - Quantity Take Off]
  G --> J[TodoCreator - Visual Issues Tracker]
  G --> K[Measure + Clipper + Classifier]
```

---

## 2. Core technology stack

1. **Vite + React + TypeScript** — application shell
2. **Three.js** — WebGL rendering
3. **@thatopen/components 3.4** — BIM world, IFC loader, Fragments manager, classifier, clipper, hider
4. **@thatopen/components-front 3.4** — highlighter, measurements, postproduction, markers
5. **@thatopen/fragments 3.4** — worker-based Fragments format
6. **@thatopen/ui & @thatopen/ui-obc** — BIM web-component UI
7. **localStorage** — default persistence (Firebase optional)
8. **Auth + Theme modules** — Admin/User login and workspace/viewer themes

---

## 3. Directory structure & key files

### `src/`

- `index.tsx` — providers, routing, project seeding
- `auth/` — Admin/User session
- `theme/` — workspace + viewer backgrounds
- `storage/projectsStore.ts` — local project persistence
- `react-components/IFCViewer.tsx` — That Open v3 viewer
- `bim-components/TodoCreator` — selection-linked issues
- `bim-components/SimpleQTO` — quantity aggregation
- `bim-components/IfcConverter` — IFC → `.frag`

---

## 4. Key workflows

### Load a model

1. Open a project details page.
2. Click **Demo Model**, **Load IFC**, or import a `.frag` file.
3. Fragments worker loads geometry; the model is added to the Three.js scene.
4. Camera fit frames the model.

### Inspect & filter

1. Click elements to open the properties panel.
2. Use Isolate / Visibility / Classifier / Spatial tree.

### Measure & section

1. Enable Length / Area / Clip mode.
2. Double-click in the viewport.
3. Press Delete / Backspace to remove the active item.
4. For Area, press Enter to close the polygon.

### To-dos

1. Select elements → Add Todo.
2. Click a table row to restore camera + selection.
3. Optionally place a 3D marker pin.

---

## 5. Potential enhancements

- Persist to-dos to localStorage / Firebase
- BCF import / export via `BCFTopics`
- Multi-model federation (architecture + structure + MEP)
- ClipStyler for drawing-quality section fills
- Replace local demo auth with Firebase Auth / OIDC
