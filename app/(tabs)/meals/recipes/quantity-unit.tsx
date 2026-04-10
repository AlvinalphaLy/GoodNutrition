import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
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
import { commonUnits } from "../meals-data";
import { useMeals } from "../meals-context";
import { getAmountError, isValidPositiveAmount } from "../validation";

export default function QuantityUnitScreen() {
  const router = useRouter();
  const { pendingRecipeIngredient, addRecipeIngredient } = useMeals();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showUnitInfo, setShowUnitInfo] = useState(false);
  const [attemptedAdd, setAttemptedAdd] = useState(false);

  const canAddIngredient = useMemo(
    () => !!pendingRecipeIngredient?.name && isValidPositiveAmount(quantity),
    [pendingRecipeIngredient, quantity]
  );

  const quantityError = attemptedAdd || quantity.trim() ? getAmountError(quantity) : "";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text style={styles.title}>Quantity / Unit</Text>
        <Text style={styles.subtitle}>
          Use this screen only when a recipe ingredient has already been selected.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Ingredient</Text>
          <Text style={styles.cardText}>{pendingRecipeIngredient?.name || "No ingredient selected"}</Text>
          {!!pendingRecipeIngredient?.brand && (
            <Text style={styles.cardText}>Brand / Source: {pendingRecipeIngredient.brand}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2 or 1/2"
            placeholderTextColor={fieldPlaceholderColor}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numbers-and-punctuation"
          />
          {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}

          <View style={styles.inlineTitleRow}>
            <Text style={styles.cardTitle}>Unit</Text>
            <Pressable style={styles.infoButton} onPress={() => setShowUnitInfo((value) => !value)}>
              <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
          </View>

          {showUnitInfo ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Unit describes how the ingredient amount is measured, like cup, whole, tbsp, oz, or g.
              </Text>
            </View>
          ) : null}

          <View style={styles.unitChips}>
            {commonUnits.map((item) => {
              const isSelected = unit.trim().toLowerCase() === item.toLowerCase();
              return (
                <Pressable
                  key={item}
                  style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                  onPress={() => setUnit(item)}
                >
                  <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

        </View>

        <Pressable
          style={[styles.primaryButton, !canAddIngredient && styles.buttonDisabled]}
          disabled={!canAddIngredient}
          onPress={() => {
            setAttemptedAdd(true);
            if (!pendingRecipeIngredient || !canAddIngredient) return;

            addRecipeIngredient({
              name: pendingRecipeIngredient.name,
              brand: pendingRecipeIngredient.brand,
              notes: pendingRecipeIngredient.notes,
              source: pendingRecipeIngredient.source,
              quantity: quantity.trim(),
              unit: unit.trim(),
            });
            router.back();
          }}
        >
          <Text style={[styles.primaryButtonText, !canAddIngredient && styles.buttonTextDisabled]}>Add Ingredient</Text>
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
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 4,
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
    marginBottom: 12,
  },
  inlineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 19,
  },
  unitChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  unitChip: {
    backgroundColor: "#f9fafb",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  unitChipSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  unitChipTextSelected: {
    color: "#166534",
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: "#374151",
  },
});
