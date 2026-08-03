# 09 — Development

## Scripts

```bash
yarn dev
yarn build
yarn preview
```

## Add a role-gated page

```tsx
<Route path="/reports" element={
  <ProtectedRoute adminOnly>
    <ReportsPage />
  </ProtectedRoute>
} />
```

## Add a viewer background

1. Extend `VIEWER_BACKGROUNDS` in `themeStore.ts`
2. Add toolbar button in `IFCViewer.tsx`
3. Document in User Guide

## Keep the soul

Preserve Fragments-first loading, local WASM, measure/clip/QTO/todos, and project-centric UX when restyling.
