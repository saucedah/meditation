import { Router } from 'express';
import { db, id } from '../db.js';
import { toProject } from '../mappers.js';

export const projects = Router();

projects.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM projects ORDER BY favorite DESC, name COLLATE NOCASE ASC')
    .all() as any[];
  res.json(rows.map(toProject));
});

projects.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Project not found' });
  res.json(toProject(row));
});

projects.post('/', (req, res) => {
  const { name, path = '', description = '', tags = [], favorite = false, color = '#5b8cff' } =
    req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  const pid = id();
  db.prepare(
    `INSERT INTO projects (id, name, path, description, tags, favorite, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(pid, name, path, description, JSON.stringify(tags), favorite ? 1 : 0, color);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid) as any;
  res.status(201).json(toProject(row));
});

projects.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const b = req.body ?? {};
  const merged = {
    name: b.name ?? existing.name,
    path: b.path ?? existing.path,
    description: b.description ?? existing.description,
    tags: b.tags !== undefined ? JSON.stringify(b.tags) : existing.tags,
    favorite: b.favorite !== undefined ? (b.favorite ? 1 : 0) : existing.favorite,
    color: b.color ?? existing.color,
  };
  db.prepare(
    `UPDATE projects SET name=@name, path=@path, description=@description, tags=@tags,
       favorite=@favorite, color=@color, updated_at=datetime('now') WHERE id=@id`
  ).run({ ...merged, id: req.params.id });
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  res.json(toProject(row));
});

projects.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.status(204).end();
});
