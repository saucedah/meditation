# My Apps — Launcher

A single-page launcher that lists all your web apps. Bookmark this page on your phone and you've got one entry point to everything you've built.

## How to add or edit apps

Open `index.html`, scroll to the `const APPS = [ ... ]` array near the top of the script. Each entry is one card:

```js
{
  name: 'Workout',
  icon: '💪',
  desc: 'AI-built routines tailored to your gym & progress.',
  url: 'https://workout-8ol.pages.dev/',
  status: 'live',          // 'live' | 'wip' | 'soon'
  tint: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.05))'
}
```

- **`status: 'live'`** — card is clickable and opens `url` in a new tab.
- **`status: 'wip'` / `'soon'`** — card is shown but not clickable (still building).
- Add a new app: copy a block, paste it in the array, fill in the fields. Save & redeploy.

That's it — no build step.

## Deploy (pick one)

### GitHub Pages
```bash
git init -b main
git add .
git commit -m "init"
# create empty repo on GitHub, then:
git remote add origin git@github.com:saucedah/launcher.git
git push -u origin main
```
Repo Settings → Pages → Deploy from branch `main` / root. URL will be `https://saucedah.github.io/launcher/`.

### Cloudflare Pages
1. Push to GitHub as above.
2. In Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: **none** (it's static). Output dir: `/`.
4. URL: `https://launcher-XXX.pages.dev/`.

## Pin to your phone

iOS Safari: open the URL → Share → **Add to Home Screen**.
Android Chrome: menu → **Install app**.

You'll get an icon labelled "Apps" with its own splash screen.

## Files

```
launcher/
├── index.html      # the whole page (HTML + CSS + JS in one file)
├── manifest.json   # PWA manifest
├── sw.js           # service worker (offline support)
├── icon.svg        # app icon
└── README.md
```
