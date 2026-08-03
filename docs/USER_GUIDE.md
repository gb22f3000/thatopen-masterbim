# User Guide — That Open Master BIM

Complete guide for running and using the local BIM workspace.

Official engine docs: [https://docs.thatopen.com/](https://docs.thatopen.com/)

---

## 1. Install and start

```bash
yarn
yarn dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Projects persist in **browser localStorage**. No backend is required for day-to-day use.

---

## 2. Projects workflow

1. On the home page, open **Demo School Campus** (or create a project with a unique name ≥ 5 characters).
2. The project details page shows dashboard fields, a to-do list, and the 3D viewer.
3. Use **Import / Export** on the projects page to back up the project list as JSON.

---

## 3. Loading models (recommended order)

| Priority | Action | Why |
| --- | --- | --- |
| 1 | **Demo Model** | Instant sample `.frag` from That Open |
| 2 | **Import `.frag`** / **Load Fragments** | Fast open of Engine 3.x Fragments |
| 3 | **Load IFC** | Converts IFC → Fragments in the browser, then shows it |
| 4 | **Convert IFC → .frag** | Dedicated converter: download `.frag` (optionally also load) |

### Important about formats

- Engine **v3.x only opens Fragments v3** `.frag` files.
- Old course / v2 `.frag` files will fail. Re-convert the original IFC with this app (or That Open v3 tools).
- IFC conversion uses local WASM from `public/wasm/` (no unpkg round-trip).

---

## 4. Selection and inspection

1. Click **Select Mode** (cursor icon).
2. Click elements; **Ctrl+click** for multi-select.
3. The property panel opens with IFC/Fragments attributes.
4. Toolbar actions:
   - **Visibility** — toggle selected visibility
   - **Isolate** — hide everything except selection
   - **Show All** — restore visibility
   - **Fit View** — frame all loaded models

---

## 5. Measurements

See [MEASUREMENTS.md](./MEASUREMENTS.md) for full details.

Quick start:

- **Length**: enable Length → double-click start → double-click end
- **Area**: enable Area → double-click ≥ 3 points → press **Enter**
- **Esc** cancels an in-progress measurement
- **Clear Measurements** removes all length and area results

---

## 6. IFC converter

See [IFC_CONVERTER.md](./IFC_CONVERTER.md).

Use **Convert IFC → .frag** to batch-convert locally and download Fragments you can reopen instantly.

---

## 7. Sections (clipping)

1. Click **Clip Mode**.
2. Double-click a surface to place a clipping plane.
3. **Clear Clips** removes all planes.
4. Hover a plane and press **Delete** to remove one.

---

## 8. Quantities and classification

- **Quantities**: select elements → open Quantities panel (sums Volume / Area / Length where present).
- **Classifier**: Build Classifications for categories and building storeys, then browse the spatial tree.

---

## 9. To-dos

1. Select elements in the viewer.
2. Create a to-do with name, task, and priority.
3. Click a to-do later to restore camera + selection.
4. Optional: place a 3D marker at the selection center.

To-dos are session-scoped for the current viewer instance (not synced to Firebase by default).

---

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank / tiny viewer | Ensure the project details layout is wide enough; Fit View after load |
| `.frag` fails to open | File is likely v2 — convert IFC again with this app |
| IFC very slow | Prefer converting once to `.frag`, then Import `.frag` |
| Length/Area do nothing | Mode must be active (hint bar at top); wait for snap marker; Area needs Enter |
| White / invisible UI text | App forces `bim-ui-dark`; hard-refresh the page |

---

## Related docs

- [MEASUREMENTS.md](./MEASUREMENTS.md)
- [IFC_CONVERTER.md](./IFC_CONVERTER.md)
- [../FUNCTIONALITY.md](../FUNCTIONALITY.md)
- [../CODING_STRUCTURE.md](../CODING_STRUCTURE.md)
