import { useMemo } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatQuantityLabel } from "../display";
import { useMeals } from "../meals-context";

export default function ReviewRecipeScreen() {
  const router = useRouter();
  const { recipeId, returnTo } = useLocalSearchParams<{ recipeId?: string; returnTo?: string }>();
  const {
    recipeDraft,
    savedRecipes,
    saveRecipeDraft,
    editingRecipeId,
    startEditingRecipe,
    deleteRecipe,
  } = useMeals();

  const savedRecipe = useMemo(
    () => savedRecipes.find((recipe) => recipe.id === recipeId),
    [savedRecipes, recipeId]
  );

  const isViewingSavedRecipe = !!savedRecipe;
  const recipeName = savedRecipe?.name || recipeDraft.name || "Untitled Recipe";
  const recipeServings = savedRecipe?.servings || recipeDraft.servings || "1";
  const recipeIngredients = savedRecipe?.ingredients || recipeDraft.ingredients;
  const caloriesPerServing =
    savedRecipe?.caloriesPerServing || "Calculated later";
  const macrosPerServing = savedRecipe?.macrosPerServing || "Calculated later";

  const canSaveDraft =
    !isViewingSavedRecipe && !!recipeDraft.name && recipeDraft.ingredients.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isViewingSavedRecipe ? "Recipe Details" : editingRecipeId ? "Review Updated Recipe" : "Review Recipe"}
      </Text>
      <Text style={styles.subtitle}>
        {isViewingSavedRecipe
          ? "Review the saved recipe details, or edit / delete it."
          : "Review the recipe details before saving."}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recipe Summary</Text>
        <Text style={styles.cardText}>Recipe Name: {recipeName}</Text>
        <Text style={styles.cardText}>Servings: {recipeServings}</Text>
        <Text style={styles.cardText}>Ingredients: {recipeIngredients.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredients</Text>
        {recipeIngredients.length === 0 ? (
          <Text style={styles.cardText}>No ingredients added yet.</Text>
        ) : (
          recipeIngredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.row}>
              <Text style={styles.rowTitle}>{ingredient.name}</Text>
              <Text style={styles.rowText}>
{formatQuantityLabel(ingredient.quantity, ingredient.unit)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition Summary</Text>
        <Text style={styles.cardText}>Calories per serving: {caloriesPerServing}</Text>
        <Text style={styles.cardText}>Macros per serving: {macrosPerServing}</Text>
        <Text style={styles.cardText}>
          Ingredient analysis: Placeholder until nutrition data is connected.
        </Text>
      </View>

      {isViewingSavedRecipe && savedRecipe ? (
        <>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                startEditingRecipe(savedRecipe.id);
                router.push("/meals/recipes/create" as Href);
              }}
            >
              <Text style={styles.secondaryButtonText}>Edit Recipe</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                deleteRecipe(savedRecipe.id);
                router.dismissTo("/meals/recipes/view" as Href);
              }}
            >
              <Text style={styles.deleteButtonText}>Delete Recipe</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.dismissTo("/meals/recipes/view" as Href)}
          >
            <Text style={styles.primaryButtonText}>Back to Recipes</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.primaryButton, !canSaveDraft && styles.buttonDisabled]}
          disabled={!canSaveDraft}
          onPress={() => {
            const currentEditingRecipeId = editingRecipeId;
            saveRecipeDraft();
            router.dismissTo(
              currentEditingRecipeId
                ? ((typeof returnTo === "string" && returnTo.length > 0
                    ? returnTo
                    : `/meals/recipes/review?recipeId=${currentEditingRecipeId}`) as Href)
                : ((typeof returnTo === "string" && returnTo.length > 0
                    ? returnTo
                    : "/meals/recipes") as Href)
            );
          }}
        >
          <Text
            style={[
              styles.primaryButtonText,
              !canSaveDraft && styles.buttonTextDisabled,
            ]}
          >
            {editingRecipeId ? "Save Recipe Changes" : "Save Recipe"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    paddingBottom: 96,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 4,
  },
  row: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  rowText: {
    fontSize: 14,
    color: "#6b7280",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: "#374151",
  },
});
