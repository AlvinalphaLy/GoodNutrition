import { Stack } from "expo-router";

import { MealsProvider } from "./meals-context";

export default function MealsLayout() {
  return (
    <MealsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Meals" }} />
        <Stack.Screen name="log-meal/meal-type" options={{ title: "Select Meal Type" }} />
        <Stack.Screen name="log-meal/method" options={{ title: "Choose Logging Method" }} />
        <Stack.Screen name="log-meal/add-items" options={{ title: "Add Food Items" }} />
        <Stack.Screen name="log-meal/review" options={{ title: "Review Meal" }} />
        <Stack.Screen name="recipes/index" options={{ title: "Recipes" }} />
        <Stack.Screen name="recipes/view" options={{ title: "View Existing Recipes" }} />
        <Stack.Screen name="recipes/create" options={{ title: "Create New Recipe" }} />
        <Stack.Screen name="recipes/ingredient-search" options={{ title: "Add Ingredients" }} />
        <Stack.Screen name="recipes/custom-ingredient" options={{ title: "Create Custom Ingredient" }} />
        <Stack.Screen name="recipes/quantity-unit" options={{ title: "Quantity / Unit" }} />
        <Stack.Screen name="recipes/review" options={{ title: "Review Recipe" }} />
      </Stack>
    </MealsProvider>
  );
}
