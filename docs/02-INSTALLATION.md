# 02 — Installation & local testing

## Prerequisites

- Node.js 18+
- Yarn
- Chrome / Edge / Firefox with WebGL

## Install & run

```bash
yarn
yarn dev
```

Open the URL Vite prints (usually http://127.0.0.1:5173/).

## Production build

```bash
yarn build
yarn preview
```

Deploy the `dist/` folder to any static host (Netlify, Cloudflare Pages, S3+CDN, IIS, nginx).

## Required static assets

```text
public/wasm/web-ifc.wasm
public/wasm/web-ifc-mt.wasm
public/assets/company-logo.svg
```

## Demo login

| Username | Password | Role |
| --- | --- | --- |
| admin | admin123 | admin |
| user | user123 | user |
| engineer | eng123 | user |

Change these in `src/auth/authStore.ts` before public production use.

## Verify checklist

- [ ] `/login` shows User / Admin tabs
- [ ] Wrong password shows error
- [ ] User cannot open `/users` (redirects home)
- [ ] Admin sees Users page
- [ ] Viewer background buttons change canvas color
- [ ] Sidebar theme chips restyle the chrome
