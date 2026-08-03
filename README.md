# That Open Master BIM

Browser BIM app with **Admin / User login**, themed UI, and [That Open Engine](https://docs.thatopen.com/) 3.4.

## Quick start

```shell
yarn
yarn dev
```

Open http://127.0.0.1:5173/ → **/login**

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |

## Features

- Separate Admin and User authentication (session-ready for web deploy)
- Projects with local persistence
- IFC → Fragments conversion and fast `.frag` loading
- Length / area measure, clipping, QTO, to-dos
- Workspace themes: Dark / Sky / Light
- Viewer backgrounds: Dark / Sky blue / Mist / White

## Documentation

**Start:** [docs/README.md](./docs/README.md)

Includes architecture, auth code, viewer tools, UI themes, and full code walkthrough.

## Stack

React · Vite · TypeScript · Three.js · `@thatopen/components` 3.4 · web-ifc

## License

ISC — original course project by [Fernando Pimenta](https://github.com/pimentafm).
