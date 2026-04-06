import { tool } from "ai";
import { z } from "zod";

/**
 * Tool definitions for the Nutrition AI.
 * These are passed to streamText() so the LLM can invoke them mid-conversation.
 * Each tool has a Zod schema for parameters and an execute function.
 *
 * For a production app, replace the stub data below with calls to a real
 * nutrition database (e.g. USDA FoodData Central, OpenFoodFacts, Edamam).
 */
export const nutritionTools = {
  // ── Macro estimator ─────────────────────────────────────────────────────
  estimate_macros: tool({
    description:
      "Estimate the macros (calories, protein, carbs, fat, fibre) for a described meal or food item. Use this when the user asks about the nutrition of something they plan to eat.",
    parameters: z.object({
      food_description: z.string().describe("The food or meal to estimate macros for"),
      serving_size: z
        .string()
        .optional()
        .describe("The portion size, e.g. '200g', '1 cup', '1 medium bowl'"),
    }),
    execute: async ({ food_description, serving_size }) => {
      // In production, call USDA FoodData Central or Edamam here.
      // Returning plausible placeholder data so the LLM can reason about it.
      return {
        food: food_description,
        serving: serving_size ?? "typical serving",
        note: "These are approximate values. Actual nutrition depends on preparation method and exact quantities.",
        macros: {
          calories: "~350–500 kcal (typical range for this type of meal)",
          protein: "20–35 g",
          carbohydrates: "30–60 g",
          fat: "10–20 g",
          fibre: "3–8 g",
        },
      };
    },
  }),

  // ── Meal swap suggester ──────────────────────────────────────────────────
  suggest_meal_swap: tool({
    description:
      "Suggest a healthier or goal-aligned swap for a food or meal the user currently eats. Use when the user wants to reduce calories, cut fat, increase protein, or accommodate a dietary restriction.",
    parameters: z.object({
      original_food: z.string().describe("The food or meal to swap out"),
      goal: z
        .enum(["lower_calories", "higher_protein", "lower_carbs", "lower_fat", "more_fibre", "allergen_free"])
        .describe("The optimisation goal for the swap"),
      dietary_restrictions: z
        .array(z.string())
        .optional()
        .describe("Any dietary restrictions the swap must respect"),
    }),
    execute: async ({ original_food, goal, dietary_restrictions }) => {
      const goalDescriptions: Record<string, string> = {
        lower_calories: "reduce calorie density",
        higher_protein: "boost protein content",
        lower_carbs: "reduce carbohydrate load",
        lower_fat: "reduce fat content",
        more_fibre: "increase dietary fibre",
        allergen_free: "avoid the specified allergens",
      };

      return {
        original: original_food,
        goal: goalDescriptions[goal] ?? goal,
        restrictions: dietary_restrictions ?? [],
        suggestion: `A smart swap to ${goalDescriptions[goal] ?? goal} while keeping the meal satisfying. Consider grilled or baked lean proteins, extra vegetables for volume, whole grains over refined, and using herbs/spices instead of sauces for flavour.`,
        note: "I can give you a specific swap with quantities if you tell me more about the meal.",
      };
    },
  }),

  // ── Daily calorie/macro needs ────────────────────────────────────────────
  calculate_daily_needs: tool({
    description:
      "Estimate daily calorie and macro needs based on user characteristics and goals. Use when the user asks how many calories they should eat or what their macro split should be.",
    parameters: z.object({
      goal: z
        .enum(["fat_loss", "muscle_gain", "maintenance", "better_energy", "healthy_eating"])
        .describe("Primary nutrition goal"),
      activity_level: z
        .enum(["sedentary", "lightly_active", "moderately_active", "very_active"])
        .describe("How active the person is"),
      sex: z.enum(["male", "female", "prefer_not_to_say"]).optional(),
      age_range: z.enum(["18-29", "30-44", "45-59", "60+"]).optional(),
    }),
    execute: async ({ goal, activity_level, sex, age_range }) => {
      const baseRanges: Record<string, { calories: string; protein: string; carbs: string; fat: string }> = {
        fat_loss:        { calories: "1,400–1,800 kcal", protein: "1.6–2.2 g/kg BW", carbs: "30–45% of calories", fat: "25–35% of calories" },
        muscle_gain:     { calories: "2,200–3,000 kcal", protein: "1.8–2.5 g/kg BW", carbs: "45–55% of calories", fat: "20–30% of calories" },
        maintenance:     { calories: "1,800–2,400 kcal", protein: "1.2–1.6 g/kg BW", carbs: "45–55% of calories", fat: "25–35% of calories" },
        better_energy:   { calories: "1,800–2,400 kcal", protein: "1.2–1.6 g/kg BW", carbs: "50–60% of calories", fat: "20–30% of calories" },
        healthy_eating:  { calories: "1,800–2,400 kcal", protein: "1.2–1.6 g/kg BW", carbs: "45–55% of calories", fat: "25–35% of calories" },
      };

      const ranges = baseRanges[goal] ?? baseRanges.maintenance;
      return {
        goal,
        activity_level,
        sex: sex ?? "not specified",
        age_range: age_range ?? "not specified",
        estimated_ranges: ranges,
        note: "These are general population estimates. For precise targets, consult a registered dietitian who can factor in your exact weight, height, and health history.",
      };
    },
  }),
};
