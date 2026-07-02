import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import type { Project } from '../lib/types';
import { Modal } from './Modal';

const COLORS = ['#5b8cff', '#8a6bff', '#2fe6e0', '#34e1a4', '#ffc24b', '#ff6b7d', '#ff9b54'];

export function ProjectForm({ project, onClose }: { project?: Project; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const editing = !!project;

  const [name, setName] = useState(project?.name ?? '');
  const [path, setPath] = useState(project?.path ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [tags, setTags] = useState((project?.tags ?? []).join(', '));
  const [color, setColor] = useState(project?.color ?? COLORS[0]);
  const [favorite, setFavorite] = useState(project?.favorite ?? false);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        path,
        description,
        color,
        favorite,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      return editing ? api.updateProject(project!.id, payload) : api.createProject(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast(editing ? 'Project updated' : 'Project created', 'ok');
      onClose();
    },
    onError: (e: Error) => toast(e.message, 'err'),
  });

  return (
    <Modal title={editing ? 'Edit project' : 'New project'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return toast('Name is required', 'err');
          save.mutate();
        }}
      >
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="My Project" />
        </div>
        <div className="field">
          <label>Folder path</label>
          <input
            className="input mono"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="C:\Users\you\code\my-project"
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project?" />
        </div>
        <div className="row2">
          <div className="field">
            <label>Tags (comma separated)</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="web, client, urgent" />
          </div>
          <div className="field">
            <label>Accent color</label>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
          Mark as favorite
        </label>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
