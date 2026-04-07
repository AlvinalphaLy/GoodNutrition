import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function MealTypeScreen() {
  const router = useRouter();

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Meal Type</Text>
      <Text style={styles.subtitle}>
        Choose the type of meal you want to log
      </Text>

      {mealTypes.map((meal) => (
        <Pressable
          key={meal}
          style={styles.button}
          onPress={() => router.push("./method")}
        >
          <Text style={styles.buttonText}>{meal}</Text>
        </Pressable>
      ))}
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
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});