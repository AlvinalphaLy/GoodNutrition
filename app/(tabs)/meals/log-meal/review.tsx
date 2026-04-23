import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useRef } from "react";
import { Redirect, Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "../../../context/profileContext";
import { formatQuantityLabel } from "../display";
import { useMeals } from "../meals-context";
import { buildScoreSummary, summarizeNutritionEntries } from "../nutrition";

const NUTRISCORE_COLOR: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63312",
};

const NOVA_COLOR: Record<number, string> = {
  1: "#038141",
  2: "#85BB2F",
  3: "#EE8100",
  4: "#E63312",
};

const NOVA_LABEL: Record<number, string> = {
  1: "Unprocessed",
  2: "Culinary ingredient",
  3: "Processed",
  4: "Ultra-processed",
};

function formatTag(tag: string): string {
  return tag.replace(/^en:/, "").replace(/-/g, " ");
}

const HOME_RETURN_TARGETS = ["/(tabs)", "/(tabs)/index", "/"];
const MEALS_HUB_TARGETS = ["/meals", "/(tabs)/meals", "/(tabs)/meals/index"];

const returnHomeAndResetMeals = (router: ReturnType<typeof useRouter>) => {
  router.replace("/(tabs)/meals" as Href);
  requestAnimationFrame(() => {
    router.replace("/(tabs)" as Href);
  });
};

const returnToMealsHubAndResetStack = (router: ReturnType<typeof useRouter>) => {
  router.dismissTo("/meals" as Href);
};

function IngredientReview({ items }: { items: ReturnType<typeof useMeals>["mealDraft"]["items"] }) {
  const itemsWithData = items.filter((i) => {
    const hasFlags =
      !!i.nutrition?.nutriscore_grade ||
      !!i.nutrition?.nova_group ||
      !!i.nutrition?.allergens_tags?.length ||
      !!i.nutrition?.additives_tags?.length ||
      !!i.nutrition?.nutrient_levels;

    const isEligibleOffItem = i.sourceType === "off" && !!i.nutrition;
    return hasFlags || isEligibleOffItem;
  });

  if (itemsWithData.length === 0) {
    return <Text style={styles.cardText}>No ingredient data available yet.</Text>;
  }

  return (
    <>
      {itemsWithData.map((item) => {
        const ns = item.nutrition?.nutriscore_grade?.toLowerCase();
        const nsColor = ns ? NUTRISCORE_COLOR[ns] ?? "#9ca3af" : null;
        const nova = item.nutrition?.nova_group;
        const novaColor = nova ? NOVA_COLOR[nova] ?? "#9ca3af" : null;
        const allergens = item.nutrition?.allergens_tags?.map(formatTag).filter(Boolean) ?? [];
        const additives = item.nutrition?.additives_tags?.map(formatTag).filter(Boolean) ?? [];
        const nl = item.nutrition?.nutrient_levels;
        const highFlags = nl
          ? (["fat", "saturated-fat", "sugars", "salt"] as const)
              .filter((k) => nl[k] === "high")
              .map((k) => k.replace("-", " "))
          : [];

        return (
          <View key={item.id} style={styles.ingredientItem}>
            <Text style={styles.ingredientName}>{item.name}</Text>

            <View style={styles.badgeRow}>
              {nsColor ? (
                <View style={[styles.badge, { backgroundColor: nsColor }]}>
                  <Text style={styles.badgeText}>
                    Nutri-Score {item.nutrition?.nutriscore_grade?.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              {nova && novaColor ? (
                <View style={[styles.badge, { backgroundColor: novaColor }]}>
                  <Text style={styles.badgeText}>
                    NOVA {nova} · {NOVA_LABEL[nova]}
                  </Text>
                </View>
              ) : null}
            </View>

            {!nsColor && !novaColor && (item.nutrition?.brand || item.nutrition?.serving_size) ? (
              <View style={styles.badgeRow}>
                {item.nutrition?.brand ? (
                  <View style={styles.badgeNeutral}>
                    <Text style={styles.badgeNeutralText}>{item.nutrition.brand}</Text>
                  </View>
                ) : null}
                {item.nutrition?.serving_size ? (
                  <View style={styles.badgeNeutral}>
                    <Text style={styles.badgeNeutralText}>{item.nutrition.serving_size}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {allergens.length > 0 ? (
              <View style={styles.flagRow}>
                <Text style={styles.flagBullet}>⚠️</Text>
                <Text style={[styles.flagText, { color: "#b45309" }]}>Allergens: {allergens.join(", ")}</Text>
              </View>
            ) : null}

            {additives.length > 0 ? (
              <View style={styles.flagRow}>
                <Text style={styles.flagBullet}>🧪</Text>
                <Text style={styles.flagText}>
                  {additives.length} additive{additives.length > 1 ? "s" : ""}: {additives.slice(0, 4).join(", ")}
                  {additives.length > 4 ? ` +${additives.length - 4} more` : ""}
                </Text>
              </View>
            ) : null}

            {item.nutrition?.harmfulIngredientMatches?.length ? (
              <View style={styles.flagRow}>
                <Text style={styles.flagBullet}>🚩</Text>
                <Text style={[styles.flagText, { color: "#b91c1c" }]}>Flagged ingredients: {item.nutrition.harmfulIngredientMatches.join(", ")}</Text>
              </View>
            ) : null}

            {highFlags.length > 0 ? (
              <View style={styles.flagRow}>
                <Text style={styles.flagBullet}>🔴</Text>
                <Text style={[styles.flagText, { color: "#b91c1c" }]}>High in: {highFlags.join(", ")}</Text>
              </View>
            ) : null}

            {!nsColor && !novaColor && allergens.length === 0 && additives.length === 0 && highFlags.length === 0 && !item.nutrition?.harmfulIngredientMatches?.length && !item.nutrition?.brand && !item.nutrition?.serving_size ? (
              <View style={styles.badgeRow}>
                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeNeutralText}>OFF item</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

export default function ReviewMealScreen() {
  const router = useRouter();
  const finishNavigationLockRef = useRef(false);
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

  const exitTarget = ((typeof returnTo === "string" && returnTo.length > 0 ? returnTo : "/meals") as Href);
  const isHomeExitTarget = HOME_RETURN_TARGETS.includes(exitTarget as string);
  const isMealsExitTarget = MEALS_HUB_TARGETS.includes(exitTarget as string);

  if (!isViewingSavedMeal && mealItems.length === 0) {
    return <Redirect href={exitTarget} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft:
            typeof returnTo === "string" && returnTo.length > 0
              ? () => (
                  <Pressable
                    onPress={() => {
                      if (isHomeExitTarget) {
                        returnHomeAndResetMeals(router);
                        return;
                      }
                      if (isMealsExitTarget) {
                        returnToMealsHubAndResetStack(router);
                        return;
                      }
                      router.replace(exitTarget);
                    }}
                    accessibilityRole="button"
                    style={{ marginLeft: 4, paddingHorizontal: 8, paddingVertical: 6 }}
                  >
                    <Ionicons name="chevron-back" size={26} color="#111827" />
                  </Pressable>
                )
              : undefined,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isViewingSavedMeal ? "Meal Details" : editingLoggedMealId ? "Review Updated Meal" : "Review Meal"}
      </Text>
      <Text style={styles.subtitle}>
        {isViewingSavedMeal
          ? "Review this saved meal, or edit or delete it."
          : "Review what you've added before saving it to Today's Logged Meals."}
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
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{scoreSummary.score} / 100</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{scoreSummary.rating}/5</Text>
          </View>
        </View>
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
                  {Math.round(item.nutrition.calories ?? 0)} kcal • {Math.round(item.nutrition.protein ?? 0)}g protein • {Math.round(item.nutrition.carbs ?? 0)}g carbs • {Math.round(item.nutrition.fat ?? 0)}g fat
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
        <IngredientReview items={mealItems} />
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
                if (isHomeExitTarget) {
                  returnHomeAndResetMeals(router);
                  return;
                }
                if (isMealsExitTarget) {
                  returnToMealsHubAndResetStack(router);
                  return;
                }
                router.replace(exitTarget);
              }}
            >
              <Text style={styles.deleteButtonText}>Delete Meal</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (isHomeExitTarget) {
                returnHomeAndResetMeals(router);
                return;
              }
              if (isMealsExitTarget) {
                returnToMealsHubAndResetStack(router);
                return;
              }
              router.replace(exitTarget);
            }}
          >
            <Text style={styles.primaryButtonText}>{isHomeExitTarget ? "Back to Home" : "Back to Meals"}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.primaryButton, !canFinish && styles.buttonDisabled]}
          disabled={!canFinish}
          onPress={() => {
            if (finishNavigationLockRef.current) return;
            finishNavigationLockRef.current = true;
            const target = exitTarget;
            if (isHomeExitTarget) {
              returnHomeAndResetMeals(router);
            } else if (isMealsExitTarget) {
              returnToMealsHubAndResetStack(router);
            } else {
              router.replace(target);
            }
            setTimeout(() => {
              finishMealLogging();
            }, 0);
          }}
        >
          <Text style={[styles.primaryButtonText, !canFinish && styles.buttonTextDisabled]}>
            {editingLoggedMealId ? "Save Meal Changes" : "Finish"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
    </>
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
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    color: "#22c55e",
  },
  gradeBadge: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
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
  ingredientItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 6,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  badgeNeutral: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeNeutralText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  flagBullet: {
    fontSize: 16,
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
    color: "#166534",
  },
});
