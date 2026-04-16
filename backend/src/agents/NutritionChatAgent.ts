import { Agent } from "agents";
import { buildSystemPrompt } from "../lib/prompt";
import { checkOutputSafety, checkSafety } from "../lib/safety";
import {
  AgentState,
  AttachmentPayload,
  ChatRequest,
  DEFAULT_AGENT_STATE,
  Env,
  ProfileUpdateRequest,
  StoredMessage,
  StreamChunk,
  UserProfile,
} from "../lib/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MAX_CONTEXT = 40;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export class NutritionChatAgent extends Agent<Env, AgentState> {
  initialState = DEFAULT_AGENT_STATE;

  // ── DB init ─────────────────────────────────────────────────────────────────
  private initDb(): void {
    this.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id        TEXT PRIMARY KEY,
        role      TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content   TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `;
    this.sql`
      CREATE TABLE IF NOT EXISTS kv (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
  }

  // ── HTTP entry ──────────────────────────────────────────────────────────────
  async onRequest(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      this.initDb();
    } catch (e) {
      console.error("[Agent] initDb failed:", e);
      return jsonResp({ error: "DB init failed." }, 500);
    }

    const { pathname } = new URL(request.url);
    const { method } = request;

    if (pathname.endsWith("/chat") && method === "POST")
      return this.handleChat(request);
    if (pathname.endsWith("/messages") && method === "GET")
      return this.handleGetMessages();
    if (pathname.endsWith("/profile") && method === "PATCH")
      return this.handleUpdateProfile(request);
    if (pathname.endsWith("/clear") && method === "POST")
      return this.handleClear();

    return jsonResp({ error: "Not found." }, 404);
  }

  // ── POST /chat ──────────────────────────────────────────────────────────────
  private async handleChat(request: Request): Promise<Response> {
    let body: ChatRequest;
    try {
      body = (await request.json()) as ChatRequest;
    } catch {
      return jsonResp({ error: "Invalid JSON body." }, 400);
    }

    const userText = body.message?.trim();
    if (!userText) return jsonResp({ error: "'message' is required." }, 400);

    if (body.attachment) {
      console.log("[Agent] attachment received", {
        name: body.attachment.name,
        mimeType: body.attachment.mimeType,
        base64Length: body.attachment.base64?.length ?? 0,
      });
    } else {
      console.log("[Agent] no attachment in request body");
    }

    const attachmentContext = await this.buildAttachmentContext(
      body.attachment,
      userText,
    );
    const persistedText = attachmentContext?.persistedText ?? userText;

    // ── Safety pre-check ──────────────────────────────────────────────────────
    const safety = checkSafety(persistedText);
    if (!safety.safe && safety.level === "block") {
      return sseText(safety.response);
    }

    // ── Persist user message ──────────────────────────────────────────────────
    try {
      this.sql`
        INSERT INTO messages (id, role, content, timestamp)
        VALUES (${newId()}, ${"user"}, ${persistedText}, ${new Date().toISOString()})
      `;
    } catch (e) {
      console.error("[Agent] INSERT user msg failed:", e);
    }

    // ── Build LLM context ─────────────────────────────────────────────────────
    const history = this.getRecentMessages();
    const profile = this.getProfile();
    const systemPrompt =
      (!safety.safe && safety.level === "warn"
        ? `[SAFETY (${safety.reason}): ${safety.response}]\n\n`
        : "") + buildSystemPrompt(profile);

    const messages = history.map((m) => ({ role: m.role, content: m.content }));
    if (attachmentContext) {
      const lastIndex = findLastUserMessageIndex(messages);
      const attachmentMessage = {
        role: "user" as const,
        content: attachmentContext.anthropicContent,
      };
      if (lastIndex >= 0) {
        messages[lastIndex] = attachmentMessage;
      } else {
        messages.push(attachmentMessage);
      }
    }

    // ── Verify API key ────────────────────────────────────────────────────────
    const apiKey = this.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[Agent] ANTHROPIC_API_KEY is not set!");
      return jsonResp({ error: "Server misconfiguration." }, 500);
    }

    // ── Build SSE stream using raw fetch → Anthropic ──────────────────────────
    // We bypass @ai-sdk/anthropic here because wrangler --local (miniflare)
    // does not forward outgoing fetch calls from inside ReadableStream.start.
    // Using raw fetch gives us full visibility into API errors.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const agent = this;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        const push = (chunk: StreamChunk) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );

        try {
          // ── Call Anthropic REST API directly ────────────────────────────────
          const apiResp = await fetch(ANTHROPIC_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: ANTHROPIC_MODEL,
              max_tokens: 1024,
              system: systemPrompt,
              messages,
              stream: true,
            }),
          });

          if (!apiResp.ok) {
            const errBody = await apiResp.text();
            console.error(`[Agent] Anthropic ${apiResp.status}:`, errBody);
            push({
              type: "error",
              error: `Anthropic API error ${apiResp.status}. Check your API key.`,
            });
            controller.close();
            return;
          }

          // ── Parse SSE from Anthropic ─────────────────────────────────────────
          const reader = apiResp.body?.getReader();
          if (!reader) {
            push({ type: "error", error: "No response body from Anthropic." });
            controller.close();
            return;
          }

          const dec = new TextDecoder();
          let buf = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") break;

              try {
                const evt = JSON.parse(raw) as Record<string, unknown>;

                // text delta from streaming message
                if (
                  evt.type === "content_block_delta" &&
                  (evt.delta as Record<string, unknown>)?.type === "text_delta"
                ) {
                  const text = (evt.delta as Record<string, unknown>)
                    .text as string;
                  if (text) {
                    fullText += text;
                    push({ type: "text_delta", content: text });
                  }
                }

                // Anthropic error event in the stream
                if (evt.type === "error") {
                  const errMsg =
                    ((evt.error as Record<string, unknown>)
                      ?.message as string) ?? "Stream error";
                  console.error(
                    "[Agent] Anthropic stream error event:",
                    errMsg,
                  );
                  push({ type: "error", error: errMsg });
                  controller.close();
                  return;
                }
              } catch {
                /* skip malformed SSE line */
              }
            }
          }

          // ── Output safety ────────────────────────────────────────────────────
          const outputIssue = checkOutputSafety(fullText);
          if (outputIssue) {
            const note = `\n\n⚠️ ${outputIssue}`;
            push({ type: "text_delta", content: note });
            fullText += note;
          }

          // ── Persist assistant reply ──────────────────────────────────────────
          if (fullText) {
            try {
              agent.sql`
                INSERT INTO messages (id, role, content, timestamp)
                VALUES (${newId()}, ${"assistant"}, ${fullText}, ${new Date().toISOString()})
              `;
            } catch (e) {
              console.error("[Agent] save assistant msg failed:", e);
            }
          }

          push({ type: "done" });
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[Agent] stream error:", msg);
          push({
            type: "error",
            error: "Something went wrong. Please try again.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // ── GET /messages ───────────────────────────────────────────────────────────
  private handleGetMessages(): Response {
    try {
      return jsonResp({ messages: this.getAllMessages() });
    } catch (e) {
      console.error("[Agent] getAllMessages:", e);
      return jsonResp({ messages: [] });
    }
  }

  // ── PATCH /profile ──────────────────────────────────────────────────────────
  private async handleUpdateProfile(request: Request): Promise<Response> {
    let body: ProfileUpdateRequest;
    try {
      body = (await request.json()) as ProfileUpdateRequest;
    } catch {
      return jsonResp({ error: "Invalid JSON body." }, 400);
    }
    try {
      const current = this.getProfile();
      const updated: UserProfile = { ...current, ...body.profile };
      this.saveProfile(updated);
      this.setState({ ...this.state, profile: updated });
    } catch (e) {
      console.error("[Agent] updateProfile:", e);
    }
    return jsonResp({ ok: true });
  }

  // ── POST /clear ─────────────────────────────────────────────────────────────
  private handleClear(): Response {
    try {
      this.sql`DELETE FROM messages`;
    } catch (e) {
      console.error("[Agent] clear:", e);
    }
    return jsonResp({ ok: true });
  }

  // ── SQL helpers ───────────────────────────────────────────────────────────────
  private getRecentMessages(): StoredMessage[] {
    try {
      const rows = this.sql`
        SELECT id, role, content, timestamp
        FROM messages ORDER BY timestamp DESC LIMIT ${MAX_CONTEXT}
      `;
      const out: StoredMessage[] = [];
      for (const r of rows) {
        out.push({
          id: r["id"] as string,
          role: r["role"] as "user" | "assistant",
          content: r["content"] as string,
          timestamp: r["timestamp"] as string,
        });
      }
      return out.reverse();
    } catch {
      return [];
    }
  }

  private getAllMessages(): StoredMessage[] {
    try {
      const rows = this.sql`
        SELECT id, role, content, timestamp FROM messages ORDER BY timestamp ASC
      `;
      const out: StoredMessage[] = [];
      for (const r of rows) {
        out.push({
          id: r["id"] as string,
          role: r["role"] as "user" | "assistant",
          content: r["content"] as string,
          timestamp: r["timestamp"] as string,
        });
      }
      return out;
    } catch {
      return [];
    }
  }

  private getProfile(): UserProfile {
    try {
      const rows = this.sql`SELECT value FROM kv WHERE key = 'profile'`;
      for (const r of rows) {
        return JSON.parse(r["value"] as string) as UserProfile;
      }
    } catch {
      /* fall through */
    }
    try {
      return this.state.profile;
    } catch {
      /* fall through */
    }
    return DEFAULT_AGENT_STATE.profile;
  }

  private saveProfile(profile: UserProfile): void {
    this.sql`
      INSERT INTO kv (key, value) VALUES ('profile', ${JSON.stringify(profile)})
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;
  }

  private async buildAttachmentContext(
    attachment: AttachmentPayload | null | undefined,
    userText: string,
  ): Promise<{
    persistedText: string;
    anthropicContent: string | Record<string, unknown>[];
  } | null> {
    if (!attachment) return null;

    const mimeType = normalizeMimeType(attachment.mimeType, attachment.name);
    const question = userText.trim() || "Please analyze the attached file.";

    if (mimeType === "application/pdf") {
      const persistedText = `User question: ${question}\n\nAttached PDF: ${attachment.name}`;

      return {
        persistedText,
        anthropicContent: [
          {
            type: "text",
            text: `User question: ${question}`,
          },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: attachment.base64,
            },
            title: attachment.name,
          },
          {
            type: "text",
            text: "Use the attached PDF content directly when answering.",
          },
        ],
      };
    }

    if (mimeType.startsWith("image/")) {
      const label = `Attached image: ${attachment.name}`;
      return {
        persistedText: `User question: ${question}\n\n${label}`,
        anthropicContent: [
          {
            type: "text",
            text: `User question: ${question}`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: attachment.base64,
            },
          },
          {
            type: "text",
            text: "Inspect the attached image and answer based on what you can see.",
          },
        ],
      };
    }

    return {
      persistedText: `User question: ${question}\n\nAttached file: ${attachment.name}`,
      anthropicContent: [
        {
          type: "text",
          text: `User question: ${question}\n\nAttached file: ${attachment.name}. The file type ${mimeType} is not directly supported, so respond based on the user's text only.`,
        },
      ],
    };
  }
}

function findLastUserMessageIndex(
  messages: Array<{
    role: "user" | "assistant";
    content: string | Record<string, unknown>[];
  }>,
): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

function normalizeMimeType(
  mimeType: string | undefined,
  filename: string,
): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;

  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function sseText(text: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      const d: StreamChunk = { type: "text_delta", content: text };
      ctrl.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));
      const done: StreamChunk = { type: "done" };
      ctrl.enqueue(enc.encode(`data: ${JSON.stringify(done)}\n\n`));
      ctrl.close();
    },
  });
  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
