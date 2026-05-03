# Notes

A simple, fast, **single-page** notes & reminders web app.

Three sections:

- 💡 **Things to Remember** — ideas, notes, anything important
- 🛒 **Things to Buy** — shopping list, errands
- 🚀 **Projects** — goals & ongoing work

Works on phone or computer in any modern browser. Installable as a PWA so it gets its own home‑screen icon and works offline.

## Storage

Notes are saved in your browser's `localStorage`, so each device has its own copy. To move notes between devices, use the **Export** / **Import** buttons on the home screen — Export gives you a JSON blob you can email or paste elsewhere, and Import lets you **Merge** (add new items) or **Replace all**.

## Files

- `index.html` — the whole app (HTML + CSS + JS in one file)
- `manifest.json` — PWA manifest
- `sw.js` — service worker (offline caching)
- `icon.svg` — app icon

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Service workers and PWA install only work over `https://` or `http://localhost`.

## Deploy

Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages.

### GitHub Pages (simplest)

1. Push this repo to GitHub.
2. Repo Settings → Pages → set Source to `main` branch, root folder.
3. Visit `https://<you>.github.io/<repo>/`.

To install on iPhone: open the URL in Safari → Share → Add to Home Screen.
On Android Chrome: tap the menu → Install app.
