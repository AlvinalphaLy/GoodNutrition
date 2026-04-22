import type { MealType } from "../types/voice";

const MEAL_KEYWORDS: Record<Exclude<MealType, null>, string[]> = {
  breakfast: ["breakfast", "morning", "brunch"],
  lunch: ["lunch", "midday", "noon"],
  dinner: ["dinner", "supper", "evening"],
  snack: ["snack", "snacks", "bite", "munchies"],
};

export function detectMeal(text: string): MealType {
  const lower = text.toLowerCase();
  for (const [meal, keywords] of Object.entries(MEAL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return meal as Exclude<MealType, null>;
    }
  }
  return null;
}
