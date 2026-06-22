import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Star } from 'lucide-react';
import { api } from '../lib/api';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import type { Project } from '../lib/types';

export function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });
  const data = projects.data ?? [];

  const allTags = useMemo(() => Array.from(new Set(data.flatMap((p) => p.tags))).sort(), [data]);

  const filtered = data.filter((p) => {
    if (favOnly && !p.favorite) return false;
    if (tag && !p.tags.includes(tag)) return false;
    if (q) {
      const t = q.toLowerCase();
      return (
        p.name.toLowerCase().includes(t) ||
        p.path.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t) ||
        p.tags.some((x) => x.toLowerCase().includes(t))
      );
    }
    return true;
  });

  return (
    <div className="content">
      <div className="section-head">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">{data.length} project{data.length === 1 ? '' : 's'} · {filtered.length} shown</div>
        </div>
        <button className="btn primary" onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus size={16} /> New project
        </button>
      </div>

      <div className="flex" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="search-trigger" style={{ flex: 1, minWidth: 220, cursor: 'text' }}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, paths, tags…"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', flex: 1, fontSize: 13 }}
          />
        </div>
        <button className={`btn sm ${favOnly ? 'primary' : 'ghost'}`} onClick={() => setFavOnly((v) => !v)}>
          <Star size={14} /> Favorites
        </button>
        {allTags.map((t) => (
          <button key={t} className={`btn sm ${tag === t ? 'primary' : 'ghost'}`} onClick={() => setTag(tag === t ? null : t)}>
            #{t}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid cards">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={(proj) => { setEditing(proj); setShowForm(true); }} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>No projects match</h3>
          <p>Adjust your filters or create a new project.</p>
        </div>
      )}

      {showForm && <ProjectForm project={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}
