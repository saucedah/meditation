import { Router } from 'express';
import { db, id } from '../db.js';
import { toEvent } from '../mappers.js';
import { logEvent } from '../events.js';
import type { SessionStatus } from '../types.js';

export const sessions = Router();

const STATUSES: SessionStatus[] = ['active', 'idle', 'needs_review', 'completed', 'error'];

// List sessions, optional filters: ?status=, ?project_id=, ?active=1
sessions.get('/', (req, res) => {
  const where: string[] = [];
  const params: any[] = [];
  if (req.query.project_id) {
    where.push('project_id = ?');
    params.push(req.query.project_id);
  }
  if (req.query.status) {
    where.push('status = ?');
    params.push(req.query.status);
  }
  if (req.query.active === '1') {
    where.push("status IN ('active','needs_review')");
  }
  const sql =
    'SELECT * FROM sessions' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY last_active_at DESC';
  res.json(db.prepare(sql).all(...params));
});

sessions.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Session not found' });
  res.json(row);
});

sessions.get('/:id/events', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM session_events WHERE session_id = ? ORDER BY created_at DESC')
    .all(req.params.id) as any[];
  res.json(rows.map(toEvent));
});

// Manually create a session record (e.g. linking an external terminal).
sessions.post('/', (req, res) => {
  const {
    project_id = null,
    name,
    status = 'active',
    source = 'manual',
    pid = null,
    terminal = 'windows-terminal',
    command = '',
    cwd = '',
  } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const sid = id();
  db.prepare(
    `INSERT INTO sessions (id, project_id, name, status, source, pid, terminal, command, cwd)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sid, project_id, name, status, source, pid, terminal, command, cwd);
  logEvent(sid, source === 'manual' ? 'linked' : 'detected', `Session created (${source})`, {
    pid,
  });
  res.status(201).json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid));
});

sessions.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  const b = req.body ?? {};

  if (b.status !== undefined && !STATUSES.includes(b.status)) {
    return res.status(400).json({ error: 'invalid status' });
  }

  const merged = {
    project_id: b.project_id !== undefined ? b.project_id : existing.project_id,
    name: b.name ?? existing.name,
    status: b.status ?? existing.status,
    summary: b.summary ?? existing.summary,
    next_steps: b.next_steps ?? existing.next_steps,
    notes: b.notes ?? existing.notes,
    ended_at:
      b.status === 'completed' || b.status === 'error'
        ? existing.ended_at ?? new Date().toISOString()
        : existing.ended_at,
  };

  db.prepare(
    `UPDATE sessions SET project_id=@project_id, name=@name, status=@status, summary=@summary,
       next_steps=@next_steps, notes=@notes, ended_at=@ended_at,
       last_active_at=datetime('now'), updated_at=datetime('now') WHERE id=@id`
  ).run({ ...merged, id: req.params.id });

  // Timeline entries for meaningful changes.
  if (b.name && b.name !== existing.name) {
    logEvent(req.params.id, 'rename', `Renamed to "${b.name}"`, { from: existing.name });
  }
  if (b.status && b.status !== existing.status) {
    logEvent(req.params.id, 'status', `Status → ${b.status}`, { from: existing.status });
  }
  if (
    (b.notes !== undefined && b.notes !== existing.notes) ||
    (b.summary !== undefined && b.summary !== existing.summary) ||
    (b.next_steps !== undefined && b.next_steps !== existing.next_steps)
  ) {
    logEvent(req.params.id, 'note', 'Notes updated');
  }

  res.json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id));
});

sessions.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.status(204).end();
});
