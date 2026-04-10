import { StoredMessage, UserProfile } from "./types";

// The Agent class exposes `this.sql` as a tagged template literal that returns
// an iterable of row objects. We receive it typed as `any` here and use it
// narrowly so we don't need to import the full agents SDK in this file.
type SqlRunner = (strings: TemplateStringsArray, ...values: unknown[]) => Iterable<Record<string, unknown>>;

const MAX_CONTEXT_MESSAGES = 40; // sent to the LLM — keeps token usage bounded

// ── Schema ────────────────────────────────────────────────────────────────────
export function ensureSchema(sql: SqlRunner): void {
  sql`
    CREATE TABLE IF NOT EXISTS messages (
      id        TEXT PRIMARY KEY,
      role      TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content   TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `;

  sql`
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function insertMessage(sql: SqlRunner, msg: StoredMessage): void {
  sql`
    INSERT INTO messages (id, role, content, timestamp)
    VALUES (${msg.id}, ${msg.role}, ${msg.content}, ${msg.timestamp})
  `;
}

export function getRecentMessages(sql: SqlRunner, limit = MAX_CONTEXT_MESSAGES): StoredMessage[] {
  const rows = sql`
    SELECT id, role, content, timestamp
    FROM messages
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;
  const msgs: StoredMessage[] = [];
  for (const row of rows) {
    msgs.push({
      id: row.id as string,
      role: row.role as "user" | "assistant",
      content: row.content as string,
      timestamp: row.timestamp as string,
    });
  }
  // Return in chronological order
  return msgs.reverse();
}

export function getAllMessages(sql: SqlRunner): StoredMessage[] {
  const rows = sql`SELECT id, role, content, timestamp FROM messages ORDER BY timestamp ASC`;
  const msgs: StoredMessage[] = [];
  for (const row of rows) {
    msgs.push({
      id: row.id as string,
      role: row.role as "user" | "assistant",
      content: row.content as string,
      timestamp: row.timestamp as string,
    });
  }
  return msgs;
}

export function clearMessages(sql: SqlRunner): void {
  sql`DELETE FROM messages`;
}

// ── Profile (stored as JSON in the kv table) ──────────────────────────────────
export function saveProfile(sql: SqlRunner, profile: UserProfile): void {
  const json = JSON.stringify(profile);
  sql`INSERT INTO kv (key, value) VALUES ('profile', ${json})
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`;
}

export function loadProfile(sql: SqlRunner): UserProfile | null {
  const rows = sql`SELECT value FROM kv WHERE key = 'profile'`;
  for (const row of rows) {
    try {
      return JSON.parse(row.value as string) as UserProfile;
    } catch {
      return null;
    }
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
