# Length & Area Measurements

How measurement tools work in That Open Master BIM (Engine 3.4).

Official tutorials:

- [LengthMeasurement](https://docs.thatopen.com/Tutorials/Components/Front/LengthMeasurement)
- [AreaMeasurement](https://docs.thatopen.com/Tutorials/Components/Front/AreaMeasurement)

---

## Tool modes

Only one interaction mode is active at a time:

| Mode | Highlighter | Length | Area | Clipper |
| --- | --- | --- | --- | --- |
| Select | on | off | off | off |
| Length | off | on | off | off |
| Area | off | off | on | off |
| Clip | off | off | off | on |

When Length or Area is enabled, selection highlighting is disabled so double-clicks create measurements instead of selecting elements.

A floating hint bar at the top of the viewer explains the active tool.

---

## Length

1. Click the **Length** toolbar button (active state highlights).
2. Move the cursor over geometry until the **snap marker** appears (point / line snap).
3. **Double-click** to set the start point (preview dimension appears).
4. Move to the end location and **double-click** again to commit the distance.
5. Repeat for more dimensions.
6. Hover a dimension and press **Delete** / **Backspace** to remove it.
7. Press **Esc** to cancel an unfinished length.

Implementation notes:

- Mode: `free`
- Snappings: `POINT`, `LINE`
- Uses `LengthMeasurement.create()` (async) on container `dblclick`
- First `create()` starts preview; second `create()` calls `endCreation()`

---

## Area

1. Click the **Area** toolbar button.
2. **Double-click** successive boundary points (minimum **3**).
3. Press **Enter** (or Numpad Enter) to close the polygon and compute area.
4. Press **Esc** to cancel an unfinished polygon.
5. Hover an area fill and press **Delete** to remove it.
6. Use **Clear Measurements** to wipe both length and area lists.

Implementation notes:

- Mode: `free` (polygon by points)
- Snappings: `POINT`, `LINE`, `FACE`
- Each `dblclick` calls `AreaMeasurement.create()`
- Closing requires `AreaMeasurement.endCreation()` — this was previously missing and made Area appear “broken”

---

## Clear

**Clear Measurements** calls:

```ts
lengthMeasurer.list.clear()
areaMeasurer.list.clear()
```

---

## Common failure modes (and fixes)

| Problem | Cause | Fix in app |
| --- | --- | --- |
| Double-click selects elements instead of measuring | Highlighter still enabled | Mode switch disables highlighter and clears selection |
| Area points never finish | No Enter handler | Enter / NumpadEnter calls `endCreation()` |
| No snap / no pick | No model loaded or cursor not on geometry | Load Demo Model / `.frag` first; hover until marker shows |
| UI double-click steals event | Click on toolbar/panel | Handler ignores events from `bim-toolbar` / `bim-panel` |

---

## Code location

Primary wiring lives in `src/react-components/IFCViewer.tsx`:

- `setToolMode()`
- `onDblClick` / `onKeyDown`
- Measure toolbar section
- `.viewer-tool-hint` overlay (styled in `style.css`)
