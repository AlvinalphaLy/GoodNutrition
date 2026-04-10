/**
 * Re-exports the chat handler documentation / types.
 *
 * The actual handler is defined as a private method on NutritionChatAgent
 * so it has direct access to `this.sql`, `this.state`, `this.env`, and
 * `this.ctx.waitUntil`. That coupling is intentional — Durable Object
 * context cannot be passed around as a plain value.
 *
 * This file documents the HTTP contract for the /chat endpoint.
 */

/**
 * POST /api/sessions/:sessionId/chat
 *
 * Request body:
 *   { "message": "What should I eat for lunch?" }
 *
 * Response: text/event-stream (SSE)
 *   Each event carries one of:
 *     data: {"type":"text_delta","content":"some text"}\n\n
 *     data: {"type":"done"}\n\n
 *     data: {"type":"error","error":"message"}\n\n
 *
 * The client should append text_delta.content to the current assistant message,
 * then mark the message complete on "done" or show an error on "error".
 *
 * Errors:
 *   400 — missing or empty `message` field
 *   500 — unexpected server error (also delivered as a stream `error` chunk)
 */
export type ChatEndpointDocs = never; // export forces the file to be a module
