import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
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

import { fieldPlaceholderColor, formatQuantityLabel } from "../display";
import { commonUnits, type PresetFoodItem } from "../meals-data";
import { useMeals } from "../meals-context";
import {
  getAmountError,
  getNamedItemError,
  isValidNamedItem,
  isValidPositiveAmount,
} from "../validation";

type SelectedIngredientState = {
  id: string | null;
  name: string;
  source: "system" | "custom";
  isLibraryItem: boolean;
};

type CustomEditorState = {
  id: string;
  originalName: string;
  name: string;
  unit: string;
} | null;

export default function IngredientSearchScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const {
    recipeDraft,
    presetFoods,
    addRecipeIngredient,
    updateRecipeIngredient,
    removeRecipeIngredient,
    saveCustomFood,
    updateCustomFood,
    removeCustomFood,
  } = useMeals();

  const [search, setSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<SelectedIngredientState | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showUnitInfo, setShowUnitInfo] = useState(false);
  const [attemptedAdd, setAttemptedAdd] = useState(false);
  const [customEditor, setCustomEditor] = useState<CustomEditorState>(null);
  const [attemptedCustomSave, setAttemptedCustomSave] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [attemptedIngredientEditSave, setAttemptedIngredientEditSave] = useState(false);

  const filteredIngredients = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return presetFoods.slice(0, 10);
    }

    return presetFoods.filter((food) => {
      const haystack = [food.name, ...(food.aliases ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [presetFoods, search]);

  const exactMatchExists = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return false;

    return presetFoods.some((food) => {
      const names = [food.name, ...(food.aliases ?? [])].map((entry) => entry.toLowerCase());
      return names.includes(normalized);
    });
  }, [presetFoods, search]);

  const quantityIsValid = isValidPositiveAmount(quantity);
  const canAddIngredient = !!selectedIngredient?.name.trim() && quantityIsValid;
  const canReview = recipeDraft.ingredients.length > 0;
  const ingredientError = attemptedAdd || selectedIngredient?.name.trim()
    ? getNamedItemError(selectedIngredient?.name ?? "", "Ingredient")
    : "";
  const quantityError = attemptedAdd || quantity.trim() ? getAmountError(quantity) : "";
  const canCreateCustomIngredient =
    !selectedIngredient &&
    search.trim().length > 0 &&
    isValidNamedItem(search) &&
    filteredIngredients.length === 0 &&
    !exactMatchExists;
  const customEditorError = attemptedCustomSave && customEditor ? getNamedItemError(customEditor.name, "Custom ingredient name") : "";
  const editQuantityError = attemptedIngredientEditSave || editQuantity.trim() ? getAmountError(editQuantity) : "";
  const canSaveIngredientEdit = isValidPositiveAmount(editQuantity);

  const selectIngredient = (item: PresetFoodItem) => {
    setSelectedIngredient({
      id: item.id,
      name: item.name,
      source: item.source,
      isLibraryItem: true,
    });
    setSearch(item.name);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit(item.suggestedUnit ?? "");
    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const selectCustomIngredient = () => {
    const trimmedName = search.trim();
    setSelectedIngredient({
      id: null,
      name: trimmedName,
      source: "custom",
      isLibraryItem: false,
    });
    setSearch(trimmedName);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit("");
  };

  const clearSelection = () => {
    setSearch("");
    setSelectedIngredient(null);
    setQuantity("");
    setUnit("");
    setAttemptedAdd(false);
    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const startCustomEditor = (item: PresetFoodItem) => {
    setCustomEditor({
      id: item.id,
      originalName: item.name,
      name: item.name,
      unit: item.suggestedUnit || "serving",
    });
    setAttemptedCustomSave(false);
  };

  const handleSaveCustomEditor = () => {
    if (!customEditor) return;
    setAttemptedCustomSave(true);
    if (!isValidNamedItem(customEditor.name)) return;

    updateCustomFood(customEditor.id, customEditor.name.trim(), customEditor.unit || "serving");

    if (selectedIngredient?.id === customEditor.id) {
      setSelectedIngredient({
        id: customEditor.id,
        name: customEditor.name.trim(),
        source: "custom",
        isLibraryItem: true,
      });
      setSearch(customEditor.name.trim());
      if (!unit) {
        setUnit(customEditor.unit || "serving");
      }
    }

    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const handleRemoveCustomIngredient = (item: PresetFoodItem) => {
    removeCustomFood(item.id);
    if (selectedIngredient?.id === item.id || selectedIngredient?.name.toLowerCase() === item.name.toLowerCase()) {
      clearSelection();
    }
    if (customEditor?.id === item.id) {
      setCustomEditor(null);
      setAttemptedCustomSave(false);
    }
  };

  const beginIngredientEdit = (ingredientId: string, currentQuantity: string, currentUnit: string) => {
    setEditingIngredientId(ingredientId);
    setEditQuantity(currentQuantity);
    setEditUnit(currentUnit);
    setAttemptedIngredientEditSave(false);
  };

  const cancelIngredientEdit = () => {
    setEditingIngredientId(null);
    setEditQuantity("");
    setEditUnit("");
    setAttemptedIngredientEditSave(false);
  };

  const saveIngredientEdit = () => {
    setAttemptedIngredientEditSave(true);
    if (!editingIngredientId || !canSaveIngredientEdit) return;

    updateRecipeIngredient(editingIngredientId, {
      quantity: editQuantity.trim(),
      unit: editUnit.trim(),
    });
    cancelIngredientEdit();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Ingredients</Text>
        <Text style={styles.subtitle}>
          Search for ingredients, then add the quantity and unit you need.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{recipeDraft.name || "Untitled Recipe"}</Text>
          <Text style={styles.summaryMeta}>Servings: {recipeDraft.servings || "Not set"}</Text>
          <Text style={styles.summaryText}>
            {recipeDraft.ingredients.length} ingredient{recipeDraft.ingredients.length === 1 ? "" : "s"} added so far
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ingredient</Text>
          <Text style={styles.sectionText}>
            Search for an ingredient. If it isn&apos;t found, create a custom ingredient.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Search ingredients like oats, yogurt, or chicken"
            placeholderTextColor={fieldPlaceholderColor}
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              if (selectedIngredient && value.trim() !== selectedIngredient.name.trim()) {
                setSelectedIngredient(null);
                setQuantity("");
                setUnit("");
              }
            }}
          />

          {selectedIngredient?.name.trim() ? (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeaderRow}>
                <View style={styles.selectedTextWrap}>
                  <Text style={styles.selectedLabel}>Selected ingredient</Text>
                  <Text style={styles.selectedValue}>{selectedIngredient.name.trim()}</Text>
                </View>
                <Pressable onPress={clearSelection}>
                  <Text style={styles.changeLink}>Change</Text>
                </Pressable>
              </View>
              {selectedIngredient.source === "custom" && selectedIngredient.isLibraryItem && selectedIngredient.id ? (
                customEditor && customEditor.id === selectedIngredient.id ? (
                  <View style={styles.editorCard}>
                    <Text style={styles.editorTitle}>Edit Ingredient</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Custom ingredient name"
                      placeholderTextColor={fieldPlaceholderColor}
                      value={customEditor.name}
                      onChangeText={(value) => setCustomEditor((prev) => (prev ? { ...prev, name: value } : prev))}
                    />
                    {customEditorError ? <Text style={styles.errorText}>{customEditorError}</Text> : null}

                    <Text style={styles.editorLabel}>Suggested unit</Text>
                    <View style={styles.unitChips}>
                      {commonUnits.map((item) => {
                        const isSelected = customEditor.unit === item;
                        return (
                          <Pressable
                            key={item}
                            style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                            onPress={() => setCustomEditor((prev) => (prev ? { ...prev, unit: item } : prev))}
                          >
                            <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>{item}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.editorButtonRow}>
                      <Pressable style={styles.inlineEditButton} onPress={handleSaveCustomEditor}>
                        <Text style={styles.inlineEditButtonText}>Save Changes</Text>
                      </Pressable>
                      <Pressable style={styles.inlineDeleteButton} onPress={() => setCustomEditor(null)}>
                        <Text style={styles.inlineDeleteButtonText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.inlineActionRow}>
                    <Pressable
                      style={styles.inlineEditButton}
                      onPress={() => {
                        const customItem = presetFoods.find((item) => item.id === selectedIngredient.id);
                        if (customItem) startCustomEditor(customItem);
                      }}
                    >
                      <Text style={styles.inlineEditButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.inlineDeleteButton}
                      onPress={() => {
                        const customItem = presetFoods.find((item) => item.id === selectedIngredient.id);
                        if (customItem) handleRemoveCustomIngredient(customItem);
                      }}
                    >
                      <Text style={styles.inlineDeleteButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                )
              ) : null}
            </View>
          ) : (
            <View style={styles.resultsBlock}>
              <Text style={styles.resultsTitle}>Ingredient matches</Text>

              {filteredIngredients.length === 0 ? (
                <View style={styles.emptyMatchCard}>
                  <Text style={styles.emptyMatchTitle}>No ingredients found</Text>
                  <Text style={styles.emptyMatchText}>
                    Create a custom ingredient below if needed.
                  </Text>
                </View>
              ) : (
                filteredIngredients.map((food) => (
                  <View key={food.id} style={styles.resultRow}>
                    <Pressable style={styles.resultPressable} onPress={() => selectIngredient(food)}>
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultTitle}>{food.name}</Text>
                        <Text style={styles.resultSubtitle}>
                          Suggested unit: {food.suggestedUnit}
                          {food.source === "custom" ? " • custom" : ""}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </Pressable>
                  </View>
                ))
              )}

              {canCreateCustomIngredient ? (
                <Pressable style={styles.customButton} onPress={selectCustomIngredient}>
                  <Text style={styles.customButtonText}>Create custom ingredient: “{search.trim()}”</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          {ingredientError ? <Text style={styles.errorText}>{ingredientError}</Text> : null}
        </View>

        {selectedIngredient?.name.trim() ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1, 1/2, or 2"
                placeholderTextColor={fieldPlaceholderColor}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numbers-and-punctuation"
              />
              {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.inlineTitleRow}>
                <Text style={styles.sectionTitle}>Unit</Text>
                <Pressable style={styles.infoButton} onPress={() => setShowUnitInfo((value) => !value)}>
                  <Text style={styles.infoButtonText}>i</Text>
                </Pressable>
              </View>

              {showUnitInfo ? (
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    Pick how this ingredient was measured. Quantity is the number, and unit is the measurement word.
                  </Text>
                </View>
              ) : null}

              <View style={styles.unitChips}>
                <Pressable
                  style={[styles.unitChip, !unit && styles.unitChipSelected]}
                  onPress={() => setUnit("")}
                >
                  <Text style={[styles.unitChipText, !unit && styles.unitChipTextSelected]}>No unit</Text>
                </Pressable>
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
                if (!canAddIngredient || !selectedIngredient) return;

                let normalizedName = selectedIngredient.name.trim();
                let normalizedUnit = unit.trim();
                let source: "search" | "custom" = selectedIngredient.source === "custom" ? "custom" : "search";

                if (selectedIngredient.source === "custom") {
                  const savedCustom = saveCustomFood(normalizedName, normalizedUnit || "serving");
                  normalizedName = savedCustom.name;
                  source = "custom";
                  if (!normalizedUnit && savedCustom.source === "custom") {
                    normalizedUnit = savedCustom.suggestedUnit;
                  }
                }

                addRecipeIngredient({
                  name: normalizedName,
                  quantity: quantity.trim(),
                  unit: normalizedUnit,
                  source,
                });
                clearSelection();
              }}
            >
              <Text style={[styles.primaryButtonText, !canAddIngredient && styles.buttonTextDisabled]}>Add Ingredient</Text>
            </Pressable>
          </>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Added Ingredients</Text>
          <Text style={styles.sectionText}>
            Build the full recipe here, then review or edit it once everything looks right.
          </Text>

          {recipeDraft.ingredients.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No ingredients added yet</Text>
              <Text style={styles.emptyText}>
                Add an ingredient to see it here.
              </Text>
            </View>
          ) : (
            recipeDraft.ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.itemRow}>
                <View style={styles.itemHeaderRow}>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemTitle}>{ingredient.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {formatQuantityLabel(ingredient.quantity, ingredient.unit)}
                      {ingredient.source === "custom" ? " • custom" : ""}
                    </Text>
                  </View>
                  <View style={styles.itemActionRow}>
                    <Pressable
                      style={styles.itemEditButton}
                      onPress={() => beginIngredientEdit(ingredient.id, ingredient.quantity, ingredient.unit)}
                    >
                      <Text style={styles.itemEditButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.itemRemoveButton} onPress={() => removeRecipeIngredient(ingredient.id)}>
                      <Text style={styles.itemRemoveButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>

                {editingIngredientId === ingredient.id ? (
                  <View style={styles.inlineIngredientEditor}>
                    <Text style={styles.editorLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1, 1/2, or 2"
                      placeholderTextColor={fieldPlaceholderColor}
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="numbers-and-punctuation"
                    />
                    {editQuantityError ? <Text style={styles.errorText}>{editQuantityError}</Text> : null}

                    <Text style={styles.editorLabel}>Unit</Text>
                    <View style={styles.unitChips}>
                      <Pressable
                        style={[styles.unitChip, !editUnit && styles.unitChipSelected]}
                        onPress={() => setEditUnit("")}
                      >
                        <Text style={[styles.unitChipText, !editUnit && styles.unitChipTextSelected]}>No unit</Text>
                      </Pressable>
                      {commonUnits.map((item) => {
                        const isSelected = editUnit.trim().toLowerCase() === item.toLowerCase();
                        return (
                          <Pressable
                            key={`${ingredient.id}-${item}`}
                            style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                            onPress={() => setEditUnit(item)}
                          >
                            <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>{item}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.editorButtonRow}>
                      <Pressable style={styles.inlineEditButton} onPress={saveIngredientEdit}>
                        <Text style={styles.inlineEditButtonText}>Save</Text>
                      </Pressable>
                      <Pressable style={styles.inlineDeleteButton} onPress={cancelIngredientEdit}>
                        <Text style={styles.inlineDeleteButtonText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <Pressable
          style={[styles.doneButton, !canReview && styles.buttonDisabled]}
          disabled={!canReview}
          onPress={() =>
            router.push(
              `${"/meals/recipes/review"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}` as Href
            )
          }
        >
          <Text style={[styles.primaryButtonText, !canReview && styles.buttonTextDisabled]}>Done</Text>
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
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 14,
    color: "#86efac",
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#d1d5db",
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
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 14,
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
  selectedCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 12,
  },
  selectedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  selectedTextWrap: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803d",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  changeLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  resultsBlock: {
    marginTop: 6,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  emptyMatchCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyMatchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptyMatchText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
  },
  resultRow: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingVertical: 10,
  },
  resultPressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  resultActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  customButton: {
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  customButtonText: {
    color: "#166534",
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    marginTop: 10,
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
    marginBottom: 16,
  },
  doneButton: {
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
  emptyCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
  },
  itemRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 12,
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  itemActionRow: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  itemEditButton: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
  },
  itemEditButtonText: {
    color: "#166534",
    fontWeight: "700",
  },
  itemRemoveButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
  },
  inlineIngredientEditor: {
    marginTop: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemRemoveButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  inlineActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  inlineEditButton: {
    flex: 1,
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  inlineEditButtonText: {
    color: "#166534",
    fontWeight: "700",
  },
  inlineDeleteButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  inlineDeleteButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  smallGhostButton: {
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallGhostButtonText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },
  smallDangerButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallDangerButtonText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
  editorCard: {
    marginTop: 14,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  editorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  editorLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },
  editorButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
});
