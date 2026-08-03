# 01 — Overview

## What it is

**That Open Master BIM** is a deployable browser BIM app:

- Role-based **login** (Admin / User)
- Project dashboards with local persistence
- That Open Engine **3.4** 3D viewer (IFC + Fragments)
- Length / area measure, clipping, quantities, to-dos
- Workspace themes (**Dark / Sky / Light**)
- Viewer backgrounds (**Dark / Sky blue / Mist / White**)

## Roles

| Role | Can |
| --- | --- |
| **Admin** | All projects, Import/Export JSON, Users page, delete |
| **User** | Own projects + shared demos, BIM tools, no Users admin |

## Stack

React 18 · Vite 5 · TypeScript · Three.js · `@thatopen/*` 3.4 · web-ifc · localStorage auth/session

## Auth model (deploy-ready baseline)

Sessions live in `localStorage` with seeded demo users. Swap `authenticate()` for Firebase Auth / OIDC later without rewriting the React shell — see [05-AUTH_AND_ROLES.md](./05-AUTH_AND_ROLES.md).
