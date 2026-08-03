# 04 — Architecture & integration

## Runtime map

```text
index.tsx
  ├─ BUI.Manager.init()
  ├─ AuthProvider          ← session in localStorage
  ├─ ThemeProvider         ← app theme + viewer bg
  └─ BrowserRouter
       ├─ /login           ← LoginPage (no shell)
       └─ ProtectedRoute
            └─ AppShell
                 ├─ Sidebar (nav, themes, logout)
                 └─ Outlet
                      ├─ /              ProjectsPage
                      ├─ /project/:id   ProjectDetailsPage → IFCViewer
                      └─ /users         adminOnly → UsersPage
```

## How pieces integrate

1. **Auth** gates the shell. No session → `/login`.
2. **Theme** sets `data-theme` on `<html>` and toggles `bim-ui-dark` / `bim-ui-light`.
3. **ProjectsManager** holds in-memory projects; **projectsStore** persists JSON.
4. **ProjectDetailsPage** creates `OBC.Components` and mounts **IFCViewer**.
5. **IFCViewer** builds World + Fragments worker + tools; reads **viewerBg** from ThemeContext.
6. **IfcConverter** shares the same IfcLoader/WASM path for Load + Convert buttons.
7. **TodoCreator / SimpleQTO** register as OBC components on the same `components` registry.

## Clutter-free rules

| Layer | Owns |
| --- | --- |
| `src/auth` | Identity only |
| `src/theme` | Appearance only |
| `src/storage` | Persistence only |
| `src/class` | Domain models |
| `src/bim-components` | Engine tools |
| `src/react-components` | Screens / layout |

Do not put login logic in IFCViewer or WASM paths in Sidebar.

## Data flow (project create)

```text
ProjectsForm
  → useAuth().session.userId as ownerId
  → ProjectsManager.newProject()
  → saveProjectsToStorage()
  → ProjectsPage refresh (filters by role)
```

## Data flow (viewer background)

```text
Toolbar View BG button
  → setViewerBg('sky')  // ThemeContext + localStorage
  → applyViewerBackground('sky')
  → container style + scene.background THREE.Color
```
