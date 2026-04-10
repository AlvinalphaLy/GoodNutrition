import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMeals } from "../meals-context";

export default function MealMethodScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { setMealMethod } = useMeals();

  const methods = [
    {
      title: "Barcode",
      description: "Scan a barcode to quickly add a food item",
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
      <Text style={styles.title}>Choose Logging Method</Text>
      <Text style={styles.subtitle}>
        Choose how you want to add items for this meal
      </Text>

      {methods.map((method) => (
        <Pressable
          key={method.title}
          style={styles.card}
          onPress={() => {
            setMealMethod(method.title);
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
