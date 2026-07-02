export type SessionStatus = 'active' | 'idle' | 'needs_review' | 'completed' | 'error';
export type SessionSource = 'dashboard' | 'imported' | 'manual';
export type CommandKind = 'claude' | 'dev' | 'test' | 'git' | 'custom';

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  tags: string[];
  favorite: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Command {
  id: string;
  project_id: string | null;
  label: string;
  command: string;
  kind: CommandKind;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: string | null;
  name: string;
  status: SessionStatus;
  source: SessionSource;
  pid: number | null;
  terminal: string;
  command: string;
  cwd: string;
  summary: string;
  next_steps: string;
  notes: string;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  type: 'launch' | 'status' | 'rename' | 'note' | 'detected' | 'linked' | 'closed';
  message: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface DetectedProcess {
  pid: number;
  name: string;
  commandLine: string;
  parentPid: number | null;
  startTime: string | null;
  kind: 'terminal' | 'claude' | 'shell' | 'node' | 'other';
}

export interface LaunchResult {
  ok: boolean;
  pid: number | null;
  argv: string[];
  message: string;
}

export const STATUS_META: Record<
  SessionStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: 'Active', color: 'var(--ok)', dot: 'var(--ok)' },
  idle: { label: 'Idle', color: 'var(--muted)', dot: 'var(--muted)' },
  needs_review: { label: 'Needs Review', color: 'var(--warn)', dot: 'var(--warn)' },
  completed: { label: 'Completed', color: 'var(--accent)', dot: 'var(--accent)' },
  error: { label: 'Error', color: 'var(--danger)', dot: 'var(--danger)' },
};
