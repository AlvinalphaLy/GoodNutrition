import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fieldPlaceholderColor } from "../display";
import { useMeals } from "../meals-context";
import {
  getNamedItemError,
  getPositiveIntegerError,
  isValidNamedItem,
  isValidPositiveInteger,
} from "../validation";

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { recipeDraft, startRecipeDraft, editingRecipeId } = useMeals();
  const [recipeName, setRecipeName] = useState(recipeDraft.name);
  const [servings, setServings] = useState(recipeDraft.servings);
  const [attemptedContinue, setAttemptedContinue] = useState(false);

  useEffect(() => {
    setRecipeName(recipeDraft.name);
    setServings(recipeDraft.servings);
  }, [recipeDraft.name, recipeDraft.servings]);

  const canContinue = useMemo(
    () => isValidNamedItem(recipeName) && isValidPositiveInteger(servings),
    [recipeName, servings]
  );

  const nameError = attemptedContinue || recipeName.trim()
    ? getNamedItemError(recipeName, "Recipe name")
    : "";
  const servingsError = attemptedContinue || servings.trim()
    ? getPositiveIntegerError(servings, "Servings")
    : "";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text style={styles.title}>{editingRecipeId ? "Edit Recipe" : "Create New Recipe"}</Text>
        <Text style={styles.subtitle}>
          Start with the recipe basics, then add the ingredients that make up the recipe.
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recipe Name</Text>
          <Text style={styles.helperText}>Choose a clear name so this recipe is easy to find later.</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Alfredo Pasta"
            placeholderTextColor={fieldPlaceholderColor}
            value={recipeName}
            onChangeText={setRecipeName}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <Text style={styles.sectionTitle}>Servings</Text>
          <Text style={styles.helperText}>Enter how many servings the full recipe makes.</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4"
            placeholderTextColor={fieldPlaceholderColor}
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
          {servingsError ? <Text style={styles.errorText}>{servingsError}</Text> : null}
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Recipe Preview</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Name</Text>
            <Text style={styles.previewValue}>{recipeName.trim() || "Not entered yet"}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Servings</Text>
            <Text style={styles.previewValue}>{servings.trim() || "Not entered yet"}</Text>
          </View>
          <Text style={styles.previewFootnote}>
            Review the basics, then continue to add ingredients.
          </Text>
        </View>

        <Pressable
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          disabled={!canContinue}
          onPress={() => {
            setAttemptedContinue(true);
            if (!canContinue) return;

            startRecipeDraft(recipeName, servings);
            router.push(
              `${"/meals/recipes/ingredient-search"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}` as Href
            );
          }}
        >
          <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>Continue</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    paddingBottom: 160,
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
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    marginBottom: 14,
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 18,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "700",
  },
  previewValue: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    textAlign: "right",
  },
  previewFootnote: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
    marginTop: 8,
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
});
