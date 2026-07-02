import type { Command, Project, Session, SessionEvent } from './types.js';

/* Raw row shapes as stored in SQLite (booleans/JSON as int/text). */
type ProjectRow = Omit<Project, 'tags' | 'favorite'> & { tags: string; favorite: number };
type SessionRow = Session;
type EventRow = Omit<SessionEvent, 'meta'> & { meta: string };

export function toProject(r: ProjectRow): Project {
  return {
    ...r,
    tags: safeParseArray(r.tags),
    favorite: !!r.favorite,
  };
}

export function toSession(r: SessionRow): Session {
  return r;
}

export function toCommand(r: Command): Command {
  return r;
}

export function toEvent(r: EventRow): SessionEvent {
  return { ...r, meta: safeParseObject(r.meta) };
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function safeParseObject(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
