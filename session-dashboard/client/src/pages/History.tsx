import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { History as HistoryIcon } from 'lucide-react';
import { api } from '../lib/api';
import { clockTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';

export function History() {
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.listSessions() });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  const projMap = useMemo(
    () => Object.fromEntries((projects.data ?? []).map((p) => [p.id, p.name])),
    [projects.data]
  );

  // Group sessions by calendar day of last activity.
  const groups = useMemo(() => {
    const map = new Map<string, typeof sessions.data>();
    const sorted = [...(sessions.data ?? [])].sort((a, b) => b.last_active_at.localeCompare(a.last_active_at));
    for (const s of sorted) {
      const day = new Date(s.last_active_at.replace(' ', 'T') + 'Z').toDateString();
      const arr = map.get(day) ?? [];
      arr.push(s);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [sessions.data]);

  return (
    <div className="content">
      <div className="section-head">
        <div>
          <div className="page-title">History</div>
          <div className="page-sub">Full chronological log of every session.</div>
        </div>
      </div>

      {groups.length ? (
        groups.map(([day, items]) => (
          <div key={day} style={{ marginBottom: 24 }}>
            <div className="palette-group" style={{ paddingLeft: 0 }}>{day}</div>
            <div className="panel" style={{ padding: '6px 18px' }}>
              {(items ?? []).map((s) => (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  className="flex"
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--line-soft)', textDecoration: 'none', color: 'inherit' }}
                >
                  <span className="tl-time" style={{ minWidth: 110 }}>{clockTime(s.last_active_at)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {s.project_id ? projMap[s.project_id] : 'Unlinked'}
                      {s.summary ? ` · ${s.summary.slice(0, 80)}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty">
          <HistoryIcon size={28} />
          <h3>No history yet</h3>
          <p>Launched and imported sessions will appear here.</p>
        </div>
      )}
    </div>
  );
}
