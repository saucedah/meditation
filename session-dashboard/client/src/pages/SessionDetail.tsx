import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Check, Pencil } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { clockTime, relativeTime } from '../lib/format';
import { STATUS_META, type SessionStatus } from '../lib/types';

const STATUSES: SessionStatus[] = ['active', 'idle', 'needs_review', 'completed', 'error'];

export function SessionDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const session = useQuery({ queryKey: ['session', id], queryFn: () => api.getSession(id) });
  const events = useQuery({ queryKey: ['session-events', id], queryFn: () => api.sessionEvents(id) });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [notes, setNotes] = useState('');

  const s = session.data;
  useEffect(() => {
    if (s) {
      setName(s.name);
      setSummary(s.summary);
      setNextSteps(s.next_steps);
      setNotes(s.notes);
    }
  }, [s]);

  const update = useMutation({
    mutationFn: (data: Parameters<typeof api.updateSession>[1]) => api.updateSession(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['session-events', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast('Session updated', 'ok');
    },
    onError: (e: Error) => toast(e.message, 'err'),
  });

  const del = useMutation({
    mutationFn: () => api.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast('Session deleted', 'ok');
      nav('/sessions');
    },
  });

  if (session.isLoading) return <div className="content"><div className="empty">Loading…</div></div>;
  if (!s) return <div className="content"><div className="empty"><h3>Session not found</h3><Link className="btn" to="/sessions">Back</Link></div></div>;

  const project = projects.data?.find((p) => p.id === s.project_id);

  return (
    <div className="content">
      <button className="btn sm ghost" style={{ marginBottom: 16 }} onClick={() => nav(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="section-head">
        <div style={{ flex: 1 }}>
          {editName ? (
            <div className="flex">
              <input className="input" style={{ maxWidth: 420, fontSize: 18 }} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <button className="btn sm primary" onClick={() => { update.mutate({ name }); setEditName(false); }}>
                <Check size={14} /> Save
              </button>
            </div>
          ) : (
            <div className="flex">
              <div className="page-title">{s.name}</div>
              <button className="btn icon ghost sm" onClick={() => setEditName(true)} title="Rename"><Pencil size={14} /></button>
            </div>
          )}
          <div className="page-sub">
            {project ? <Link to="/projects" style={{ color: 'var(--accent)' }}>{project.name}</Link> : 'Unlinked'} · started {clockTime(s.started_at)}
          </div>
        </div>
        <button className="btn danger" onClick={() => { if (confirm('Delete this session?')) del.mutate(); }}>
          <Trash2 size={15} /> Delete
        </button>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel">
            <h3>Status & details</h3>
            <div className="stat-row">
              <div className="stat"><div className="k">Status</div>
                <select
                  className="select" style={{ marginTop: 4, maxWidth: 180 }}
                  value={s.status}
                  onChange={(e) => update.mutate({ status: e.target.value as SessionStatus })}
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{STATUS_META[st].label}</option>)}
                </select>
              </div>
              <div className="stat"><div className="k">Source</div><div className="v" style={{ textTransform: 'capitalize' }}>{s.source}</div></div>
              <div className="stat"><div className="k">PID</div><div className="v">{s.pid ?? '—'}</div></div>
              <div className="stat"><div className="k">Last active</div><div className="v">{relativeTime(s.last_active_at)}</div></div>
            </div>
            {s.cwd && <div className="card-path">📁 {s.cwd}</div>}
            {s.command && <div className="sess-cmd" style={{ marginTop: 10 }}>$ {s.command}</div>}
          </div>

          <div className="panel">
            <h3>Notes & next steps</h3>
            <div className="field">
              <label>Summary</label>
              <textarea className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What happened in this session?" />
            </div>
            <div className="field">
              <label>Next steps</label>
              <textarea className="textarea" value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="What to do next…" />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth remembering…" />
            </div>
            <button className="btn primary" onClick={() => update.mutate({ summary, next_steps: nextSteps, notes })} disabled={update.isPending}>
              <Save size={15} /> Save notes
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Timeline</h3>
          {(events.data ?? []).length ? (
            <div className="timeline">
              {(events.data ?? []).map((ev) => (
                <div className={`tl-item ${ev.type}`} key={ev.id}>
                  <div className="tl-time">{clockTime(ev.created_at)}</div>
                  <div className="tl-msg">{ev.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No events yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
