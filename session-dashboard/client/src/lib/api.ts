import type {
  Command,
  DetectedProcess,
  LaunchResult,
  Project,
  Session,
  SessionEvent,
} from './types';

const BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Projects
  listProjects: () => req<Project[]>('/projects'),
  getProject: (id: string) => req<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    req<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    req<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => req<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Commands
  listCommands: (q?: { project_id?: string; scope?: 'global' }) => {
    const p = new URLSearchParams();
    if (q?.project_id) p.set('project_id', q.project_id);
    if (q?.scope) p.set('scope', q.scope);
    const qs = p.toString();
    return req<Command[]>(`/commands${qs ? `?${qs}` : ''}`);
  },
  createCommand: (data: Partial<Command>) =>
    req<Command>('/commands', { method: 'POST', body: JSON.stringify(data) }),
  updateCommand: (id: string, data: Partial<Command>) =>
    req<Command>(`/commands/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCommand: (id: string) => req<void>(`/commands/${id}`, { method: 'DELETE' }),

  // Sessions
  listSessions: (q?: { project_id?: string; status?: string; active?: boolean }) => {
    const p = new URLSearchParams();
    if (q?.project_id) p.set('project_id', q.project_id);
    if (q?.status) p.set('status', q.status);
    if (q?.active) p.set('active', '1');
    const qs = p.toString();
    return req<Session[]>(`/sessions${qs ? `?${qs}` : ''}`);
  },
  getSession: (id: string) => req<Session>(`/sessions/${id}`),
  sessionEvents: (id: string) => req<SessionEvent[]>(`/sessions/${id}/events`),
  createSession: (data: Partial<Session>) =>
    req<Session>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id: string, data: Partial<Session>) =>
    req<Session>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSession: (id: string) => req<void>(`/sessions/${id}`, { method: 'DELETE' }),

  // Terminal / detection
  env: () => req<{ isWindows: boolean; platform: string }>('/env'),
  detect: () =>
    req<{ supported: boolean; message: string; processes: DetectedProcess[] }>('/detect'),
  launchTerminal: (data: { project_id?: string; label?: string }) =>
    req<{ session: Session; launch: LaunchResult }>('/launch/terminal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  launchClaude: (data: { project_id?: string; label?: string }) =>
    req<{ session: Session; launch: LaunchResult }>('/launch/claude', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  launchCommand: (data: {
    project_id?: string;
    command_id?: string;
    command?: string;
    label?: string;
  }) =>
    req<{ session: Session; launch: LaunchResult }>('/launch/command', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
