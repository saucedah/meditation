import { db, id } from './db.js';
import type { SessionEvent } from './types.js';

/** Append an event to a session's timeline. */
export function logEvent(
  sessionId: string,
  type: SessionEvent['type'],
  message: string,
  meta: Record<string, unknown> = {}
): void {
  db.prepare(
    `INSERT INTO session_events (id, session_id, type, message, meta)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id(), sessionId, type, message, JSON.stringify(meta));
}
