# That Open Master BIM — Documentation Package

Browser BIM workspace with **Admin / User login**, themed UI, and That Open Engine 3.4.

**Repo:** https://github.com/gb22f3000/thatopen-masterbim

---

## Start here

| Doc | Contents |
| --- | --- |
| [01-OVERVIEW.md](./01-OVERVIEW.md) | Product, roles, themes, stack |
| [02-INSTALLATION.md](./02-INSTALLATION.md) | Install, local test, deploy build |
| [03-USER_GUIDE.md](./03-USER_GUIDE.md) | Login, projects, viewer, themes |
| [04-ARCHITECTURE.md](./04-ARCHITECTURE.md) | Integration map + code structure |
| [05-AUTH_AND_ROLES.md](./05-AUTH_AND_ROLES.md) | Admin vs User auth (with code) |
| [06-VIEWER_TOOLS.md](./06-VIEWER_TOOLS.md) | Viewer, measurements, IFC, backgrounds |
| [07-UI_THEMES.md](./07-UI_THEMES.md) | Workspace + viewer themes |
| [08-CODE_WALKTHROUGH.md](./08-CODE_WALKTHROUGH.md) | File-by-file code explanation |
| [09-DEVELOPMENT.md](./09-DEVELOPMENT.md) | Extending cleanly |
| [10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md) | Common issues |
| [11-FUNCTIONALITY.md](./11-FUNCTIONALITY.md) | Feature summary |
| [12-CODING_STRUCTURE.md](./12-CODING_STRUCTURE.md) | Source tree map |
| [legacy/APP_EXPLANATION.md](./legacy/APP_EXPLANATION.md) | Older historical notes |

> Only **`README.md`** stays at the repository root (GitHub landing page). All other docs live in this folder.

---

## Local test (2 minutes)

```bash
yarn
yarn dev
```

Open http://127.0.0.1:5173/

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |
| Engineer (user) | `engineer` | `eng123` |

1. Sign in as **User** → Projects only (no Users nav)
2. Open Demo School Campus → **Demo Model**
3. Toolbar **View BG** → try Sky blue / Mist / White / Dark
4. Sidebar **Workspace theme** → Dark / Sky / Light
5. Log out → Sign in as **Admin** → Users page visible

---

## Soul of the app

Keep these intact when changing UI:

- Fast Fragments (`.frag`) workflow
- Local IFC → `.frag` conversion
- Measure / clip / select / QTO / to-dos
- Project-centric navigation
- Offline-friendly local persistence
