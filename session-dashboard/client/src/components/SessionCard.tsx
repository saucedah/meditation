import { Link } from 'react-router-dom';
import { Clock, Hash, FolderGit2 } from 'lucide-react';
import { relativeTime } from '../lib/format';
import type { Session } from '../lib/types';
import { StatusBadge } from './StatusBadge';

export function SessionCard({ session, projectName }: { session: Session; projectName?: string }) {
  return (
    <Link to={`/sessions/${session.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="card-head">
        <div>
          <div className="card-title">{session.name}</div>
          <div className="flex muted" style={{ fontSize: 12, marginTop: 4, gap: 6 }}>
            <FolderGit2 size={13} />
            {projectName ?? 'Unlinked'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {session.command && <div className="sess-cmd">$ {session.command}</div>}
      {session.summary && <div className="card-desc">{session.summary}</div>}

      <div className="sess-meta">
        <span>
          <Clock size={12} /> <b>{relativeTime(session.last_active_at)}</b>
        </span>
        {session.pid != null && (
          <span>
            <Hash size={12} /> PID <b>{session.pid}</b>
          </span>
        )}
        <span className="chip" style={{ textTransform: 'capitalize' }}>
          {session.source}
        </span>
      </div>
    </Link>
  );
}
