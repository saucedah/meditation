# Apps Bundle — temporary delivery branch

This branch is **not** part of the meditation app. It's a one-shot delivery
branch carrying the source for two new standalone apps that should each
end up in their own GitHub repo:

- `notes/` → the **Notes / Reminders** app (Things to Remember, Buy, Projects)
- `launcher/` → the **My Apps launcher** (one bookmark, all your apps)

The `index.html`, `audio/`, `manifest.json`, `sw.js`, `icon.svg` at the
repo root are the existing **meditation** files — leave them alone.

## Pull these onto your Linux box

```bash
# 1. Fetch this branch into your existing meditation clone
cd ~/projects/meditation       # adjust path if different
git fetch origin bundle/notes-and-launcher
git worktree add /tmp/apps-bundle bundle/notes-and-launcher

# 2. Move the two app folders into your projects directory
mkdir -p ~/projects
mv /tmp/apps-bundle/notes    ~/projects/notes
mv /tmp/apps-bundle/launcher ~/projects/launcher

# 3. Drop the worktree (we don't need this branch any more locally)
git worktree remove /tmp/apps-bundle --force
```

You now have two clean, ready-to-go projects at:
- `~/projects/notes/`
- `~/projects/launcher/`

## Turn each one into its own GitHub repo

Repeat for both `notes/` and `launcher/`:

```bash
cd ~/projects/notes              # then again for launcher
git init -b main
git add .
git commit -m "Initial commit"

# create empty repo on github.com/new — call it 'notes' (then 'launcher')
git remote add origin git@github.com:saucedah/notes.git
git push -u origin main
```

## Deploy each on Cloudflare Pages

For each new repo:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages**.
2. **Connect to Git** → pick `saucedah/notes` (then `saucedah/launcher`).
3. Build settings: **none** (these are plain HTML). Output dir: `/` (or leave default).
4. **Save and Deploy**. You'll get URLs like `notes-xyz.pages.dev` and `launcher-xyz.pages.dev`.

## After deploying

Send the two URLs back to me and I'll update the `APPS = [ ... ]` array in
`launcher/index.html` so the launcher links to the live notes URL.

## Cleanup (optional, when you're done)

This delivery branch can be deleted from GitHub once you've extracted the
folders:

```bash
git push origin --delete bundle/notes-and-launcher
```
