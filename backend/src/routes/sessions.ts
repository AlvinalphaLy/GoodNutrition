/**
 * Session endpoints implemented inside NutritionChatAgent.
 *
 * ── GET /api/sessions/:sessionId/messages ───────────────────────────────────
 * Returns the full message history for a session.
 * The frontend calls this on mount to restore the conversation.
 *
 * Response:
 *   200  { "messages": [ { id, role, content, timestamp }, … ] }
 *   404  — never; returns 200 with empty array for new sessions
 *
 * ── POST /api/sessions/:sessionId/clear ──────────────────────────────────────
 * Deletes all messages in the session. Does not delete the session itself
 * or the user profile — those persist until the DO is evicted.
 *
 * Response:
 *   200  { "ok": true }
 *
 * ── Session lifecycle ─────────────────────────────────────────────────────────
 * Sessions are created implicitly on the first POST /chat request.
 * The sessionId is generated client-side (see useAiChat.ts) as:
 *   `${userId}-${Date.now()}`
 * This means each app launch creates a new session by default.
 * To resume a previous session, persist the sessionId in AsyncStorage and
 * pass it as `initialSessionId` to useAiChat.
 *
 * Cloudflare Durable Objects are not deleted automatically. For production,
 * add a TTL-based eviction strategy (e.g. a scheduled Worker that calls DELETE).
 */
export type SessionEndpointDocs = never;
