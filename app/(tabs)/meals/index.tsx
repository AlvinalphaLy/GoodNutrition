import { useMemo } from "react";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatQuantityLabel } from "./display";
import { useMeals } from "./meals-context";

export default function MealsHubScreen() {
  const router = useRouter();
  const {
    loggedMeals,
    beginNewMealDraft,
    startEditingLoggedMeal,
    deleteLoggedMeal,
  } = useMeals();

  const todayKey = new Date().toDateString();
  const todaysMeals = useMemo(
    () =>
      loggedMeals.filter(
        (meal) => new Date(meal.loggedAt).toDateString() === todayKey
      ),
    [loggedMeals, todayKey]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meals</Text>
      <Text style={styles.subtitle}>Choose what you want to do next</Text>

      <Pressable
        style={styles.card}
        onPress={() => {
          beginNewMealDraft();
          router.push(`/meals/log-meal/meal-type?returnTo=${encodeURIComponent("/meals")}` as Href);
        }}
      >
        <Text style={styles.cardTitle}>Log Meal</Text>
        <Text style={styles.cardText}>
          Add items or meals to your log
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/meals/recipes" as Href)}
      >
        <Text style={styles.cardTitle}>Recipes</Text>
        <Text style={styles.cardText}>
          View existing recipes or create a new one
        </Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Logged Meals</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a meal to review it, or use Edit / Delete from the list.
        </Text>

        {todaysMeals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No meals logged today</Text>
            <Text style={styles.emptyText}>
              After you finish a meal review, it will appear here.
            </Text>
          </View>
        ) : (
          todaysMeals.map((meal) => (
            <View key={meal.id} style={styles.logCard}>
              <Pressable
                onPress={() =>
                  router.push(
                    `/meals/log-meal/review?loggedMealId=${meal.id}` as Href
                  )
                }
              >
                <Text style={styles.logTitle}>{meal.mealName || meal.mealType}</Text>
                <Text style={styles.logMeta}>{meal.logMode === "meal" ? "Meal Entry" : "Item Entry"} • {meal.method}</Text>
                <Text style={styles.logText}>
                  {meal.items.length} item{meal.items.length === 1 ? "" : "s"}
                  {meal.logMode === "meal" ? ` • ${meal.servingsLogged || "1"} serving(s)` : ""}
                </Text>
                {meal.items.map((item) => (
                  <View key={item.id}>
                    <Text style={styles.logItemText}>
                      • {item.name} — {formatQuantityLabel(item.quantity, item.unit)}
                    </Text>
                    {item.calories != null ? (
                      <Text style={styles.logItemMacro}>
                        {"  "}{item.calories} kcal · P {item.protein}g · C {item.carbs}g · F {item.fat}g
                      </Text>
                    ) : null}
                  </View>
                ))}
                <Text style={styles.tapHint}>Tap to view details</Text>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => {
                    startEditingLoggedMeal(meal.id);
                    router.push(`/meals/log-meal/meal-type?returnTo=${encodeURIComponent("/meals")}` as Href);
                  }}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteLoggedMeal(meal.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 20,
    paddingTop: 32,
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
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  logCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  logMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22c55e",
    marginBottom: 8,
  },
  logText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  logItemText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 2,
  },
  logItemMacro: {
    fontSize: 12,
    color: "#10B981",
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#166534",
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
});
