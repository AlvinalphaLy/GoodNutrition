import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMeals } from "../meals-context";

export default function MealMethodScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { setMealMethod } = useMeals();

  const handleBack = () => {
    if (typeof returnTo === "string" && returnTo) {
      router.back();
      return;
    }
    router.replace("/meals/log-meal/meal-type" as Href);
  };

  const methods = [
    {
      title: "Barcode",
      description: "Scan a barcode with Open Food Facts and add it to your log",
    },
    {
      title: "Voice",
      description: "Speak the meal or food item you want to log",
    },
    {
      title: "Manual Search",
      description: "Search for food items manually and add them",
    },
  ];

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Choose Logging Method</Text>
      <Text style={styles.subtitle}>Choose how you want to add items for this meal</Text>

      {methods.map((method) => (
        <Pressable
          key={method.title}
          style={styles.card}
          onPress={() => {
            setMealMethod(method.title);
            if (method.title === "Barcode") {
              const methodReturnTarget = `${"/meals/log-meal/method"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
              const postAddReturnTarget = typeof returnTo === "string" && returnTo ? returnTo : "/meals";
              router.push(
                `/barcode-scan?returnTo=${encodeURIComponent("/meals/log-meal/add-items")}&finalReturnTo=${encodeURIComponent(methodReturnTarget)}&postAddReturnTo=${encodeURIComponent(postAddReturnTarget)}` as Href
              );
              return;
            }

            router.push(
              `${"/meals/log-meal/add-items"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}` as Href
            );
          }}
        >
          <Text style={styles.cardTitle}>{method.title}</Text>
          <Text style={styles.cardText}>{method.description}</Text>
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
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 18,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
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
