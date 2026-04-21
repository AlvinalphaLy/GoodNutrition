import type { MealType, VoiceItem } from "../types/voice";

type PartialResult = {
  meal: MealType;
  items: VoiceItem[];
};

export function confidenceScore(result: PartialResult): number {
  let score = 0;

  if (result.meal !== null) score += 0.4;
  if (result.items.length > 0) score += 0.4;
  if (result.items.length > 0 && result.items.every((item) => item.quantity > 0)) score += 0.1;
  if (result.items.length >= 2) score += 0.1;

  return Math.min(score, 1);
}
