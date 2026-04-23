import harmfulIngredients from "../../../src/lib/harmfulIngredients";

export type NutritionReference = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionInfo = NutritionReference & {
  harmfulIngredientMatches: string[];
  ingredientsText: string | null;
  saturated_fat?: number | null;
  sugars?: number | null;
  fiber?: number | null;
  salt?: number | null;
  sodium?: number | null;
  serving_size?: string | null;
  brand?: string | null;
  nova_group?: number | null;
  nutriscore_grade?: string | null;
  additives_tags?: string[] | null;
  allergens_tags?: string[] | null;
  ingredients_analysis_tags?: string[] | null;
  nutrient_levels?: {
    fat: "low" | "moderate" | "high" | null;
    "saturated-fat": "low" | "moderate" | "high" | null;
    sugars: "low" | "moderate" | "high" | null;
    salt: "low" | "moderate" | "high" | null;
  } | null;
};

type NutritionLike = {
  nutrition?: NutritionInfo | null;
  nestedItems?: Array<{ nutrition?: NutritionInfo | null }> | null;
};

export type ScoreSummary = {
  score: number;
  rating: number;
  notes: string[];
};

export type ImportedNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat?: number | null;
  sugars?: number | null;
  fiber?: number | null;
  salt?: number | null;
  sodium?: number | null;
  serving_size?: string | null;
  brand?: string | null;
  nova_group?: number | null;
  nutriscore_grade?: string | null;
  additives_tags?: string[] | null;
  allergens_tags?: string[] | null;
  ingredients_analysis_tags?: string[] | null;
  nutrient_levels?: {
    fat: "low" | "moderate" | "high" | null;
    "saturated-fat": "low" | "moderate" | "high" | null;
    sugars: "low" | "moderate" | "high" | null;
    salt: "low" | "moderate" | "high" | null;
  } | null;
  ingredients_text?: string | null;
};

const roundToOne = (value: number) => Math.round(value * 10) / 10;

export const emptyNutrition = (): NutritionInfo => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  harmfulIngredientMatches: [],
  ingredientsText: null,
});

export const cloneNutrition = (nutrition?: NutritionInfo | null): NutritionInfo | null => {
  if (!nutrition) return null;

  return {
    ...nutrition,
    harmfulIngredientMatches: [...nutrition.harmfulIngredientMatches],
    additives_tags: nutrition.additives_tags ? [...nutrition.additives_tags] : nutrition.additives_tags ?? null,
    allergens_tags: nutrition.allergens_tags ? [...nutrition.allergens_tags] : nutrition.allergens_tags ?? null,
    ingredients_analysis_tags: nutrition.ingredients_analysis_tags ? [...nutrition.ingredients_analysis_tags] : nutrition.ingredients_analysis_tags ?? null,
    nutrient_levels: nutrition.nutrient_levels ? { ...nutrition.nutrient_levels } : nutrition.nutrient_levels ?? null,
  };
};

export type OpenFoodFactsNutritionSource = {
  ingredients_text?: string | null;
  brands?: string | null;
  nova_group?: number | null;
  nutriscore_grade?: string | null;
  additives_tags?: string[] | null;
  allergens_tags?: string[] | null;
  ingredients_analysis_tags?: string[] | null;
  nutrient_levels?: {
    fat: "low" | "moderate" | "high" | null;
    "saturated-fat": "low" | "moderate" | "high" | null;
    sugars: "low" | "moderate" | "high" | null;
    salt: "low" | "moderate" | "high" | null;
  } | null;
  serving_size?: string | null;
  nutriments: {
    "energy-kcal_100g": number | null;
    proteins_100g: number | null;
    carbohydrates_100g: number | null;
    fat_100g: number | null;
    "saturated-fat_100g"?: number | null;
    sugars_100g?: number | null;
    fiber_100g?: number | null;
    salt_100g?: number | null;
    sodium_100g?: number | null;
    "energy-kcal_serving": number | null;
    proteins_serving: number | null;
    carbohydrates_serving: number | null;
    fat_serving: number | null;
    sugars_serving?: number | null;
    fiber_serving?: number | null;
    salt_serving?: number | null;
    sodium_serving?: number | null;
  };
};

export const parseAmount = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const mixedFractionMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFractionMatch) {
    const whole = Number(mixedFractionMatch[1]);
    const numerator = Number(mixedFractionMatch[2]);
    const denominator = Number(mixedFractionMatch[3]);
    if (denominator !== 0) {
      return whole + numerator / denominator;
    }
  }

  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const detectHarmfulIngredients = (ingredientsText: string | null | undefined): string[] => {
  if (!ingredientsText) return [];

  const haystack = ingredientsText.toLowerCase();
  return [...new Set(harmfulIngredients.filter((ingredient) => haystack.includes(ingredient.toLowerCase())))];
};

export const adaptImportedNutrition = (
  nutrition?: ImportedNutrition | null
): NutritionInfo | null => {
  if (!nutrition) return null;

  const ingredientsText = nutrition.ingredients_text ?? null;
  return {
    calories: nutrition.calories ?? 0,
    protein: nutrition.protein ?? 0,
    carbs: nutrition.carbs ?? 0,
    fat: nutrition.fat ?? 0,
    harmfulIngredientMatches: detectHarmfulIngredients(ingredientsText),
    ingredientsText,
    saturated_fat: nutrition.saturated_fat ?? null,
    sugars: nutrition.sugars ?? null,
    fiber: nutrition.fiber ?? null,
    salt: nutrition.salt ?? null,
    sodium: nutrition.sodium ?? null,
    serving_size: nutrition.serving_size ?? null,
    brand: nutrition.brand ?? null,
    nova_group: nutrition.nova_group ?? null,
    nutriscore_grade: nutrition.nutriscore_grade ?? null,
    additives_tags: nutrition.additives_tags ?? null,
    allergens_tags: nutrition.allergens_tags ?? null,
    ingredients_analysis_tags: nutrition.ingredients_analysis_tags ?? null,
    nutrient_levels: nutrition.nutrient_levels ?? null,
  };
};

export const getOpenFoodFactsDefaultUnit = (source: OpenFoodFactsNutritionSource) => {
  const servingData = [
    source.nutriments["energy-kcal_serving"],
    source.nutriments.proteins_serving,
    source.nutriments.carbohydrates_serving,
    source.nutriments.fat_serving,
  ];

  return servingData.some((value) => value != null) ? "serving" : "g";
};

export const buildOpenFoodFactsNutrition = (
  source: OpenFoodFactsNutritionSource,
  amount: string,
  unit: string
): NutritionInfo | null => {
  const numericAmount = parseAmount(amount);
  if (numericAmount <= 0) return null;

  const normalizedUnit = unit.trim().toLowerCase();
  const useGramMode = normalizedUnit === "g";
  const hasServingData = [
    source.nutriments["energy-kcal_serving"],
    source.nutriments.proteins_serving,
    source.nutriments.carbohydrates_serving,
    source.nutriments.fat_serving,
  ].some((value) => value != null);

  if (!useGramMode && !hasServingData) {
    return null;
  }

  const factor = useGramMode ? numericAmount / 100 : numericAmount;
  const caloriesBase = useGramMode ? source.nutriments["energy-kcal_100g"] : source.nutriments["energy-kcal_serving"];
  const proteinBase = useGramMode ? source.nutriments.proteins_100g : source.nutriments.proteins_serving;
  const carbBase = useGramMode ? source.nutriments.carbohydrates_100g : source.nutriments.carbohydrates_serving;
  const fatBase = useGramMode ? source.nutriments.fat_100g : source.nutriments.fat_serving;
  const saturatedBase = useGramMode ? source.nutriments["saturated-fat_100g"] : null;
  const sugarsBase = useGramMode ? source.nutriments.sugars_100g : source.nutriments.sugars_serving;
  const fiberBase = useGramMode ? source.nutriments.fiber_100g : source.nutriments.fiber_serving;
  const saltBase = useGramMode ? source.nutriments.salt_100g : source.nutriments.salt_serving;
  const sodiumBase = useGramMode ? source.nutriments.sodium_100g : source.nutriments.sodium_serving;

  if ([caloriesBase, proteinBase, carbBase, fatBase].every((value) => value == null)) {
    return null;
  }

  const ingredientsText = source.ingredients_text ?? null;
  return {
    calories: roundToOne((caloriesBase ?? 0) * factor),
    protein: roundToOne((proteinBase ?? 0) * factor),
    carbs: roundToOne((carbBase ?? 0) * factor),
    fat: roundToOne((fatBase ?? 0) * factor),
    harmfulIngredientMatches: detectHarmfulIngredients(ingredientsText),
    ingredientsText,
    saturated_fat: saturatedBase != null ? roundToOne(saturatedBase * factor) : null,
    sugars: sugarsBase != null ? roundToOne(sugarsBase * factor) : null,
    fiber: fiberBase != null ? roundToOne(fiberBase * factor) : null,
    salt: saltBase != null ? roundToOne(saltBase * factor) : null,
    sodium: sodiumBase != null ? roundToOne(sodiumBase * factor) : null,
    serving_size: source.serving_size ?? null,
    brand: source.brands ?? null,
    nova_group: source.nova_group ?? null,
    nutriscore_grade: source.nutriscore_grade ?? null,
    additives_tags: source.additives_tags ?? null,
    allergens_tags: source.allergens_tags ?? null,
    ingredients_analysis_tags: source.ingredients_analysis_tags ?? null,
    nutrient_levels: source.nutrient_levels ?? null,
  };
};

export const rescaleNutrition = (
  nutrition: NutritionInfo | null | undefined,
  previousQuantity: string,
  nextQuantity: string
): NutritionInfo | null => {
  if (!nutrition) return null;

  const previousAmount = parseAmount(previousQuantity);
  const nextAmount = parseAmount(nextQuantity);

  if (previousAmount <= 0 || nextAmount <= 0) {
    return cloneNutrition(nutrition);
  }

  const factor = nextAmount / previousAmount;
  return {
    calories: roundToOne(nutrition.calories * factor),
    protein: roundToOne(nutrition.protein * factor),
    carbs: roundToOne(nutrition.carbs * factor),
    fat: roundToOne(nutrition.fat * factor),
    harmfulIngredientMatches: [...nutrition.harmfulIngredientMatches],
    ingredientsText: nutrition.ingredientsText,
    saturated_fat: nutrition.saturated_fat != null ? roundToOne(nutrition.saturated_fat * factor) : null,
    sugars: nutrition.sugars != null ? roundToOne(nutrition.sugars * factor) : null,
    fiber: nutrition.fiber != null ? roundToOne(nutrition.fiber * factor) : null,
    salt: nutrition.salt != null ? roundToOne(nutrition.salt * factor) : null,
    sodium: nutrition.sodium != null ? roundToOne(nutrition.sodium * factor) : null,
    serving_size: nutrition.serving_size ?? null,
    brand: nutrition.brand ?? null,
    nova_group: nutrition.nova_group ?? null,
    nutriscore_grade: nutrition.nutriscore_grade ?? null,
    additives_tags: nutrition.additives_tags ? [...nutrition.additives_tags] : nutrition.additives_tags ?? null,
    allergens_tags: nutrition.allergens_tags ? [...nutrition.allergens_tags] : nutrition.allergens_tags ?? null,
    ingredients_analysis_tags: nutrition.ingredients_analysis_tags ? [...nutrition.ingredients_analysis_tags] : nutrition.ingredients_analysis_tags ?? null,
    nutrient_levels: nutrition.nutrient_levels ? { ...nutrition.nutrient_levels } : nutrition.nutrient_levels ?? null,
  };
};

export const scaleNutritionReference = (
  reference: NutritionReference | undefined,
  quantity: string,
  ingredientsText: string | null = null,
  harmfulMatches: string[] = []
): NutritionInfo | null => {
  if (!reference) return null;

  const amount = parseAmount(quantity);
  if (amount <= 0) return null;

  return {
    calories: roundToOne(reference.calories * amount),
    protein: roundToOne(reference.protein * amount),
    carbs: roundToOne(reference.carbs * amount),
    fat: roundToOne(reference.fat * amount),
    harmfulIngredientMatches: [...new Set(harmfulMatches)],
    ingredientsText,
  };
};

export const sumNutrition = (values: Array<NutritionInfo | null | undefined>): NutritionInfo => {
  return values.reduce<NutritionInfo>((acc, value) => {
    if (!value) return acc;

    return {
      calories: roundToOne(acc.calories + value.calories),
      protein: roundToOne(acc.protein + value.protein),
      carbs: roundToOne(acc.carbs + value.carbs),
      fat: roundToOne(acc.fat + value.fat),
      harmfulIngredientMatches: [...new Set([...acc.harmfulIngredientMatches, ...value.harmfulIngredientMatches])],
      ingredientsText: acc.ingredientsText ?? value.ingredientsText ?? null,
      saturated_fat: roundToOne((acc.saturated_fat ?? 0) + (value.saturated_fat ?? 0)),
      sugars: roundToOne((acc.sugars ?? 0) + (value.sugars ?? 0)),
      fiber: roundToOne((acc.fiber ?? 0) + (value.fiber ?? 0)),
      salt: roundToOne((acc.salt ?? 0) + (value.salt ?? 0)),
      sodium: roundToOne((acc.sodium ?? 0) + (value.sodium ?? 0)),
      serving_size: acc.serving_size ?? value.serving_size ?? null,
      brand: acc.brand ?? value.brand ?? null,
      nova_group: acc.nova_group ?? value.nova_group ?? null,
      nutriscore_grade: acc.nutriscore_grade ?? value.nutriscore_grade ?? null,
      additives_tags: [...new Set([...(acc.additives_tags ?? []), ...(value.additives_tags ?? [])])],
      allergens_tags: [...new Set([...(acc.allergens_tags ?? []), ...(value.allergens_tags ?? [])])],
      ingredients_analysis_tags: [...new Set([...(acc.ingredients_analysis_tags ?? []), ...(value.ingredients_analysis_tags ?? [])])],
      nutrient_levels: acc.nutrient_levels ?? value.nutrient_levels ?? null,
    };
  }, emptyNutrition());
};

export const summarizeNutritionEntries = (entries: NutritionLike[]): NutritionInfo => {
  return sumNutrition(
    entries.map((entry) => {
      if (entry.nutrition) {
        return entry.nutrition;
      }

      if (entry.nestedItems?.length) {
        return sumNutrition(entry.nestedItems.map((nestedItem) => nestedItem.nutrition));
      }

      return null;
    })
  );
};

export const divideNutrition = (nutrition: NutritionInfo, divisor: number): NutritionInfo => {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    return nutrition;
  }

  return {
    calories: roundToOne(nutrition.calories / divisor),
    protein: roundToOne(nutrition.protein / divisor),
    carbs: roundToOne(nutrition.carbs / divisor),
    fat: roundToOne(nutrition.fat / divisor),
    harmfulIngredientMatches: [...nutrition.harmfulIngredientMatches],
    ingredientsText: nutrition.ingredientsText,
    saturated_fat: nutrition.saturated_fat != null ? roundToOne(nutrition.saturated_fat / divisor) : null,
    sugars: nutrition.sugars != null ? roundToOne(nutrition.sugars / divisor) : null,
    fiber: nutrition.fiber != null ? roundToOne(nutrition.fiber / divisor) : null,
    salt: nutrition.salt != null ? roundToOne(nutrition.salt / divisor) : null,
    sodium: nutrition.sodium != null ? roundToOne(nutrition.sodium / divisor) : null,
    serving_size: nutrition.serving_size ?? null,
    brand: nutrition.brand ?? null,
    nova_group: nutrition.nova_group ?? null,
    nutriscore_grade: nutrition.nutriscore_grade ?? null,
    additives_tags: nutrition.additives_tags ? [...nutrition.additives_tags] : nutrition.additives_tags ?? null,
    allergens_tags: nutrition.allergens_tags ? [...nutrition.allergens_tags] : nutrition.allergens_tags ?? null,
    ingredients_analysis_tags: nutrition.ingredients_analysis_tags ? [...nutrition.ingredients_analysis_tags] : nutrition.ingredients_analysis_tags ?? null,
    nutrient_levels: nutrition.nutrient_levels ? { ...nutrition.nutrient_levels } : nutrition.nutrient_levels ?? null,
  };
};

export const formatCalories = (calories: number) => `${Math.round(calories)} kcal`;

export const formatMacrosLine = (nutrition: NutritionInfo) =>
  `${Math.round(nutrition.protein)}g protein • ${Math.round(nutrition.carbs)}g carbs • ${Math.round(nutrition.fat)}g fat`;

export const buildScoreSummary = (
  nutrition: NutritionInfo,
  targets: NutritionReference
): ScoreSummary => {
  if (nutrition.calories <= 0 && nutrition.protein <= 0 && nutrition.carbs <= 0 && nutrition.fat <= 0) {
    return {
      score: 0,
      rating: 0,
      notes: ["Log food with nutrition details to generate a score."],
    };
  }

  let penalty = 0;
  const notes: string[] = [];

  const applyTargetPenalty = (
    current: number,
    target: number,
    label: string,
    maxPenalty: number,
    multiplier: number
  ) => {
    if (!Number.isFinite(target) || target <= 0) return;

    const differenceRatio = Math.abs(current - target) / target;
    const sectionPenalty = Math.min(maxPenalty, differenceRatio * multiplier);
    penalty += sectionPenalty;

    if (differenceRatio <= 0.1) {
      notes.push(`${label} is close to your target.`);
    } else if (current < target) {
      notes.push(`${label} is below your target.`);
    } else {
      notes.push(`${label} is above your target.`);
    }
  };

  applyTargetPenalty(nutrition.calories, targets.calories, "Calories", 32, 60);
  applyTargetPenalty(nutrition.protein, targets.protein, "Protein", 14, 20);
  applyTargetPenalty(nutrition.carbs, targets.carbs, "Carbs", 14, 18);
  applyTargetPenalty(nutrition.fat, targets.fat, "Fat", 14, 18);

  const harmfulPenalty = Math.min(28, nutrition.harmfulIngredientMatches.length * 9);
  penalty += harmfulPenalty;

  if (nutrition.harmfulIngredientMatches.length > 0) {
    notes.push(
      `${nutrition.harmfulIngredientMatches.length} harmful ingredient${nutrition.harmfulIngredientMatches.length === 1 ? "" : "s"} detected.`
    );
  } else {
    notes.push("No flagged harmful ingredients detected from the foods with ingredient data.");
  }

  const score = Math.max(0, Math.round(100 - penalty));
  const rating = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;

  return {
    score,
    rating,
    notes,
  };
};

export const buildMealTags = (nutrition: NutritionInfo) => {
  const tags: Array<{ label: string; variant: "success" | "warning" | "danger" }> = [];

  if (nutrition.protein >= 20) {
    tags.push({ label: "High protein", variant: "success" });
  }

  if (nutrition.harmfulIngredientMatches.length > 0) {
    tags.push({ label: `${nutrition.harmfulIngredientMatches.length} flagged`, variant: "danger" });
  } else if (nutrition.calories >= 700) {
    tags.push({ label: "High calorie", variant: "warning" });
  } else {
    tags.push({ label: "Balanced", variant: "success" });
  }

  return tags;
};
