import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/colors";

export default function MealsHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meals</Text>
      <Text style={styles.subtitle}>
        Choose what you want to do
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/meals/log-meal/meal-type")}
      >
        <Text style={styles.cardTitle}>Log Meal</Text>
        <Text style={styles.cardText}>
          Log a breakfast, lunch, dinner, or snack
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/meals/recipes")}
      >
        <Text style={styles.cardTitle}>Recipes</Text>
        <Text style={styles.cardText}>
          View existing recipes or create a new one
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 20,
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