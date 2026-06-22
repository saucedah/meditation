import { Router } from 'express';
import { db, id } from '../db.js';
import { logEvent } from '../events.js';
import { launchWindowsTerminal, isWindows } from '../services/terminal.js';
import { detectProcesses } from '../services/detect.js';

export const terminal = Router();

interface LaunchBody {
  project_id?: string;
  command?: string; // explicit command string
  command_id?: string; // reference a saved command
  label?: string; // session name override
  shell?: 'pwsh' | 'powershell' | 'cmd';
}

terminal.get('/env', (_req, res) => {
  res.json({ isWindows, platform: process.platform });
});

terminal.get('/detect', async (_req, res) => {
  res.json(await detectProcesses());
});

// Open a plain Windows Terminal tab in the project folder.
terminal.post('/launch/terminal', (req, res) => {
  handleLaunch(req.body ?? {}, res, { mode: 'terminal' });
});

// Open Windows Terminal and start Claude Code in the project folder.
terminal.post('/launch/claude', (req, res) => {
  handleLaunch(req.body ?? {}, res, { mode: 'claude', command: 'claude' });
});

// Run a saved/custom command in a new tab in the project folder.
terminal.post('/launch/command', (req, res) => {
  const body = (req.body ?? {}) as LaunchBody;
  let command = body.command;
  let label = body.label;
  if (body.command_id) {
    const cmd = db.prepare('SELECT * FROM commands WHERE id = ?').get(body.command_id) as any;
    if (!cmd) return res.status(404).json({ error: 'Command not found' });
    command = cmd.command;
    label = label ?? cmd.label;
  }
  if (!command) return res.status(400).json({ error: 'command or command_id is required' });
  handleLaunch({ ...body, command, label }, res, { mode: 'command', command });
});

function handleLaunch(
  body: LaunchBody,
  res: import('express').Response,
  ctx: { mode: 'terminal' | 'claude' | 'command'; command?: string }
) {
  const project = body.project_id
    ? (db.prepare('SELECT * FROM projects WHERE id = ?').get(body.project_id) as any)
    : null;

  if (body.project_id && !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const cwd = project?.path ?? '';
  const baseName = project?.name ?? 'Session';
  const title =
    body.label ??
    (ctx.mode === 'claude'
      ? `${baseName} · Claude`
      : ctx.mode === 'command'
        ? `${baseName} · ${truncate(ctx.command ?? '', 24)}`
        : `${baseName} · Terminal`);

  const result = launchWindowsTerminal({
    cwd,
    title,
    command: ctx.command,
    shell: body.shell ?? 'pwsh',
  });

  // Record the session even when not on Windows, so the dashboard stays usable
  // for planning; status reflects whether the launch actually happened.
  const sid = id();
  const status = result.ok ? 'active' : 'idle';
  db.prepare(
    `INSERT INTO sessions (id, project_id, name, status, source, pid, terminal, command, cwd)
     VALUES (?, ?, ?, ?, 'dashboard', ?, 'windows-terminal', ?, ?)`
  ).run(sid, project?.id ?? null, title, status, result.pid, ctx.command ?? '', cwd);

  logEvent(sid, 'launch', result.message, { argv: result.argv, mode: ctx.mode });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid);
  res.status(result.ok ? 201 : 200).json({ session, launch: result });
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
