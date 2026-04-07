import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RecipesHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <Text style={styles.subtitle}>
        View saved recipes or create a new one
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/meals/recipes/view" as Href)}
      >
        <Text style={styles.cardTitle}>View Existing Recipes</Text>
        <Text style={styles.cardText}>
          Browse saved recipes in the app
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/meals/recipes/create" as Href)}
      >
        <Text style={styles.cardTitle}>Create New Recipe</Text>
        <Text style={styles.cardText}>
          Start a new recipe and add ingredients
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    paddingTop: 32,
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
});