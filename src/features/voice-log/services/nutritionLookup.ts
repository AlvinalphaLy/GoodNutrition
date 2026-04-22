import { searchFoodByName } from "../../../../app/api/openFoodFacts";
import type { NutritionInfo } from "../types/voice";

const cache = new Map<string, NutritionInfo | null>();

const WEIGHT_UNITS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.6, lbs: 453.6,
  kg: 1000,
  ml: 1, l: 1000,
};

function scaleMacro(value: number | null | undefined, f: number): number | null {
  return value != null ? Math.round(value * f * 10) / 10 : null;
}

function scaleNutrition(per100g: NutritionInfo, grams: number): NutritionInfo {
  const f = grams / 100;
  return {
    ...per100g,
    calories:      Math.round(per100g.calories * f),
    protein:       scaleMacro(per100g.protein,       f) ?? 0,
    carbs:         scaleMacro(per100g.carbs,         f) ?? 0,
    fat:           scaleMacro(per100g.fat,           f) ?? 0,
    saturated_fat: scaleMacro(per100g.saturated_fat, f),
    sugars:        scaleMacro(per100g.sugars,        f),
    fiber:         scaleMacro(per100g.fiber,         f),
    salt:          scaleMacro(per100g.salt,          f),
    sodium:        scaleMacro(per100g.sodium,        f),
  };
}

function parseServingGrams(servingSize: string | null): number | null {
  if (!servingSize) return null;
  const match = servingSize.match(/(\d+\.?\d*)\s*(g|oz|ml|kg|lb)/i);
  if (!match) return null;
  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return amount * (WEIGHT_UNITS[unit] ?? 1);
}

function estimateGrams(
  quantity: number,
  unit: string | null,
  servingSize: string | null
): number {
  const u = unit?.toLowerCase().trim() ?? "";
  if (WEIGHT_UNITS[u]) return quantity * WEIGHT_UNITS[u];
  const servingGrams = parseServingGrams(servingSize);
  if (servingGrams) return quantity * servingGrams;
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
    const grams = estimateGrams(quantity, unit, null);
    return scaleNutrition(cached, grams);
  }

  const product = await searchFoodByName(name);
  if (!product) {
    cache.set(cacheKey, null);
    return null;
  }

  const n = product.nutriments;
  const per100g: NutritionInfo = {
    calories:                n["energy-kcal_100g"]      ?? 0,
    protein:                 n.proteins_100g            ?? 0,
    carbs:                   n.carbohydrates_100g       ?? 0,
    fat:                     n.fat_100g                 ?? 0,
    saturated_fat:           n["saturated-fat_100g"],
    sugars:                  n.sugars_100g,
    fiber:                   n.fiber_100g,
    salt:                    n.salt_100g,
    sodium:                  n.sodium_100g,
    serving_size:            product.serving_size,
    brand:                   product.brands,
    nova_group:              product.nova_group,
    nutriscore_grade:        product.nutriscore_grade,
    additives_tags:          product.additives_tags,
    allergens_tags:          product.allergens_tags,
    ingredients_analysis_tags: product.ingredients_analysis_tags,
    nutrient_levels:         product.nutrient_levels,
    ingredients_text:        product.ingredients_text,
  };

  if (per100g.calories === 0 && per100g.protein === 0) {
    console.warn(`[nutrition] empty nutrients for "${name}"`);
    cache.set(cacheKey, null);
    return null;
  }

  cache.set(cacheKey, per100g);
  const grams = estimateGrams(quantity, unit, product.serving_size);
  console.log(
    `[nutrition] "${name}" → ${grams}g → ${per100g.calories} kcal/100g` +
    ` (nutriscore: ${per100g.nutriscore_grade ?? "?"}, nova: ${per100g.nova_group ?? "?"})`
  );
  return scaleNutrition(per100g, grams);
}
