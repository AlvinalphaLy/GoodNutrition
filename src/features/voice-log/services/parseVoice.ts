import { confidenceScore } from "../utils/confidenceScore";
import { detectMeal } from "../utils/detectMeal";
import { extractQuantity } from "../utils/extractQuantity";
import { isStopWord, normalizeFoodName } from "../utils/normalizeFood";
import type { MealType, ParsedVoiceResult, VoiceItem } from "../types/voice";

const CONFIDENCE_THRESHOLD = 0.5;

const UNITS = new Set([
  "cup", "cups", "tbsp", "tsp", "oz", "ounce", "ounces",
  "gram", "grams", "g", "kg", "lb", "lbs", "ml", "l",
  "slice", "slices", "piece", "pieces", "serving", "servings",
  "bowl", "bowls", "plate", "plates", "scoop", "scoops",
]);

const NOISE_WORDS = new Set([
  "had", "ate", "have", "eat", "eaten", "was", "were", "am", "is",
  "for", "with", "and", "the", "of", "some", "just", "also",
  "i", "my", "me", "today", "yesterday",
]);

// ── Rule-based parser ─────────────────────────────────────────────────────────

function parseRuleBased(text: string): Omit<ParsedVoiceResult, "confidence"> {
  const meal = detectMeal(text);
  const tokens = text
    .toLowerCase()
    .replace(/[,\.!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const items: VoiceItem[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (NOISE_WORDS.has(token) || isStopWord(token)) {
      i++;
      continue;
    }

    const qty = extractQuantity(token);

    if (qty !== null) {
      let unit: string | null = null;
      let nameStart = i + 1;

      if (i + 1 < tokens.length && UNITS.has(tokens[i + 1])) {
        unit = tokens[i + 1];
        nameStart = i + 2;
      }

      // Collect food name tokens until the next quantity or noise word
      const nameParts: string[] = [];
      let j = nameStart;
      while (j < tokens.length) {
        const t = tokens[j];
        if (NOISE_WORDS.has(t) || extractQuantity(t) !== null) break;
        if (!isStopWord(t)) nameParts.push(t);
        j++;
      }

      if (nameParts.length > 0) {
        items.push({
          name: normalizeFoodName(nameParts.join(" ")),
          quantity: qty,
          unit,
        });
        i = j;
        continue;
      }
    }

    i++;
  }

  return { meal, items, rawText: text };
}

// ── AI fallback ───────────────────────────────────────────────────────────────

const AI_PARSE_URL = (
  process.env.EXPO_PUBLIC_AI_BACKEND_URL ?? "http://localhost:8787"
).replace(/\/$/, "");

type AIParseResult = { meal: MealType; items: VoiceItem[] };

async function parseWithAI(text: string): Promise<AIParseResult | null> {
  try {
    const res = await fetch(`${AI_PARSE_URL}/api/voice-parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { meal?: unknown; items?: unknown[] };

    if (!Array.isArray(data.items)) return null;

    const items: VoiceItem[] = data.items
      .filter((item): item is Record<string, unknown> => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).name === "string" &&
          typeof (item as Record<string, unknown>).quantity === "number"
        );
      })
      .map((item) => ({
        name: normalizeFoodName(item.name as string),
        quantity: item.quantity as number,
        unit: typeof item.unit === "string" ? item.unit : null,
      }));

    const mealValues = ["breakfast", "lunch", "dinner", "snack"] as const;
    const meal =
      mealValues.find((m) => m === data.meal) ?? null;

    return { meal, items };
  } catch {
    return null;
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function parseVoiceText(text: string): Promise<ParsedVoiceResult> {
  const ruleBased = parseRuleBased(text);
  const confidence = confidenceScore(ruleBased);

  console.log("[parse] text:", text);
  console.log("[parse] rule-based items:", JSON.stringify(ruleBased.items), "confidence:", confidence);

  if (confidence >= CONFIDENCE_THRESHOLD) {
    return { ...ruleBased, confidence };
  }

  const aiResult = await parseWithAI(text);
  console.log("[parse] AI result:", JSON.stringify(aiResult));

  if (aiResult) {
    const aiConfidence = confidenceScore(aiResult);
    return { ...aiResult, rawText: text, confidence: aiConfidence };
  }

  // Return rule-based result even with low confidence rather than losing data
  return { ...ruleBased, confidence };
}
