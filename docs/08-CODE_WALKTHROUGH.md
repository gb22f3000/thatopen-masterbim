# 08 — Code walkthrough

## Entry — `src/index.tsx`

```tsx
<AuthProvider>
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/" element={<ProjectsPage … />} />
          <Route path="/project/:id" element={<ProjectDetailsPage … />} />
          <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
</AuthProvider>
```

## Auth module

| File | Job |
| --- | --- |
| `auth/authStore.ts` | Users, session R/W, authenticate |
| `auth/AuthContext.tsx` | React state for session |

## Theme module

| File | Job |
| --- | --- |
| `theme/themeStore.ts` | Theme ids + localStorage |
| `theme/ThemeContext.tsx` | React setters |

## Screens

| File | Job |
| --- | --- |
| `LoginPage.tsx` | Admin/User tabs + form |
| `AppShell.tsx` | Sidebar + Outlet |
| `Sidebar.tsx` | Nav, theme chips, logout |
| `ProjectsPage.tsx` | Role-filtered grid |
| `ProjectDetailsPage.tsx` | Dashboard + IFCViewer host |
| `IFCViewer.tsx` | Engine world + tools |
| `UsersPage.tsx` | Admin account table |

## BIM components

| Folder | Job |
| --- | --- |
| `TodoCreator/` | Issues + markers |
| `SimpleQTO/` | Selection quantities |
| `IfcConverter/` | IFC → frag helper |

## Domain

| File | Job |
| --- | --- |
| `class/Project.ts` | Entity (+ `ownerId`) |
| `class/ProjectsManager.ts` | CRUD / JSON |
| `storage/projectsStore.ts` | localStorage |

## Clean integration checklist

1. New screen → route under `AppShell` (or public like login)
2. New engine tool → `bim-components` + wire in `IFCViewer`
3. New persist field → `serializeProject` + `IProject`
4. New role rule → `ProtectedRoute` or page-level `isAdmin` check
