/**
 * Cloudflare Worker entry point.
 *
 * Routing:
 *   /api/sessions/:sessionId/*  →  NutritionChatAgent (Durable Object)
 *   /health                     →  200 OK
 *   everything else             →  404
 *
 * The `agents` package builds on `partyserver`, which requires two internal
 * headers on every request before it will dispatch to your Agent class:
 *   x-partykit-room      — the DO instance identifier (our sessionId)
 *   x-partykit-namespace — the binding name in wrangler.jsonc
 *
 * routeAgentRequest() sets these automatically for /agents/* URLs.
 * Since we want to keep /api/sessions/* for a cleaner public API, we
 * set the headers manually in forwardToAgent() below.
 */

import { Env } from "./lib/types";
import { handleVoiceParse } from "./handlers/voiceParse";
import { handleSpeechToText } from "./handlers/speechToText";

export { NutritionChatAgent } from "./agents/NutritionChatAgent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ── CORS preflight — handle at Worker level so it never hits the Agent ──
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── Health check ──────────────────────────────────────────────────────────
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── Voice STT + parse ─────────────────────────────────────────────────────
    if (url.pathname === "/api/voice-stt" && request.method === "POST") {
      return handleSpeechToText(request, env);
    }

    if (url.pathname === "/api/voice-parse" && request.method === "POST") {
      return handleVoiceParse(request, env);
    }

    // ── Route to Agent ────────────────────────────────────────────────────────
    // Pattern: /api/sessions/{sessionId}/{action}
    const match = url.pathname.match(/^\/api\/sessions\/([^/]+)\//);
    if (match) {
      const sessionId = decodeURIComponent(match[1]);
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Invalid session ID." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return forwardToAgent(request, env, sessionId);
    }

    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  },
};

/**
 * Forward a request to the correct NutritionChatAgent instance.
 *
 * partyserver (which `agents` wraps) validates two headers on every
 * inbound request and throws if they're absent. We inject them here
 * so that our /api/sessions/* URL shape is preserved end-to-end.
 */
async function forwardToAgent(
  request: Request,
  env: Env,
  sessionId: string,
): Promise<Response> {
  const id = env.NUTRITION_CHAT_AGENT.idFromName(sessionId);
  const stub = env.NUTRITION_CHAT_AGENT.get(id);

  // Copy all original headers and add the two partyserver requires.
  const headers = new Headers(request.headers);
  headers.set("x-partykit-room", sessionId);
  headers.set("x-partykit-namespace", "NUTRITION_CHAT_AGENT");

  // new Request(original, overrides) clones the request, preserving the body
  // stream — safe for POST /chat with a JSON body.
  const proxied = new Request(request, { headers });

  return stub.fetch(proxied);
}
