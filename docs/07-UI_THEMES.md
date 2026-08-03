# 07 — UI & themes

## Workspace themes

| Id | Feel |
| --- | --- |
| `dark` | Graphite panels |
| `sky` | Cool blue drafting chrome |
| `light` | Bright board |

Applied via:

```ts
document.documentElement.dataset.theme = theme
```

CSS lives in `style.css` under `html[data-theme='…']`.

## Viewer backgrounds

Independent of chrome theme — change only the 3D canvas.

Sidebar chips → workspace  
Toolbar View BG → canvas

## Design intent

- Plus Jakarta Sans (not Inter)
- One accent blue family (not purple gradients)
- Native HTML for login / projects / users (readable always)
- `bim-*` reserved for viewer tooling chrome
