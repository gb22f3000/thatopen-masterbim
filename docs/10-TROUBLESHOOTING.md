# 10 — Troubleshooting

| Symptom | Fix |
| --- | --- |
| Stuck without login | Open `/login`; clear session key `thatopen-masterbim-session` |
| User sees Users page | Shouldn’t — hard refresh; confirm role in session JSON |
| Invisible text | Switch workspace theme; hard refresh |
| Viewer always dark | Use toolbar **View BG** (independent of sidebar theme) |
| IFC fails | Ensure `public/wasm/*.wasm` exists |
| Old `.frag` fails | Re-convert IFC with Convert IFC → .frag |
| Area measure stuck | Press Enter to close polygon |

## Session keys

- `thatopen-masterbim-session`
- `thatopen-masterbim-users`
- `thatopen-masterbim-projects`
- `thatopen-masterbim-theme`
- `thatopen-masterbim-viewer-bg`
