import type { NutritionReference } from "./nutrition";

export type PresetFoodItem = {
  id: string;
  name: string;
  suggestedUnit: string;
  aliases?: string[];
  source: "system" | "custom";
  nutritionPerSuggestedUnit?: NutritionReference;
};

export const presetFoodItems: PresetFoodItem[] = [
  { id: "food-1", name: "Banana", suggestedUnit: "whole", aliases: ["bananas"], source: "system", nutritionPerSuggestedUnit: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 } },
  { id: "food-2", name: "Apple", suggestedUnit: "whole", aliases: ["apples"], source: "system", nutritionPerSuggestedUnit: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 } },
  { id: "food-3", name: "Egg", suggestedUnit: "whole", aliases: ["eggs"], source: "system", nutritionPerSuggestedUnit: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5 } },
  { id: "food-4", name: "Greek yogurt", suggestedUnit: "cup", aliases: ["yogurt"], source: "system", nutritionPerSuggestedUnit: { calories: 130, protein: 23, carbs: 9, fat: 0 } },
  { id: "food-5", name: "Chicken breast", suggestedUnit: "oz", aliases: ["chicken"], source: "system", nutritionPerSuggestedUnit: { calories: 47, protein: 8.8, carbs: 0, fat: 1 } },
  { id: "food-6", name: "White rice", suggestedUnit: "cup", aliases: ["rice"], source: "system", nutritionPerSuggestedUnit: { calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4 } },
  { id: "food-7", name: "Rolled oats", suggestedUnit: "cup", aliases: ["oatmeal", "oats"], source: "system", nutritionPerSuggestedUnit: { calories: 307, protein: 10.7, carbs: 54.8, fat: 5.3 } },
  { id: "food-8", name: "Peanut butter", suggestedUnit: "tbsp", aliases: ["pb"], source: "system", nutritionPerSuggestedUnit: { calories: 95, protein: 3.5, carbs: 3.5, fat: 8 } },
  { id: "food-9", name: "Blueberries", suggestedUnit: "cup", aliases: ["blueberry"], source: "system", nutritionPerSuggestedUnit: { calories: 84, protein: 1.1, carbs: 21.4, fat: 0.5 } },
  { id: "food-10", name: "Strawberries", suggestedUnit: "cup", aliases: ["strawberry"], source: "system", nutritionPerSuggestedUnit: { calories: 49, protein: 1, carbs: 11.7, fat: 0.5 } },
  { id: "food-11", name: "Bell pepper", suggestedUnit: "cup", aliases: ["pepper", "capsicum"], source: "system", nutritionPerSuggestedUnit: { calories: 39, protein: 1.5, carbs: 9, fat: 0.3 } },
  { id: "food-12", name: "Black beans", suggestedUnit: "cup", aliases: ["beans"], source: "system", nutritionPerSuggestedUnit: { calories: 227, protein: 15.2, carbs: 40.8, fat: 0.9 } },
  { id: "food-13", name: "Olive oil", suggestedUnit: "tbsp", aliases: ["oil"], source: "system", nutritionPerSuggestedUnit: { calories: 119, protein: 0, carbs: 0, fat: 13.5 } },
  { id: "food-14", name: "Granola", suggestedUnit: "cup", source: "system", nutritionPerSuggestedUnit: { calories: 450, protein: 10, carbs: 64, fat: 20 } },
  { id: "food-15", name: "Broccoli", suggestedUnit: "cup", source: "system", nutritionPerSuggestedUnit: { calories: 31, protein: 2.5, carbs: 6, fat: 0.3 } },
  { id: "food-16", name: "Salmon", suggestedUnit: "oz", source: "system", nutritionPerSuggestedUnit: { calories: 59, protein: 6, carbs: 0, fat: 3.5 } },
];

export const commonUnits = ["whole", "piece", "serving", "cup", "tbsp", "tsp", "oz", "g", "lb", "slice"] as const;
