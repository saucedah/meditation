import { STATUS_META, type SessionStatus } from '../lib/types';

export function StatusBadge({ status }: { status: SessionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${status === 'active' ? 'active' : ''}`} style={{ color: meta.color }}>
      <span className="dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
