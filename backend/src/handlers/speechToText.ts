import type { Env } from "../lib/types";

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

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) as number;
  }
  return bytes;
}

export async function handleSpeechToText(
  request: Request,
  env: Env
): Promise<Response> {
  let audio: string;
  let format: string;

  try {
    const body = (await request.json()) as { audio?: string; format?: string };
    audio = (body.audio ?? "").trim();
    format = body.format ?? "webm";
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!audio) return json({ error: "audio (base64) is required" }, 400);

  try {
    const bytes = base64ToUint8Array(audio);
    const mimeType = format === "m4a" ? "audio/m4a" : "audio/webm";
    const filename = `recording.${format}`;

    const blob = new Blob([bytes], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "en");
    formData.append(
      "prompt",
      "Food logging app. The user is describing meals and food items with quantities. Examples: eggs, toast, chicken, rice, pizza, salad, coffee, sandwich, breakfast, lunch, dinner, snack."
    );

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[STT] OpenAI error:", err);
      return json({ error: `OpenAI STT failed: ${res.status}` }, 502);
    }

    const data = (await res.json()) as { text: string };
    console.log("[STT] transcript:", data.text);
    return json({ text: data.text ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STT failed";
    console.error("[STT] error:", message);
    return json({ error: message }, 500);
  }
}
