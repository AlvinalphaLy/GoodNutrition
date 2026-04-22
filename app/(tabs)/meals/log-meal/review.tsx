import { useMemo } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { scoreMeal, gradeColor } from "../eatScore";

import { formatQuantityLabel } from "../display";
import { useMeals } from "../meals-context";

const ingredientFlags = [
  "Added sugar check placeholder",
  "Sodium review placeholder",
  "Processing level placeholder",
];

export default function ReviewMealScreen() {
  const router = useRouter();
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
    [loggedMeals, loggedMealId]
  );

  const isViewingSavedMeal = !!savedMeal;
  const mealType = savedMeal?.mealType || mealDraft.mealType || "Not selected";
  const mealMethod = savedMeal?.method || mealDraft.method || "Not selected";
  const mealMode = savedMeal?.logMode || mealDraft.logMode;
  const mealName = savedMeal?.mealName || mealDraft.mealName || (mealDraft.items.length === 1
    ? mealDraft.items[0]?.name ?? "Item Entry"
    : `${mealDraft.mealType || "Meal"} Log`);
  const mealItems = savedMeal?.items || mealDraft.items;
  const servingsLogged = savedMeal?.servingsLogged || mealDraft.servingsLogged || "1";
  const canFinish = mealItems.length > 0;
  const eatScore = useMemo(() => scoreMeal(mealItems), [mealItems]);

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
        <Text style={styles.cardTitle}>Eating Score</Text>
        {eatScore ? (
          <>
            <View style={styles.scoreRow}>
              <Text style={[styles.score, { color: eatScore.color }]}>
                {eatScore.total} / 100
              </Text>
              <View style={[styles.gradeBadge, { backgroundColor: eatScore.color + "20", borderColor: eatScore.color }]}>
                <Text style={[styles.gradeText, { color: eatScore.color }]}>{eatScore.grade}</Text>
              </View>
            </View>
            {eatScore.items.map((s) => (
              <View key={s.name} style={styles.scoreItemRow}>
                <View style={styles.scoreItemLeft}>
                  <Text style={styles.scoreItemName}>{s.name}</Text>
                  <Text style={styles.scoreItemReason}>{s.reason}</Text>
                </View>
                <Text style={[styles.scoreItemVal, { color: gradeColor(
                  s.score >= 80 ? "Excellent" : s.score >= 65 ? "Good" : s.score >= 50 ? "Fair" : "Poor"
                )}]}>
                  {s.score}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.cardText}>Add items to see your eating score.</Text>
        )}
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
              {item.calories != null ? (
                <Text style={styles.macroText}>
                  {item.calories} kcal · P {item.protein}g · C {item.carbs}g · F {item.fat}g
                </Text>
              ) : null}
              {item.entryKind === "meal" && item.nestedItems?.length ? (
                <View style={styles.nestedList}>
                  {item.nestedItems.map((nestedItem) => (
                    <Text key={nestedItem.id} style={styles.nestedItemText}>
                      o - {nestedItem.name} — {formatQuantityLabel(nestedItem.quantity, nestedItem.unit)}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}
        {mealItems.some((i) => i.calories != null) && (() => {
          const total = mealItems.reduce(
            (acc, i) => ({
              calories: acc.calories + (i.calories ?? 0),
              protein:  acc.protein  + (i.protein  ?? 0),
              carbs:    acc.carbs    + (i.carbs    ?? 0),
              fat:      acc.fat      + (i.fat      ?? 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          return (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValues}>
                {total.calories} kcal · P {Math.round(total.protein * 10) / 10}g · C {Math.round(total.carbs * 10) / 10}g · F {Math.round(total.fat * 10) / 10}g
              </Text>
            </View>
          );
        })()}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredient Review</Text>
        {ingredientFlags.map((flag) => (
          <View key={flag} style={styles.flagRow}>
            <Text style={styles.flagBullet}>•</Text>
            <Text style={styles.flagText}>{flag}</Text>
          </View>
        ))}
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
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  score: {
    fontSize: 36,
    fontWeight: "800",
  },
  gradeBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scoreItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  scoreItemLeft: {
    flex: 1,
  },
  scoreItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textTransform: "capitalize",
  },
  scoreItemReason: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },
  scoreItemVal: {
    fontSize: 18,
    fontWeight: "800",
    minWidth: 36,
    textAlign: "right",
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
  macroText: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
  },
  totalValues: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
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
