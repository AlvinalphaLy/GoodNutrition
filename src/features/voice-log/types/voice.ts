export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | null;

export type NutritionInfo = {
  // macros (scaled per serving)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat?: number | null;
  sugars?: number | null;
  fiber?: number | null;
  salt?: number | null;
  sodium?: number | null;
  // Open Food Facts metadata (not scaled)
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

export type VoiceItem = {
  name: string;
  quantity: number;
  unit: string | null;
  nutrition?: NutritionInfo;
};

export type ParsedVoiceResult = {
  meal: MealType;
  items: VoiceItem[];
  confidence: number;
  rawText: string;
};

export type VoiceLogState =
  | { status: "idle" }
  | { status: "recording" }
  | { status: "processing" }
  | { status: "preview"; result: ParsedVoiceResult }
  | { status: "error"; message: string };
