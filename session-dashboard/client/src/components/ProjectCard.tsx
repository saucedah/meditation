import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Sparkles, TerminalSquare, Pencil, Trash2, FolderGit2, Play } from 'lucide-react';
import { api } from '../lib/api';
import { useLaunch } from '../lib/useLaunch';
import { useToast } from '../lib/toast';
import type { Project } from '../lib/types';

export function ProjectCard({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (p: Project) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const { launch, isPending } = useLaunch();

  const commands = useQuery({
    queryKey: ['commands', project.id],
    queryFn: () => api.listCommands({ project_id: project.id }),
  });

  const toggleFav = useMutation({
    mutationFn: () => api.updateProject(project.id, { favorite: !project.favorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const del = useMutation({
    mutationFn: () => api.deleteProject(project.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast('Project deleted', 'ok');
    },
  });

  return (
    <div className="card" style={{ animationDelay: '0.02s' }}>
      <div className="card-accent" style={{ background: project.color }} />
      <div className="card-head">
        <div>
          <div className="card-title">{project.name}</div>
          <div className="card-path">{project.path || 'no folder set'}</div>
        </div>
        <Star
          size={18}
          className={`fav-star ${project.favorite ? 'on' : ''}`}
          fill={project.favorite ? 'currentColor' : 'none'}
          onClick={() => toggleFav.mutate()}
        />
      </div>

      {project.description && <div className="card-desc">{project.description}</div>}

      {project.tags.length > 0 && (
        <div className="tag-row">
          {project.tags.map((t) => (
            <span className="tag" key={t}>
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="cmd-row">
        <button className="btn primary sm" disabled={isPending} onClick={() => launch(project.id, { type: 'claude' })}>
          <Sparkles size={14} /> Open Claude
        </button>
        <button className="btn sm" disabled={isPending} onClick={() => launch(project.id, { type: 'terminal' })}>
          <TerminalSquare size={14} /> Terminal
        </button>
        {(commands.data ?? []).map((c) => (
          <button
            key={c.id}
            className="btn sm ghost"
            disabled={isPending}
            title={c.command}
            onClick={() => launch(project.id, { type: 'command', command_id: c.id })}
          >
            <Play size={13} /> {c.label}
          </button>
        ))}
      </div>

      <div className="flex" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
        <FolderGit2 size={14} className="muted" />
        <span className="muted" style={{ fontSize: 12 }}>
          {(commands.data ?? []).length} saved command{(commands.data ?? []).length === 1 ? '' : 's'}
        </span>
        <button className="btn sm ghost right" onClick={() => onEdit(project)}>
          <Pencil size={13} /> Edit
        </button>
        <button
          className="btn sm ghost danger"
          onClick={() => {
            if (confirm(`Delete "${project.name}"? Sessions will be kept but unlinked.`)) del.mutate();
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
