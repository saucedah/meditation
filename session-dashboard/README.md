# FleetDeck — Local Coding Session Mission Control

A local, app-like web dashboard for managing your projects and Claude Code / Windows
Terminal sessions from one place — instead of a wall of manually-renamed terminal tabs.

> **Platform note:** The dashboard UI and database run anywhere (Win/macOS/Linux).
> The *launch* and *detect* features are Windows-specific (they shell out to `wt.exe`
> and PowerShell). On non-Windows they degrade gracefully with a clear message.

---

## Product summary

- **Local-first**: all data in a single SQLite file. No cloud, no login.
- **Hybrid session tracking**:
  - Sessions launched **from the dashboard** are fully tracked (we own the PID, cwd, command).
  - **External** Windows Terminal sessions are *enumerated* and offered for **manual linking**,
    because reliably reading a foreign process's working directory on Windows is fragile.
- **App feel**: dark futuristic theme, command palette (`Ctrl/Cmd+K`), sidebar nav, live
  session cards, session timeline.

## MVP features

Project CRUD · saved per-project commands · launch Windows Terminal in folder · launch
Claude Code in folder · auto session records on launch · rename sessions · notes / summary /
next-steps / status · session history timeline · dashboard cards · search & filters ·
statuses (Active / Idle / Needs Review / Completed / Error) · external session import/link.

## Architecture

```
client/  React + Vite + TypeScript (TanStack Query, react-router, CSS design system)
server/  Express + TypeScript (tsx), better-sqlite3
         services/terminal.ts  -> spawns wt.exe (Windows Terminal CLI)
         services/detect.ts     -> PowerShell Get-CimInstance process enumeration
```

In dev, Vite proxies `/api` to Express (port 4317). In prod, Express serves the built client.

## Database schema

See `server/src/schema.sql`. Tables: `projects`, `commands`, `sessions`, `session_events`, `settings`.

## Getting started

```bash
cd session-dashboard
npm install            # installs root + workspaces (server, client)
npm run dev            # starts server (4317) + client (5317) together
# open http://localhost:5317
```

Build for production:

```bash
npm run build          # builds client, typechecks server
npm start              # runs server, serves built client on 4317
```

## How launching works (Windows)

- **Open Windows Terminal**: `wt.exe -w 0 nt -d "<path>" --title "<name>" <shell>`
- **Open Claude Code**: opens a new tab in `<path>` and runs `claude`.
- **Saved commands**: run any saved command string in a new tab in the project folder.

Each launch creates a `session` row (status `Active`, source `dashboard`) and a `launch`
event. The PID we capture is the `wt.exe` launcher; liveness is best-effort (see risks).

## Auto-detection: how & why it's limited

`wt.exe` exits immediately after handing off to the persistent `WindowsTerminal.exe`; each
tab/pane is a child shell with no public tab→process mapping, and a process's CWD isn't
readable from outside without undocumented APIs. So FleetDeck **only trusts what it
launches** and treats detection as *discovery for manual linking*: it lists
`WindowsTerminal.exe` + `claude`/`node`/shell processes with their command lines, and you
link the relevant ones to a project. No fragile guessing.

## Roadmap

- **P0** scaffold + DB ✅
- **P1** projects + commands ✅
- **P2** launch + sessions ✅
- **P3** notes + history + timeline ✅
- **P4** detection + linking ✅
- **P5** polish: command palette, filters, animations ✅
- **Later**: Tauri/Electron desktop packaging, real liveness polling, themes, sync.
