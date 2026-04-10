import { ChatMessage, UserProfile } from "../types/chat";
import { mapApiMessage } from "../utils/messageMapper";

// Set EXPO_PUBLIC_AI_BACKEND_URL in your .env file.
// For local dev: http://localhost:8787
// For production: https://good-nutrition-ai.your-subdomain.workers.dev
const BASE_URL = (process.env.EXPO_PUBLIC_AI_BACKEND_URL ?? "http://localhost:8787").replace(/\/$/, "");

function sessionBase(sessionId: string): string {
  return `${BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}`;
}

/**
 * Returns the full URL for the streaming chat endpoint.
 * Used directly by streamClient.ts.
 */
export function chatStreamUrl(sessionId: string): string {
  return `${sessionBase(sessionId)}/chat`;
}

/**
 * Fetch the message history for an existing session.
 * Returns [] on 404 (new session — not an error).
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${sessionBase(sessionId)}/messages`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
  const data = (await res.json()) as { messages: unknown[] };
  return (data.messages ?? []).map((m) => mapApiMessage(m as Parameters<typeof mapApiMessage>[0]));
}

/**
 * Update the user profile stored in the session.
 * Called when profile data changes (e.g. after onboarding).
 */
export async function updateSessionProfile(
  sessionId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const res = await fetch(`${sessionBase(sessionId)}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error(`Failed to update profile: ${res.status}`);
}

/**
 * Clear all messages in a session (start fresh).
 */
export async function clearSession(sessionId: string): Promise<void> {
  const res = await fetch(`${sessionBase(sessionId)}/clear`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to clear session: ${res.status}`);
}
