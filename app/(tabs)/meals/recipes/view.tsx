import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMeals } from "../meals-context";

export default function ViewRecipesScreen() {
  const router = useRouter();
  const { savedRecipes, startEditingRecipe, deleteRecipe } = useMeals();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Existing Recipes</Text>
      <Text style={styles.subtitle}>
        Tap a recipe to review it, or use Edit / Delete from the list.
      </Text>

      {savedRecipes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No recipes saved yet</Text>
          <Text style={styles.emptyText}>
            Saved recipes will appear here after you create one.
          </Text>
        </View>
      ) : (
        savedRecipes.map((recipe) => (
          <View key={recipe.id} style={styles.card}>
            <Pressable
              onPress={() =>
                router.push(`/meals/recipes/review?recipeId=${recipe.id}` as Href)
              }
            >
              <Text style={styles.cardTitle}>{recipe.name}</Text>
              <Text style={styles.cardMeta}>{recipe.servings} serving(s)</Text>
              <Text style={styles.cardText}>{recipe.summary}</Text>
              <Text style={styles.tapHint}>Tap to view details</Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.editButton}
                onPress={() => {
                  startEditingRecipe(recipe.id);
                  router.push(`/meals/recipes/create?returnTo=${encodeURIComponent("/meals/recipes/view")}` as Href);
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteRecipe(recipe.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
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
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
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
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 14,
    color: "#22c55e",
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 10,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
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
