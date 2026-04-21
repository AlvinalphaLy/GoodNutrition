import type { Env } from "../lib/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export async function handleVoiceParse(
  request: Request,
  env: Env
): Promise<Response> {
  let text: string;

  try {
    const body = (await request.json()) as { text?: string };
    text = (body.text ?? "").trim();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!text) return json({ error: "text is required" }, 400);

  const prompt = `You are a nutrition parsing assistant.

Extract structured meal data from this sentence:

"${text}"

Return ONLY valid JSON in this format:

{
  "meal": "breakfast | lunch | dinner | snack | null",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string | null"
    }
  ]
}

Rules:
- Do NOT return explanation
- Do NOT include extra text
- Only JSON
- If unknown, use null or reasonable defaults`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return json({ error: `Anthropic error: ${res.status}` }, 502);
    }

    const data = (await res.json()) as {
      content: { type: string; text: string }[];
    };

    const raw = data.content?.[0]?.text ?? "";
    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return json(parsed);
  } catch (err) {
    return json({ error: "Parsing failed" }, 500);
  }
}
