import { ScrollView, StyleSheet, Text, View } from "react-native";

const mockRecipes = [
  {
    id: 1,
    name: "High Protein Oatmeal",
    servings: "2 servings",
    summary: "Calories and macros placeholder",
  },
  {
    id: 2,
    name: "Chicken Rice Bowl",
    servings: "1 serving",
    summary: "Calories and macros placeholder",
  },
  {
    id: 3,
    name: "Greek Yogurt Fruit Bowl",
    servings: "1 serving",
    summary: "Calories and macros placeholder",
  },
];

export default function ViewRecipesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>View Existing Recipes</Text>
      <Text style={styles.subtitle}>
        Saved recipes will appear here. These are placeholder cards for now.
      </Text>

      {mockRecipes.map((recipe) => (
        <View key={recipe.id} style={styles.card}>
          <Text style={styles.cardTitle}>{recipe.name}</Text>
          <Text style={styles.cardMeta}>{recipe.servings}</Text>
          <Text style={styles.cardText}>{recipe.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    paddingBottom: 40,
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
  },
});