import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RadioTower } from 'lucide-react';
import { api } from '../lib/api';
import { SessionCard } from '../components/SessionCard';
import { DetectModal } from '../components/DetectModal';
import { STATUS_META, type SessionStatus } from '../lib/types';

const STATUS_ORDER: SessionStatus[] = ['active', 'needs_review', 'idle', 'completed', 'error'];

export function Sessions() {
  const [status, setStatus] = useState<SessionStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [showDetect, setShowDetect] = useState(false);

  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.listSessions() });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  const projMap = useMemo(
    () => Object.fromEntries((projects.data ?? []).map((p) => [p.id, p.name])),
    [projects.data]
  );

  const data = sessions.data ?? [];
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of data) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [data]);

  const filtered = data.filter((s) => {
    if (status !== 'all' && s.status !== status) return false;
    if (q) {
      const t = q.toLowerCase();
      return (
        s.name.toLowerCase().includes(t) ||
        s.command.toLowerCase().includes(t) ||
        s.summary.toLowerCase().includes(t)
      );
    }
    return true;
  });

  return (
    <div className="content">
      <div className="section-head">
        <div>
          <div className="page-title">Sessions</div>
          <div className="page-sub">{data.length} total · {filtered.length} shown</div>
        </div>
        <button className="btn" onClick={() => setShowDetect(true)}>
          <RadioTower size={16} /> Detect &amp; import
        </button>
      </div>

      <div className="flex" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="search-trigger" style={{ flex: 1, minWidth: 220, cursor: 'text' }}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sessions…"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', flex: 1, fontSize: 13 }}
          />
        </div>
        <button className={`btn sm ${status === 'all' ? 'primary' : 'ghost'}`} onClick={() => setStatus('all')}>
          All ({data.length})
        </button>
        {STATUS_ORDER.map((s) => (
          <button key={s} className={`btn sm ${status === s ? 'primary' : 'ghost'}`} onClick={() => setStatus(s)}>
            {STATUS_META[s].label} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid sessions">
          {filtered.map((s) => (
            <SessionCard key={s.id} session={s} projectName={s.project_id ? projMap[s.project_id] : undefined} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <RadioTower size={28} />
          <h3>No sessions</h3>
          <p>Launch from a project, or import external terminals.</p>
        </div>
      )}

      {showDetect && <DetectModal onClose={() => setShowDetect(false)} />}
    </div>
  );
}
