# App Functionality

This document describes what **That Open Master BIM** does and how to use it.

Built with [That Open Engine](https://docs.thatopen.com/) (`@thatopen/components` v3.4), React, Three.js, and Fragments.

---

## What this app is

A browser-based BIM workspace for:

- Managing construction / design projects
- Loading IFC and Fragments (`.frag`) models in a 3D viewport
- Inspecting element properties and quantities
- Measuring lengths and areas
- Cutting sections with clipping planes
- Creating visual to-dos linked to selected model elements

---

## Getting started

```bash
yarn
yarn dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Projects are stored in **browser localStorage** so the app runs fully offline. Firebase helpers remain available under `src/firebase/` if you later wire a cloud backend.

On first launch you get two sample projects:

1. **Demo School Campus**
2. **Office Tower Alpha**

---

## Projects page (`/`)

| Action | Behavior |
| --- | --- |
| Search | Filters projects by name |
| New project | Opens a modal (name must be ≥ 5 characters and unique) |
| Import / Export | JSON backup of the project list |
| Click a card | Opens the project details + 3D viewer |

---

## Project details (`/project/:id`)

### Dashboard

Shows status, cost, role, finish date, and a progress bar. You can edit or delete the project.

### To-Do panel

1. Select elements in the 3D viewer (Ctrl+click for multi-select).
2. Click the To-Do button, enter name / task / priority.
3. The issue stores IFC GUIDs and the camera viewpoint.
4. Click a row to restore the camera and re-highlight those elements.
5. Use the marker button to place a 3D pin at the selection center.
6. Priority filter colors elements by Low / Medium / High.

---

## 3D BIM viewer (toolbar)

Aligned with That Open tutorials for [Worlds](https://docs.thatopen.com/Tutorials/Components/Core/Worlds), [FragmentsManager](https://docs.thatopen.com/Tutorials/Components/Core/FragmentsManager), [IfcLoader](https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader), [Highlighter](https://docs.thatopen.com/Tutorials/Components/Front/Highlighter), [LengthMeasurement](https://docs.thatopen.com/Tutorials/Components/Front/LengthMeasurement), and [Clipper](https://docs.thatopen.com/Tutorials/Components/Core/Clipper).

### Models

| Tool | What it does |
| --- | --- |
| Demo Model | Loads the official That Open school architecture `.frag` sample |
| Load IFC | Converts IFC → Fragments (local WASM) then displays it; offers `.frag` download |
| Convert IFC → .frag | Dedicated local converter (multi-file); download `.frag`, optionally load |
| Load Fragments | Built-in Fragments loader button |
| Import `.frag` | File picker for local Fragments |
| Export `.frag` | Downloads the first loaded model as Fragments |
| Dispose | Removes all loaded models from memory |
| Models List | Panel to show / download / dispose models |

Detailed converter docs: [docs/IFC_CONVERTER.md](./docs/IFC_CONVERTER.md)

### Selection

| Tool | What it does |
| --- | --- |
| Select Mode | Click / Ctrl+click element selection (Highlighter) |
| Visibility | Toggle visibility of the current selection |
| Isolate | Hide everything except the selection |
| Show All | Restore full model visibility |
| Fit View | Frame the camera on all loaded models |

Selecting elements opens the **Property Information** panel (`itemsData` table) and updates **Quantities**.

### Measure

| Tool | What it does |
| --- | --- |
| Length | Double-click start, then end (point / line snap). Esc cancels. |
| Area | Double-click ≥ 3 polygon points, then **Enter** to close. Esc cancels. |
| Clear Measurements | Removes all length **and** area dimensions |
| Delete / Backspace | Deletes the measurement under the cursor |

While measuring, selection highlighting is disabled. A hint bar explains the active tool. Full guide: [docs/MEASUREMENTS.md](./docs/MEASUREMENTS.md)

### Section

| Tool | What it does |
| --- | --- |
| Clip Mode | Double-click a surface to create a clipping plane |
| Clear Clips | Removes all clipping planes |
| Delete / Backspace | Deletes the clip under the cursor |

### Data

| Tool | What it does |
| --- | --- |
| Quantities | Aggregates volume / area / length-like attributes for the selection |
| Classifier | Builds category + storey groupings and shows the spatial tree |
| Help | Shortcut / interaction reminders |

---

## Recommended workflow

1. Open **Demo School Campus**.
2. Click **Demo Model** (or **Convert IFC → .frag** / **Import `.frag`**).
3. Click elements to inspect properties.
4. Use **Isolate** / **Classifier** to focus on a storey or category.
5. Switch to **Length** or **Area** (remember Enter for areas) or **Clip**.
6. Create to-dos on problematic elements and revisit them from the table.

More detail: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)

---

## Users page (`/users`)

Placeholder UI for future user / team management.

---

## Limits and next steps

- To-dos are in-memory per viewer session (not persisted yet).
- Firebase sync is optional and disabled until real credentials are provided.
- For production IFC workflows, convert once to `.frag` and reload Fragments (much faster than converting every session). See [docs/IFC_CONVERTER.md](./docs/IFC_CONVERTER.md) and the [IfcLoader docs](https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader).
