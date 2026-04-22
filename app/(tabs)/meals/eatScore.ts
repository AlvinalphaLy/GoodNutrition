import type { MealDraftItem } from "./meals-context";

export type ScoreGrade = "Excellent" | "Good" | "Fair" | "Poor";

export type ItemEatScore = {
  name: string;
  score: number;
  reason: string;
};

export type MealEatScore = {
  total: number;
  grade: ScoreGrade;
  color: string;
  items: ItemEatScore[];
};

// ── Keyword lists ─────────────────────────────────────────────────────────────

const HEALTHY_WORDS = [
  "apple", "banana", "orange", "mango", "grape", "berry", "berries",
  "melon", "peach", "pear", "plum", "kiwi", "fruit",
  "spinach", "kale", "broccoli", "carrot", "celery", "cucumber",
  "tomato", "lettuce", "salad", "vegetable", "veggie",
  "chicken", "turkey", "salmon", "tuna", "fish", "shrimp", "egg",
  "tofu", "lentil", "bean", "legume",
  "oatmeal", "oats", "quinoa", "brown rice",
  "yogurt", "cottage cheese",
  "grilled", "steamed", "baked", "roasted", "fresh", "raw",
  "whole grain", "whole wheat",
];

const UNHEALTHY_WORDS = [
  "cake", "candy", "chocolate", "cookie", "brownie", "donut", "doughnut",
  "ice cream", "milkshake", "whipped cream",
  "chips", "fries", "fried", "deep fried",
  "burger", "hot dog", "sausage", "bacon",
  "pizza", "nachos",
  "soda", "cola", "energy drink",
  "butter", "mayo", "mayonnaise",
  "processed", "fast food",
];

function keywordAdjustment(name: string): { delta: number; reason: string | null } {
  const lower = name.toLowerCase();

  for (const word of UNHEALTHY_WORDS) {
    if (lower.includes(word)) return { delta: -15, reason: `"${name}" is typically high in unhealthy fats or sugar` };
  }
  for (const word of HEALTHY_WORDS) {
    if (lower.includes(word)) return { delta: +10, reason: null };
  }
  return { delta: 0, reason: null };
}

// ── Per-item score ────────────────────────────────────────────────────────────

function scoreItem(item: MealDraftItem): ItemEatScore {
  const name = item.name;
  const nutrition = item.nutrition;

  if (!nutrition || nutrition.calories == null) {
    const { delta, reason } = keywordAdjustment(name);
    const score = Math.min(100, Math.max(0, 60 + delta));
    return { name, score, reason: reason ?? "No nutrition data — estimated from food type" };
  }

  const cal = nutrition.calories;
  const prot = nutrition.protein ?? 0;
  const fat = nutrition.fat ?? 0;
  const carbs = nutrition.carbs ?? 0;

  const reasons: string[] = [];
  let score = 65;

  // Protein density (g per 100 kcal)
  const proteinDensity = cal > 0 ? (prot / cal) * 100 : 0;
  if (proteinDensity >= 20) { score += 20; }
  else if (proteinDensity >= 10) { score += 10; }
  else if (proteinDensity < 5) {
    score -= 10;
    reasons.push("low protein");
  }

  // Fat % of calories
  const fatPct = cal > 0 ? (fat * 9) / cal : 0;
  if (fatPct < 0.25) { score += 10; }
  else if (fatPct > 0.50) {
    score -= 20;
    reasons.push("very high fat");
  } else if (fatPct > 0.35) {
    score -= 10;
    reasons.push("high fat");
  }

  // Likely high-sugar: high carb%, near-zero protein and fat
  const carbPct = cal > 0 ? (carbs * 4) / cal : 0;
  if (carbPct > 0.75 && proteinDensity < 5 && fatPct < 0.1) {
    score -= 10;
    reasons.push("high sugar");
  }

  // Calorie load per item
  if (cal < 100) { score += 10; }
  else if (cal > 500) {
    score -= 20;
    reasons.push("very high calories");
  } else if (cal > 300) {
    score -= 10;
    reasons.push("high calories");
  }

  // Keyword adjustment
  const { delta, reason: kwReason } = keywordAdjustment(name);
  score += delta;
  if (kwReason) reasons.push(kwReason);

  score = Math.min(100, Math.max(0, score));

  const reason =
    reasons.length > 0
      ? reasons.join(", ")
      : score >= 80
      ? "Good nutritional profile"
      : "Balanced item";

  return { name, score, reason };
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

function toGrade(score: number): ScoreGrade {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

export function gradeColor(grade: ScoreGrade): string {
  switch (grade) {
    case "Excellent": return "#16a34a";
    case "Good":      return "#65a30d";
    case "Fair":      return "#d97706";
    case "Poor":      return "#dc2626";
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export function scoreMeal(items: MealDraftItem[]): MealEatScore | null {
  if (items.length === 0) return null;

  const scored = items.map(scoreItem);
  const avg = Math.round(scored.reduce((s, i) => s + i.score, 0) / scored.length);
  const grade = toGrade(avg);

  return { total: avg, grade, color: gradeColor(grade), items: scored };
}
