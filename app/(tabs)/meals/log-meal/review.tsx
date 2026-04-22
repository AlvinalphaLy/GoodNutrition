import { useMemo } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "../../../context/profileContext";
import { formatQuantityLabel } from "../display";
import { useMeals } from "../meals-context";
import { buildScoreSummary, summarizeNutritionEntries } from "../nutrition";

export default function ReviewMealScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { loggedMealId, returnTo } = useLocalSearchParams<{ loggedMealId?: string; returnTo?: string }>();
  const {
    mealDraft,
    loggedMeals,
    finishMealLogging,
    editingLoggedMealId,
    startEditingLoggedMeal,
    deleteLoggedMeal,
  } = useMeals();

  const savedMeal = useMemo(
    () => loggedMeals.find((meal) => meal.id === loggedMealId),
    [loggedMealId, loggedMeals]
  );

  const isViewingSavedMeal = !!savedMeal;
  const mealType = savedMeal?.mealType || mealDraft.mealType || "Not selected";
  const mealMethod = savedMeal?.method || mealDraft.method || "Not selected";
  const mealMode = savedMeal?.logMode || mealDraft.logMode;
  const mealName =
    savedMeal?.mealName ||
    mealDraft.mealName ||
    (mealDraft.items.length === 1
      ? mealDraft.items[0]?.name ?? "Item Entry"
      : `${mealDraft.mealType || "Meal"} Log`);
  const mealItems = savedMeal?.items || mealDraft.items;
  const servingsLogged = savedMeal?.servingsLogged || mealDraft.servingsLogged || "1";
  const canFinish = mealItems.length > 0;
  const mealNutrition = useMemo(() => summarizeNutritionEntries(mealItems), [mealItems]);
  const scoreSummary = useMemo(
    () =>
      buildScoreSummary(mealNutrition, {
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carb,
        fat: profile.fat,
      }),
    [mealNutrition, profile.calories, profile.carb, profile.fat, profile.protein]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isViewingSavedMeal ? "Meal Details" : editingLoggedMealId ? "Review Updated Meal" : "Review Meal"}
      </Text>
      <Text style={styles.subtitle}>
        {isViewingSavedMeal
          ? "Review this saved meal, or edit or delete it."
          : "Review what you&apos;ve added before saving it to Today&apos;s Logged Meals."}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal Summary</Text>
        <Text style={styles.cardText}>Meal Name: {mealName}</Text>
        <Text style={styles.cardText}>Meal Type: {mealType}</Text>
        <Text style={styles.cardText}>Log Style: {mealMode === "meal" ? "Meal Entry" : "Item Entry"}</Text>
        <Text style={styles.cardText}>Logging Method: {mealMethod}</Text>
        {mealMode === "meal" ? <Text style={styles.cardText}>Servings Logged: {servingsLogged}</Text> : null}
        <Text style={styles.cardText}>Items Added: {mealItems.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition Summary</Text>
        <Text style={styles.metricText}>{Math.round(mealNutrition.calories)} kcal</Text>
        <Text style={styles.cardText}>Protein: {Math.round(mealNutrition.protein)}g</Text>
        <Text style={styles.cardText}>Carbs: {Math.round(mealNutrition.carbs)}g</Text>
        <Text style={styles.cardText}>Fat: {Math.round(mealNutrition.fat)}g</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Eating Score</Text>
        <Text style={styles.score}>{scoreSummary.score} / 100</Text>
        <Text style={styles.cardText}>Approximate rating: {scoreSummary.rating}/5</Text>
        {scoreSummary.notes.map((note) => (
          <Text key={note} style={styles.cardText}>• {note}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal Items</Text>
        {mealItems.length === 0 ? (
          <Text style={styles.cardText}>No items added yet.</Text>
        ) : (
          mealItems.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowText}>{formatQuantityLabel(item.quantity, item.unit)}</Text>
              {item.nutrition ? (
                <Text style={styles.rowMeta}>
                  {Math.round(item.nutrition.calories)} kcal • {Math.round(item.nutrition.protein)}g protein • {Math.round(item.nutrition.carbs)}g carbs • {Math.round(item.nutrition.fat)}g fat
                </Text>
              ) : null}
              {item.entryKind === "meal" && item.nestedItems?.length ? (
                <View style={styles.nestedList}>
                  {item.nestedItems.map((nestedItem) => (
                    <Text key={nestedItem.id} style={styles.nestedItemText}>
                      • {nestedItem.name} — {formatQuantityLabel(nestedItem.quantity, nestedItem.unit)}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredient Review</Text>
        {mealNutrition.harmfulIngredientMatches.length === 0 ? (
          <Text style={styles.cardText}>No harmful ingredients detected from the foods with ingredient data.</Text>
        ) : (
          mealNutrition.harmfulIngredientMatches.map((flag) => (
            <View key={flag} style={styles.flagRow}>
              <Text style={styles.flagBullet}>•</Text>
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))
        )}
      </View>

      {isViewingSavedMeal && savedMeal ? (
        <>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                startEditingLoggedMeal(savedMeal.id);
                router.push(
                  `/meals/log-meal/meal-type?returnTo=${encodeURIComponent(`/meals/log-meal/review?loggedMealId=${savedMeal.id}`)}` as Href
                );
              }}
            >
              <Text style={styles.secondaryButtonText}>Edit Meal</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                deleteLoggedMeal(savedMeal.id);
                router.dismissTo("/meals" as Href);
              }}
            >
              <Text style={styles.deleteButtonText}>Delete Meal</Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.dismissTo("/meals" as Href)}>
            <Text style={styles.primaryButtonText}>Back to Meals</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.primaryButton, !canFinish && styles.buttonDisabled]}
          disabled={!canFinish}
          onPress={() => {
            finishMealLogging();
            router.dismissTo(((typeof returnTo === "string" && returnTo.length > 0 ? returnTo : "/meals") as Href));
          }}
        >
          <Text style={[styles.primaryButtonText, !canFinish && styles.buttonTextDisabled]}>
            {editingLoggedMealId ? "Save Meal Changes" : "Finish"}
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
    lineHeight: 22,
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
  metricText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    color: "#22c55e",
    marginBottom: 8,
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
  rowMeta: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
    marginTop: 6,
  },
  nestedList: {
    marginTop: 8,
    paddingLeft: 12,
  },
  nestedItemText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 2,
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  flagBullet: {
    fontSize: 18,
    color: "#22c55e",
    marginRight: 8,
    lineHeight: 20,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#bbf7d0",
  },
  buttonTextDisabled: {
    color: "#6b7280",
  },
});
