import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

import { fieldPlaceholderColor, formatQuantityLabel } from "../display";
import { commonUnits } from "../meals-data";
import { useMeals } from "../meals-context";
import { getAmountError, getNamedItemError, isValidNamedItem, isValidPositiveAmount } from "../validation";

export default function CustomIngredientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const { addRecipeIngredient, saveCustomFood } = useMeals();
  const [name, setName] = useState(typeof params.name === "string" ? params.name : "");
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showUnitInfo, setShowUnitInfo] = useState(false);
  const [attemptedAdd, setAttemptedAdd] = useState(false);

  const canAddIngredient = useMemo(
    () => isValidNamedItem(name) && isValidPositiveAmount(quantity),
    [name, quantity]
  );

  const nameError = attemptedAdd || name.trim() ? getNamedItemError(name, "Ingredient name") : "";
  const quantityError = attemptedAdd || quantity.trim() ? getAmountError(quantity) : "";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Custom Ingredient</Text>
        <Text style={styles.subtitle}>
          Add a custom ingredient with the same quantity and unit flow used in recipe creation.
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ingredient Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Homemade garlic sauce"
            placeholderTextColor={fieldPlaceholderColor}
            value={name}
            onChangeText={setName}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <Text style={styles.sectionTitle}>Brand / Source (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Homemade"
            placeholderTextColor={fieldPlaceholderColor}
            value={brand}
            onChangeText={setBrand}
          />

          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any extra details about this ingredient"
            placeholderTextColor={fieldPlaceholderColor}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quantity</Text>
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
            <Text style={styles.sectionTitle}>Unit</Text>
            <Pressable style={styles.infoButton} onPress={() => setShowUnitInfo((value) => !value)}>
              <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
          </View>

          {showUnitInfo ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Unit describes how the ingredient is measured, such as cup, tbsp, whole, oz, or g.
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

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>Name: {name.trim() || "Not entered yet"}</Text>
          <Text style={styles.previewText}>Brand / Source: {brand.trim() || "Not entered yet"}</Text>
          <Text style={styles.previewText}>
            Amount: {quantity.trim() ? formatQuantityLabel(quantity, unit) : "Not entered yet"}
          </Text>
          {notes.trim() ? <Text style={styles.previewText}>Notes: {notes.trim()}</Text> : null}
        </View>

        <Pressable
          style={[styles.button, !canAddIngredient && styles.buttonDisabled]}
          disabled={!canAddIngredient}
          onPress={() => {
            setAttemptedAdd(true);
            if (!canAddIngredient) return;

            const savedCustom = saveCustomFood(name.trim(), unit.trim() || "serving");
            addRecipeIngredient({
              name: savedCustom.name,
              quantity: quantity.trim(),
              unit: unit.trim() || savedCustom.suggestedUnit,
              brand: brand.trim(),
              notes: notes.trim(),
              source: "custom",
            });
            router.back();
          }}
        >
          <Text style={[styles.buttonText, !canAddIngredient && styles.buttonTextDisabled]}>Add Custom Ingredient</Text>
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
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    marginTop: -4,
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
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 6,
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
