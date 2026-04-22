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
  };
};

export type OpenFoodFactsNutritionSource = {
  ingredients_text?: string | null;
  nutriments: {
    "energy-kcal_100g": number | null;
    proteins_100g: number | null;
    carbohydrates_100g: number | null;
    fat_100g: number | null;
    "energy-kcal_serving": number | null;
    proteins_serving: number | null;
    carbohydrates_serving: number | null;
    fat_serving: number | null;
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

  if ([caloriesBase, proteinBase, carbBase, fatBase].every((value) => value == null)) {
    return null;
  }

  return {
    calories: roundToOne((caloriesBase ?? 0) * factor),
    protein: roundToOne((proteinBase ?? 0) * factor),
    carbs: roundToOne((carbBase ?? 0) * factor),
    fat: roundToOne((fatBase ?? 0) * factor),
    harmfulIngredientMatches: detectHarmfulIngredients(source.ingredients_text),
    ingredientsText: source.ingredients_text ?? null,
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
  };
};

export const detectHarmfulIngredients = (ingredientsText: string | null | undefined): string[] => {
  if (!ingredientsText) return [];

  const haystack = ingredientsText.toLowerCase();
  return [...new Set(harmfulIngredients.filter((ingredient) => haystack.includes(ingredient.toLowerCase())))];
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
    if (target <= 0) return;

    const diffRatio = Math.abs(current - target) / target;
    const currentPenalty = Math.min(maxPenalty, diffRatio * multiplier);
    penalty += currentPenalty;

    if (diffRatio <= 0.15) {
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

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const rating = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;

  return {
    score,
    rating,
    notes: [...new Set(notes)],
  };
};

export const buildMealTags = (nutrition: NutritionInfo): Array<{
  label: string;
  variant: "success" | "warning" | "danger";
}> => {
  const tags: Array<{ label: string; variant: "success" | "warning" | "danger" }> = [];

  if (nutrition.protein >= 20) {
    tags.push({ label: "High protein", variant: "success" });
  }

  if (nutrition.harmfulIngredientMatches.length > 0) {
    tags.push({ label: `${nutrition.harmfulIngredientMatches.length} flagged`, variant: "danger" });
  } else if (nutrition.calories >= 700) {
    tags.push({ label: "Calorie dense", variant: "warning" });
  } else {
    tags.push({ label: "No flagged ingredients", variant: "success" });
  }

  return tags.slice(0, 2);
};
