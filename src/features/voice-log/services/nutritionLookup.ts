import type { NutritionInfo } from "../types/voice";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY ?? "DEMO_KEY";

const cache = new Map<string, NutritionInfo | null>();

type USDANutrient = { nutrientId: number; value: number };
type USDAFoodPortion = {
  amount: number;
  gramWeight: number;
  measureUnit: { name: string };
};
type USDAFood = {
  foodNutrients: USDANutrient[];
  foodPortions?: USDAFoodPortion[];
};

const WEIGHT_UNITS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.6, lbs: 453.6,
  kg: 1000,
  ml: 1, l: 1000,
};

function getNutrientValue(nutrients: USDANutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

function scaleNutrition(per100g: NutritionInfo, grams: number): NutritionInfo {
  const f = grams / 100;
  return {
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
  };
}

function estimateGrams(
  quantity: number,
  unit: string | null,
  portions: USDAFoodPortion[]
): number {
  const u = unit?.toLowerCase().trim() ?? "";

  if (WEIGHT_UNITS[u]) return quantity * WEIGHT_UNITS[u];

  if (portions.length > 0) {
    const match = portions.find((p) => {
      const pName = p.measureUnit.name.toLowerCase();
      return u && (pName.includes(u) || u.includes(pName.split(" ")[0]));
    });
    const portion = match ?? portions[0];
    return quantity * (portion.gramWeight / portion.amount);
  }

  // Fallback: treat quantity as servings of 100g each
  return quantity * 100;
}

export async function lookupNutrition(
  name: string,
  quantity: number,
  unit: string | null
): Promise<NutritionInfo | null> {
  const cacheKey = `${name.toLowerCase()}|${unit ?? ""}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (!cached) return null;
    const grams = estimateGrams(quantity, unit, []);
    return scaleNutrition(cached, grams);
  }

  try {
    const url =
      `${USDA_SEARCH}?query=${encodeURIComponent(name)}` +
      `&api_key=${API_KEY}&pageSize=5`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[nutrition] USDA ${res.status} for "${name}"`);
      return null;
    }

    const data = (await res.json()) as { foods?: USDAFood[] };
    const food = data.foods?.[0];
    if (!food) {
      console.warn(`[nutrition] no results for "${name}"`);
      return null;
    }

    const per100g: NutritionInfo = {
      calories: getNutrientValue(food.foodNutrients, 1008),
      protein:  getNutrientValue(food.foodNutrients, 1003),
      carbs:    getNutrientValue(food.foodNutrients, 1005),
      fat:      getNutrientValue(food.foodNutrients, 1004),
    };

    if (per100g.calories === 0 && per100g.protein === 0) {
      console.warn(`[nutrition] empty nutrients for "${name}"`);
      cache.set(cacheKey, null);
      return null;
    }

    cache.set(cacheKey, per100g);
    const grams = estimateGrams(quantity, unit, food.foodPortions ?? []);
    console.log(`[nutrition] "${name}" → ${grams}g → ${per100g.calories} kcal/100g`);
    return scaleNutrition(per100g, grams);
  } catch (err) {
    console.warn(`[nutrition] fetch error for "${name}":`, err);
    return null;
  }
}
