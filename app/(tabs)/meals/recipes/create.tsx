import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function CreateRecipeScreen() {
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState("");

  const canContinue = useMemo(() => recipeName.trim().length > 0, [recipeName]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Recipe</Text>
      <Text style={styles.subtitle}>
        Enter the recipe name and servings to start a recipe draft
      </Text>

      <Text style={styles.label}>Recipe Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Chicken Alfredo Pasta"
        value={recipeName}
        onChangeText={setRecipeName}
      />

      <Text style={styles.label}>Servings (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 4"
        value={servings}
        onChangeText={setServings}
      />

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Recipe Draft Preview</Text>
        <Text style={styles.previewText}>
          Name: {recipeName.trim() || "Not entered yet"}
        </Text>
        <Text style={styles.previewText}>
          Servings: {servings.trim() || "Not entered yet"}
        </Text>
      </View>

      <Pressable
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text
          style={[
            styles.buttonText,
            !canContinue && styles.buttonTextDisabled,
          ]}
        >
          Continue to Add Ingredient (Coming Next)
        </Text>
      </Pressable>

      <Text style={styles.note}>
        For this checkpoint, this screen stops at recipe draft entry so you can
        test the UI safely before we wire ingredient search.
      </Text>
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: "#374151",
  },
  note: {
    marginTop: 16,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },
});