# GoodNutrition AI Backend

Cloudflare Workers + Agents backend for the GoodNutrition AI chat feature.

## Architecture

```
Expo app  ──POST /api/sessions/{id}/chat──►  Worker (index.ts)
                                                │
                                         routes to Agent
                                                │
                                    NutritionChatAgent (DO)
                                    ┌───────────────────────┐
                                    │ state: AgentState      │
                                    │ sql: SQLite (messages, │
                                    │       profile kv)      │
                                    │                        │
                                    │ onRequest()            │
                                    │  ├─ safety check       │
                                    │  ├─ load history       │
                                    │  ├─ build prompt       │
                                    │  ├─ streamText (Claude)│
                                    │  └─ SSE response       │
                                    └───────────────────────┘
```

**One Durable Object instance per session.** Session ID is generated client-side as `{userId}-{timestamp}`.

## Quick start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Set your Anthropic API key
```bash
# For local dev
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .dev.vars

# For production
wrangler secret put ANTHROPIC_API_KEY
```

### 3. Run locally
```bash
npm run dev
# Worker listens at http://localhost:8787
```

### 4. Update the Expo app
In your Expo project root, create or update `.env`:
```
EXPO_PUBLIC_AI_BACKEND_URL=http://localhost:8787
```

### 5. Deploy to Cloudflare
```bash
npm run deploy
```
Then update `EXPO_PUBLIC_AI_BACKEND_URL` in your Expo project to the deployed URL.

---

## API reference

### POST `/api/sessions/:sessionId/chat`
Send a message and receive a streaming SSE response.

**Request body:**
```json
{ "message": "What should I eat for lunch?" }
```

**Response:** `text/event-stream`
```
data: {"type":"text_delta","content":"For lunch, "}
data: {"type":"text_delta","content":"try a grilled chicken salad…"}
data: {"type":"done"}
```

### PATCH `/api/sessions/:sessionId/profile`
Update the user profile used for personalising responses.

**Request body:**
```json
{
  "profile": {
    "name": "Alex",
    "goals": ["fat_loss"],
    "allergies": ["peanuts"],
    "cookingSkill": "intermediate",
    "budgetLevel": "medium"
  }
}
```

### GET `/api/sessions/:sessionId/messages`
Retrieve message history for a session. Returns `[]` for new sessions.

### POST `/api/sessions/:sessionId/clear`
Delete all messages in a session (keeps the profile).

### GET `/health`
Returns `{"ok":true}`. Useful for uptime checks.

---

## Storage decisions

| Data | Where | Why |
|------|-------|-----|
| Message history | SQLite (DO) | Persists across hibernation; queryable |
| User profile | SQLite (DO) kv table | Persists; merged with in-memory state |
| Session metadata (count, flags) | Agent state (`this.state`) | Fast in-memory access during a session |
| API keys | Wrangler secrets | Never in code or git |

**Context window management:** Only the last 40 messages are sent to Claude. Full history remains in SQLite for the `/messages` endpoint.

---

## Safety guardrails

Implemented in `src/lib/safety.ts`:

| Trigger | Level | Action |
|---------|-------|--------|
| Medical emergency keywords | block | Return pre-written emergency response; skip LLM |
| Eating disorder signals | warn | Prepend support note to LLM prompt |
| Prescription/medication requests | warn | Prepend scope limitation note |
| Dangerously low calorie output | output-block | Replace AI response with safe message |
| Absolute cure claims in output | output-block | Replace with caveated message |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key (set via `wrangler secret put`) |
| `ENVIRONMENT` | No | `development` or `production` |

---

## Tests

```bash
npm test
```

Tests cover safety filters, prompt building, and output sanitisation.
Integration tests against a live Worker require a Cloudflare account and are not included.

---

## Scaling and cost

- **Durable Objects** are billed per request and storage. At chat-scale, costs are minimal.
- **Claude claude-3-5-haiku-20241022** is the default model — fast and affordable (~$0.0008/1K input tokens).
- To upgrade quality, swap `claude-3-5-haiku-20241022` for `claude-3-5-sonnet-20241022` in `NutritionChatAgent.ts`.
- Add a `maxRequests` rate limiter per session if you need abuse protection.

---

## Known limitations

- No authentication — sessionId is the only access control. Add JWT verification in `index.ts` before deploying publicly.
- No DO eviction — Durable Objects persist until manually deleted. Add a scheduled Worker for TTL cleanup.
- Tools use stub data — replace `nutritionTools` execute functions with real USDA/Edamam API calls for accurate macros.
- No multi-turn tool results streamed to the UI — tool outputs are included in the context but not surfaced separately to the frontend.
