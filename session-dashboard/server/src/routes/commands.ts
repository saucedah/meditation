import { Router } from 'express';
import { db, id } from '../db.js';

export const commands = Router();

// List commands; ?project_id=... for a project, ?scope=global for templates, default all.
commands.get('/', (req, res) => {
  const projectId = req.query.project_id as string | undefined;
  const scope = req.query.scope as string | undefined;
  let rows;
  if (scope === 'global') {
    rows = db
      .prepare('SELECT * FROM commands WHERE project_id IS NULL ORDER BY sort_order, label')
      .all();
  } else if (projectId) {
    rows = db
      .prepare('SELECT * FROM commands WHERE project_id = ? ORDER BY sort_order, label')
      .all(projectId);
  } else {
    rows = db.prepare('SELECT * FROM commands ORDER BY sort_order, label').all();
  }
  res.json(rows);
});

commands.post('/', (req, res) => {
  const {
    project_id = null,
    label,
    command,
    kind = 'custom',
    icon = 'terminal',
    sort_order = 0,
  } = req.body ?? {};
  if (!label || !command) {
    return res.status(400).json({ error: 'label and command are required' });
  }
  const cid = id();
  db.prepare(
    `INSERT INTO commands (id, project_id, label, command, kind, icon, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(cid, project_id, label, command, kind, icon, sort_order);
  res.status(201).json(db.prepare('SELECT * FROM commands WHERE id = ?').get(cid));
});

commands.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM commands WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Command not found' });
  const b = req.body ?? {};
  const merged = {
    label: b.label ?? existing.label,
    command: b.command ?? existing.command,
    kind: b.kind ?? existing.kind,
    icon: b.icon ?? existing.icon,
    sort_order: b.sort_order ?? existing.sort_order,
  };
  db.prepare(
    `UPDATE commands SET label=@label, command=@command, kind=@kind, icon=@icon,
       sort_order=@sort_order WHERE id=@id`
  ).run({ ...merged, id: req.params.id });
  res.json(db.prepare('SELECT * FROM commands WHERE id = ?').get(req.params.id));
});

commands.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM commands WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Command not found' });
  res.status(204).end();
});
