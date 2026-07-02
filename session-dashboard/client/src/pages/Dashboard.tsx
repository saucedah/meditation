import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Radio, FolderGit2, Activity, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { SessionCard } from '../components/SessionCard';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import type { Project } from '../lib/types';

export function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.listSessions() });
  const env = useQuery({ queryKey: ['env'], queryFn: () => api.env() });

  const projMap = useMemo(
    () => Object.fromEntries((projects.data ?? []).map((p) => [p.id, p.name])),
    [projects.data]
  );

  const all = sessions.data ?? [];
  const active = all.filter((s) => s.status === 'active' || s.status === 'needs_review');
  const recent = all.slice(0, 6);
  const needsReview = all.filter((s) => s.status === 'needs_review').length;
  const favorites = (projects.data ?? []).filter((p) => p.favorite).slice(0, 6);
  const showcaseProjects = favorites.length ? favorites : (projects.data ?? []).slice(0, 6);

  const stats = [
    { k: 'Projects', v: projects.data?.length ?? 0, icon: FolderGit2 },
    { k: 'Active sessions', v: active.length, icon: Radio },
    { k: 'Total sessions', v: all.length, icon: Activity },
    { k: 'Needs review', v: needsReview, icon: AlertTriangle },
  ];

  return (
    <div className="content">
      {env.data && !env.data.isWindows && (
        <div className="banner warn">
          <AlertTriangle size={16} />
          Server is running on <b style={{ margin: '0 4px' }}>{env.data.platform}</b>, not Windows —
          terminal launch &amp; detection are simulated. Run the server on Windows to actually open tabs.
        </div>
      )}

      <div className="section-head">
        <div>
          <div className="page-title">Mission Control</div>
          <div className="page-sub">Every project and session in one command center.</div>
        </div>
        <button className="btn primary" onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus size={16} /> New project
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 28 }}>
        {stats.map((s) => (
          <div className="card" key={s.k} style={{ padding: 16 }}>
            <div className="flex">
              <s.icon size={18} style={{ color: 'var(--accent)' }} />
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.k}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>Active sessions</h2>
        <Link to="/sessions" className="btn sm ghost">View all</Link>
      </div>
      {active.length ? (
        <div className="grid sessions" style={{ marginBottom: 28 }}>
          {active.map((s) => (
            <SessionCard key={s.id} session={s} projectName={s.project_id ? projMap[s.project_id] : undefined} />
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: 36 }}>
          <Radio size={28} />
          <h3>No active sessions</h3>
          <p>Launch Claude or a terminal from a project to start one.</p>
        </div>
      )}

      <div className="section-head">
        <h2>{favorites.length ? 'Favorite projects' : 'Projects'}</h2>
        <Link to="/projects" className="btn sm ghost">Manage</Link>
      </div>
      {showcaseProjects.length ? (
        <div className="grid cards" style={{ marginBottom: 28 }}>
          {showcaseProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={(proj) => { setEditing(proj); setShowForm(true); }} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <FolderGit2 size={28} />
          <h3>No projects yet</h3>
          <p>Create your first project to start launching sessions.</p>
          <button className="btn primary" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
            <Plus size={16} /> New project
          </button>
        </div>
      )}

      {recent.length > 0 && (
        <>
          <div className="section-head">
            <h2>Recent sessions</h2>
          </div>
          <div className="grid sessions">
            {recent.map((s) => (
              <SessionCard key={s.id} session={s} projectName={s.project_id ? projMap[s.project_id] : undefined} />
            ))}
          </div>
        </>
      )}

      {showForm && <ProjectForm project={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}
