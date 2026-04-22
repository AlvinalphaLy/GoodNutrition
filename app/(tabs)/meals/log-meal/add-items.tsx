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
import { useMeals, type MealDraftItem } from "../meals-context";
import {
  getAmountError,
  getNamedItemError,
  isValidNamedItem,
  isValidPositiveAmount,
} from "../validation";
import { lookupNutrition } from "../../../../src/features/voice-log/services/nutritionLookup";
import type { NutritionInfo } from "../../../../src/features/voice-log/types/voice";

function parseQty(raw: string): number {
  const trimmed = raw.trim();
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2]);
  return parseFloat(trimmed) || 1;
}

type MealMatch =
  | { id: string; name: string; kind: "recipe"; subtitle: string }
  | { id: string; name: string; kind: "loggedMeal"; subtitle: string };

type SelectedFoodState = {
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

type SelectedMealPreview = {
  kindLabel: string;
  itemCount: number;
  items: { id: string; name: string; quantity: string; unit: string }[];
} | null;

type CustomMealIngredient = Pick<MealDraftItem, "id" | "name" | "quantity" | "unit"> & {
  nutrition?: NutritionInfo | null;
};

export default function AddFoodItemsScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const {
    mealDraft,
    presetFoods,
    setMealLogMode,
    setMealName,
    setMealServingsLogged,
    applyRecipeToMeal,
    applyLoggedMealToDraft,
    addMealItem,
    removeMealItem,
    saveCustomFood,
    updateCustomFood,
    removeCustomFood,
    loggedMeals,
    savedRecipes,
  } = useMeals();

  const [mealSearch, setMealSearch] = useState(mealDraft.mealName);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<SelectedFoodState | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showUnitInfo, setShowUnitInfo] = useState(false);
  const [attemptedAdd, setAttemptedAdd] = useState(false);
  const [customEditor, setCustomEditor] = useState<CustomEditorState>(null);
  const [attemptedCustomSave, setAttemptedCustomSave] = useState(false);
  const [customMealItems, setCustomMealItems] = useState<CustomMealIngredient[]>([]);
  const [lookingUp, setLookingUp] = useState(false);

  const mealMatches = useMemo<MealMatch[]>(() => {
    const normalized = mealSearch.trim().toLowerCase();
    const matches: MealMatch[] = [];
    const seenNames = new Set<string>();

    savedRecipes.forEach((recipe) => {
      const recipeName = recipe.name.trim();
      const normalizedName = recipeName.toLowerCase();
      if (normalized && !normalizedName.includes(normalized)) return;
      if (seenNames.has(normalizedName)) return;

      seenNames.add(normalizedName);
      matches.push({
        id: recipe.id,
        name: recipeName,
        kind: "recipe",
        subtitle: `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}` ,
      });
    });

    loggedMeals.forEach((meal) => {
      const trimmedName = meal.mealName.trim();
      const normalizedName = trimmedName.toLowerCase();
      if (!trimmedName) return;
      if (normalized && !normalizedName.includes(normalized)) return;
      if (seenNames.has(normalizedName)) return;

      seenNames.add(normalizedName);
      matches.push({
        id: meal.id,
        name: trimmedName,
        kind: "loggedMeal",
        subtitle: `${meal.items.length} item${meal.items.length === 1 ? "" : "s"}`,
      });
    });

    return matches.slice(0, 8);
  }, [loggedMeals, mealSearch, savedRecipes]);

  const filteredFoods = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();

    if (!normalized) {
      return presetFoods.slice(0, 8);
    }

    return presetFoods.filter((food) => {
      const haystack = [food.name, ...(food.aliases ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [foodSearch, presetFoods]);

  const exactFoodMatchExists = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return false;

    return presetFoods.some((food) => {
      const names = [food.name, ...(food.aliases ?? [])].map((entry) => entry.toLowerCase());
      return names.includes(normalized);
    });
  }, [foodSearch, presetFoods]);

  const exactMealMatchExists = useMemo(() => {
    const normalized = mealSearch.trim().toLowerCase();
    if (!normalized) return false;

    return mealMatches.some((match) => match.name.toLowerCase() === normalized);
  }, [mealMatches, mealSearch]);

  const selectedMealExists = useMemo(
    () => mealDraft.logMode === "meal" && ["recipe", "loggedMeal"].includes(mealDraft.mealSourceType),
    [mealDraft.logMode, mealDraft.mealSourceType]
  );

  const selectedMealPreview = useMemo<SelectedMealPreview>(() => {
    if (!selectedMealExists || !mealDraft.mealSourceId) return null;

    if (mealDraft.mealSourceType === "recipe") {
      const recipe = savedRecipes.find((entry) => entry.id === mealDraft.mealSourceId);
      if (!recipe) return null;
      return {
        kindLabel: "Saved recipe",
        itemCount: recipe.ingredients.length,
        items: recipe.ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })),
      };
    }

    if (mealDraft.mealSourceType === "loggedMeal") {
      const loggedMeal = loggedMeals.find((entry) => entry.id === mealDraft.mealSourceId);
      if (!loggedMeal) return null;
      return {
        kindLabel: "Saved meal",
        itemCount: loggedMeal.items.length,
        items: loggedMeal.items,
      };
    }

    return null;
  }, [loggedMeals, mealDraft.mealSourceId, mealDraft.mealSourceType, savedRecipes, selectedMealExists]);

  const canCreateCustomFood =
    !selectedFood &&
    foodSearch.trim().length > 0 &&
    isValidNamedItem(foodSearch.trim()) &&
    filteredFoods.length === 0 &&
    !exactFoodMatchExists;

  const canCreateCustomMeal =
    mealDraft.logMode === "meal" &&
    mealSearch.trim().length > 0 &&
    isValidNamedItem(mealSearch.trim()) &&
    mealMatches.length === 0 &&
    !exactMealMatchExists;

  const quantityIsValid = isValidPositiveAmount(quantity);
  const canAddItem = !!selectedFood?.name.trim() && quantityIsValid;
  const customMealSelected = mealDraft.logMode === "meal" && mealDraft.mealSourceType === "custom" && mealDraft.mealName.trim().length > 0;
  const servingsLoggedValid = !(selectedMealExists || customMealSelected) || isValidPositiveAmount(mealDraft.servingsLogged || "1");
  const canAddSelectedMeal = (selectedMealExists || customMealSelected) && servingsLoggedValid && (selectedMealExists || customMealItems.length > 0);
  const canFinish = mealDraft.items.length > 0;
  const foodError = attemptedAdd || selectedFood?.name.trim() ? getNamedItemError(selectedFood?.name ?? "", "Food item") : "";
  const quantityError = attemptedAdd || quantity.trim() ? getAmountError(quantity) : "";
  const servingsLoggedError = (selectedMealExists || customMealSelected) && (mealDraft.servingsLogged.trim() || attemptedAdd)
    ? getAmountError(mealDraft.servingsLogged || "", "Servings")
    : "";
  const customEditorError = attemptedCustomSave && customEditor ? getNamedItemError(customEditor.name, "Custom item name") : "";

  const summaryName = mealDraft.mealName.trim()
    || (mealDraft.items.length === 1
      ? mealDraft.items[0]?.name ?? "Item Entry"
      : mealDraft.items.length > 1
        ? `${mealDraft.mealType || "Meal"} Log`
        : mealDraft.logMode === "meal"
          ? "Meal Entry"
          : "Item Entry");

  const showFoodSection = mealDraft.logMode === "single" || customMealSelected;

  const resetFoodEntry = () => {
    setFoodSearch("");
    setSelectedFood(null);
    setQuantity("");
    setUnit("");
    setAttemptedAdd(false);
    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const selectFood = (item: PresetFoodItem) => {
    setSelectedFood({
      id: item.id,
      name: item.name,
      source: item.source,
      isLibraryItem: true,
    });
    setFoodSearch(item.name);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit(item.suggestedUnit ?? "");
    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const selectCustomFood = () => {
    const trimmedName = foodSearch.trim();
    setSelectedFood({
      id: null,
      name: trimmedName,
      source: "custom",
      isLibraryItem: false,
    });
    setFoodSearch(trimmedName);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit("");
  };

  const selectMealMatch = (match: MealMatch) => {
    if (match.kind === "recipe") {
      applyRecipeToMeal(match.id);
    } else {
      applyLoggedMealToDraft(match.id);
    }
    setMealSearch(match.name);
    setCustomMealItems([]);
    resetFoodEntry();
  };

  const selectCustomMeal = () => {
    setMealName(mealSearch.trim());
    setMealServingsLogged("1");
    setCustomMealItems([]);
    resetFoodEntry();
  };

  const clearSelectedMeal = () => {
    setMealName("");
    setMealSearch("");
    setMealServingsLogged("1");
    setCustomMealItems([]);
    resetFoodEntry();
  };

  const addSelectedMealToLog = () => {
    if (!servingsLoggedValid || !mealDraft.mealName.trim()) return;

    if (selectedMealExists) {
      addMealItem({
        name: mealDraft.mealName.trim(),
        quantity: mealDraft.servingsLogged.trim() || "1",
        unit: "serving",
        entryKind: "meal",
        nestedItems: (selectedMealPreview?.items ?? []).map((item) => ({ ...item })),
        mealSourceType: mealDraft.mealSourceType,
        mealSourceId: mealDraft.mealSourceId,
      });
      clearSelectedMeal();
      return;
    }

    if (customMealSelected && customMealItems.length > 0) {
      const hasNutrition = customMealItems.some((i) => i.nutrition?.calories != null);
      const summed = hasNutrition
        ? customMealItems.reduce(
            (acc, i) => ({
              calories: acc.calories + (i.nutrition?.calories ?? 0),
              protein:  acc.protein  + (i.nutrition?.protein  ?? 0),
              carbs:    acc.carbs    + (i.nutrition?.carbs    ?? 0),
              fat:      acc.fat      + (i.nutrition?.fat      ?? 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
        : null;

      addMealItem({
        name: mealDraft.mealName.trim(),
        quantity: mealDraft.servingsLogged.trim() || "1",
        unit: "serving",
        entryKind: "meal",
        nestedItems: customMealItems.map(({ id, name, quantity, unit }) => ({ id, name, quantity, unit })),
        mealSourceType: "custom",
        mealSourceId: null,
        ...(summed && {
          calories: Math.round(summed.calories),
          protein:  Math.round(summed.protein  * 10) / 10,
          carbs:    Math.round(summed.carbs    * 10) / 10,
          fat:      Math.round(summed.fat      * 10) / 10,
        }),
      });
      clearSelectedMeal();
    }
  };

  const clearSelectedFood = () => {
    setFoodSearch("");
    setSelectedFood(null);
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

    if (selectedFood?.id === customEditor.id) {
      setSelectedFood({
        id: customEditor.id,
        name: customEditor.name.trim(),
        source: "custom",
        isLibraryItem: true,
      });
      setFoodSearch(customEditor.name.trim());
      if (!unit) {
        setUnit(customEditor.unit || "serving");
      }
    }

    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const handleRemoveCustomFood = (item: PresetFoodItem) => {
    removeCustomFood(item.id);
    if (selectedFood?.id === item.id || selectedFood?.name.toLowerCase() === item.name.toLowerCase()) {
      clearSelectedFood();
    }
    if (customEditor?.id === item.id) {
      setCustomEditor(null);
      setAttemptedCustomSave(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text style={styles.title}>Log Meal</Text>
        <Text style={styles.subtitle}>
          Add items or meals to one log. Search first, then fill in the details you need.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>{mealDraft.mealType || "Meal"}</Text>
          <Text style={styles.summaryTitle}>{summaryName}</Text>
          <Text style={styles.summaryMeta}>{mealDraft.method || "Manual Search"}</Text>
          <Text style={styles.summaryText}>
            {mealDraft.items.length} item{mealDraft.items.length === 1 ? "" : "s"} added so far
            {mealDraft.logMode === "meal" && (selectedMealExists || customMealSelected) ? ` • ${mealDraft.servingsLogged || "1"} serving logged` : ""}
          </Text>
        </View>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, mealDraft.logMode === "single" && styles.modeChipSelected]}
            onPress={() => {
              setMealLogMode("single");
              setMealSearch("");
              resetFoodEntry();
            }}
          >
            <Text style={[styles.modeChipText, mealDraft.logMode === "single" && styles.modeChipTextSelected]}>
              Item Entry
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, mealDraft.logMode === "meal" && styles.modeChipSelected]}
            onPress={() => {
              setMealLogMode("meal");
              resetFoodEntry();
            }}
          >
            <Text style={[styles.modeChipText, mealDraft.logMode === "meal" && styles.modeChipTextSelected]}>
              Meal Entry
            </Text>
          </Pressable>
        </View>

        {mealDraft.logMode === "meal" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Meal</Text>
            <Text style={styles.sectionText}>
              Search for a saved meal. If it isn&apos;t found, create a new meal and add its items.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Search meals like Chicken Rice Bowl"
              placeholderTextColor={fieldPlaceholderColor}
              value={mealSearch}
              onChangeText={(value) => {
                setMealSearch(value);
                if (mealDraft.mealName && value.trim() !== mealDraft.mealName.trim()) {
                  setMealName("");
                  setCustomMealItems([]);
                  setMealServingsLogged("1");
                }
              }}
            />

            {mealDraft.mealName.trim() ? (
              <View style={styles.selectedCard}>
                <View style={styles.selectedHeaderRow}>
                  <View style={styles.selectedTextWrap}>
                    <Text style={styles.selectedLabel}>Selected meal</Text>
                    <Text style={styles.selectedValue}>{mealDraft.mealName.trim()}</Text>
                  </View>
                  <Pressable onPress={clearSelectedMeal}>
                    <Text style={styles.changeLink}>Change</Text>
                  </Pressable>
                </View>
                <Text style={styles.selectedHelperText}>
                  {selectedMealExists
                    ? "Set how many servings you had, then add this meal to the current log."
                    : "This is a new meal. Add the items that belong to it below."}
                </Text>

                {selectedMealExists ? (
                  <>
                    <View style={styles.previewListCard}>
                      <Text style={styles.previewListTitle}>{selectedMealPreview?.kindLabel || "Saved meal"}</Text>
                      <Text style={styles.previewListText}>
                        {selectedMealPreview?.itemCount || 0} item{selectedMealPreview?.itemCount === 1 ? "" : "s"}
                      </Text>
                      {selectedMealPreview?.items.map((item) => (
                        <Text key={item.id} style={styles.previewListItem}>
                          • {item.name} — {formatQuantityLabel(item.quantity, item.unit)}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.inlineFieldBlock}>
                      <Text style={styles.sectionTitle}>Servings Logged</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 2"
                        placeholderTextColor={fieldPlaceholderColor}
                        value={mealDraft.servingsLogged}
                        onChangeText={setMealServingsLogged}
                        keyboardType="numbers-and-punctuation"
                      />
                      {servingsLoggedError ? <Text style={styles.errorText}>{servingsLoggedError}</Text> : null}
                    </View>

                    <Pressable
                      style={[styles.primaryButton, !canAddSelectedMeal && styles.buttonDisabled]}
                      disabled={!canAddSelectedMeal}
                      onPress={addSelectedMealToLog}
                    >
                      <Text style={[styles.primaryButtonText, !canAddSelectedMeal && styles.buttonTextDisabled]}>Add Meal Entry</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={styles.resultsBlock}>
                <Text style={styles.resultsTitle}>Meal matches</Text>

                {mealMatches.length === 0 ? (
                  <View style={styles.emptyMatchCard}>
                    <Text style={styles.emptyMatchTitle}>No saved meals found</Text>
                    <Text style={styles.emptyMatchText}>
                      Create a new meal name to keep going, or try a different search.
                    </Text>
                  </View>
                ) : (
                  mealMatches.map((match) => (
                    <Pressable key={`${match.kind}-${match.id}`} style={styles.resultRow} onPress={() => selectMealMatch(match)}>
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultTitle}>{match.name}</Text>
                        <Text style={styles.resultSubtitle}>
                          {match.kind === "recipe" ? "Saved recipe" : "Logged meal"} • {match.subtitle}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </Pressable>
                  ))
                )}

                {canCreateCustomMeal ? (
                  <Pressable style={styles.customButton} onPress={selectCustomMeal}>
                    <Text style={styles.customButtonText}>Create meal: “{mealSearch.trim()}”</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {showFoodSection ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Food Item</Text>
            <Text style={styles.sectionText}>
              Search for a food item. If it isn&apos;t found, create a custom item.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Search foods like banana, egg, or rice"
              placeholderTextColor={fieldPlaceholderColor}
              value={foodSearch}
              onChangeText={(value) => {
                setFoodSearch(value);
                if (selectedFood && value.trim() !== selectedFood.name.trim()) {
                  setSelectedFood(null);
                  setQuantity("");
                  setUnit("");
                }
              }}
            />

            {selectedFood?.name.trim() ? (
              <View style={styles.selectedCard}>
                <View style={styles.selectedHeaderRow}>
                  <View style={styles.selectedTextWrap}>
                    <Text style={styles.selectedLabel}>Selected food</Text>
                    <Text style={styles.selectedValue}>{selectedFood.name.trim()}</Text>
                  </View>
                  <Pressable onPress={clearSelectedFood}>
                    <Text style={styles.changeLink}>Change</Text>
                  </Pressable>
                </View>
                {selectedFood.source === "custom" && selectedFood.isLibraryItem && selectedFood.id ? (
                  customEditor && customEditor.id === selectedFood.id ? (
                    <View style={styles.editorCard}>
                      <Text style={styles.editorTitle}>Edit Item</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Custom food name"
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
                          const customItem = presetFoods.find((item) => item.id === selectedFood.id);
                          if (customItem) startCustomEditor(customItem);
                        }}
                      >
                        <Text style={styles.inlineEditButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.inlineDeleteButton}
                        onPress={() => {
                          const customItem = presetFoods.find((item) => item.id === selectedFood.id);
                          if (customItem) handleRemoveCustomFood(customItem);
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
                <Text style={styles.resultsTitle}>Food matches</Text>

                {filteredFoods.length === 0 ? (
                  <View style={styles.emptyMatchCard}>
                    <Text style={styles.emptyMatchTitle}>No foods found</Text>
                    <Text style={styles.emptyMatchText}>
                      Create a custom item below if needed.
                    </Text>
                  </View>
                ) : (
                  filteredFoods.map((food) => (
                    <View key={food.id} style={styles.resultRow}>
                      <Pressable style={styles.resultPressable} onPress={() => selectFood(food)}>
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

                {canCreateCustomFood ? (
                  <Pressable style={styles.customButton} onPress={selectCustomFood}>
                    <Text style={styles.customButtonText}>Create custom item: “{foodSearch.trim()}”</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
            {foodError ? <Text style={styles.errorText}>{foodError}</Text> : null}
          </View>
        ) : null}

        {selectedFood?.name.trim() ? (
          <>
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
                    Pick how this item was measured. Quantity is the number, and unit is the measurement word.
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
              style={[styles.primaryButton, (!canAddItem || lookingUp) && styles.buttonDisabled]}
              disabled={!canAddItem || lookingUp}
              onPress={async () => {
                setAttemptedAdd(true);
                if (!canAddItem || !selectedFood) return;

                let normalizedName = selectedFood.name.trim();
                let normalizedUnit = unit.trim();

                if (selectedFood.source === "custom") {
                  const savedCustom = saveCustomFood(normalizedName, normalizedUnit || "serving");
                  normalizedName = savedCustom.name;
                  if (!normalizedUnit && savedCustom.source === "custom") {
                    normalizedUnit = savedCustom.suggestedUnit;
                  }
                }

                setLookingUp(true);
                const nutrition = await lookupNutrition(
                  normalizedName,
                  parseQty(quantity),
                  normalizedUnit || null
                );
                setLookingUp(false);

                if (customMealSelected) {
                  setCustomMealItems((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      name: normalizedName,
                      quantity: quantity.trim(),
                      unit: normalizedUnit,
                      nutrition,
                    },
                  ]);
                } else {
                  addMealItem({
                    name: normalizedName,
                    quantity: quantity.trim(),
                    unit: normalizedUnit,
                    entryKind: "single",
                    calories:                  nutrition?.calories,
                    protein:                   nutrition?.protein,
                    carbs:                     nutrition?.carbs,
                    fat:                       nutrition?.fat,
                    saturated_fat:             nutrition?.saturated_fat,
                    sugars:                    nutrition?.sugars,
                    fiber:                     nutrition?.fiber,
                    salt:                      nutrition?.salt,
                    sodium:                    nutrition?.sodium,
                    serving_size:              nutrition?.serving_size,
                    brand:                     nutrition?.brand,
                    nova_group:                nutrition?.nova_group,
                    nutriscore_grade:          nutrition?.nutriscore_grade,
                    additives_tags:            nutrition?.additives_tags,
                    allergens_tags:            nutrition?.allergens_tags,
                    ingredients_analysis_tags: nutrition?.ingredients_analysis_tags,
                    nutrient_levels:           nutrition?.nutrient_levels,
                    ingredients_text:          nutrition?.ingredients_text,
                  });
                }
                resetFoodEntry();
              }}
            >
              <Text style={[styles.primaryButtonText, (!canAddItem || lookingUp) && styles.buttonTextDisabled]}>
                {lookingUp ? "Looking up nutrition…" : "Add Food Item"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {customMealSelected ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Meal Items</Text>
              <Text style={styles.sectionText}>
                Build this meal with the items below, then add the meal entry to your log.
              </Text>

              {customMealItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No meal items added yet</Text>
                  <Text style={styles.emptyText}>
                    Add the foods that belong to this meal.
                  </Text>
                </View>
              ) : (
                customMealItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>{formatQuantityLabel(item.quantity, item.unit)}</Text>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => setCustomMealItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Servings Logged</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 or 2"
                placeholderTextColor={fieldPlaceholderColor}
                value={mealDraft.servingsLogged}
                onChangeText={setMealServingsLogged}
                keyboardType="numbers-and-punctuation"
              />
              {servingsLoggedError ? <Text style={styles.errorText}>{servingsLoggedError}</Text> : null}

              <Pressable
                style={[styles.primaryButton, !canAddSelectedMeal && styles.buttonDisabled]}
                disabled={!canAddSelectedMeal}
                onPress={addSelectedMealToLog}
              >
                <Text style={[styles.primaryButtonText, !canAddSelectedMeal && styles.buttonTextDisabled]}>Add Meal Entry</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Added Items</Text>
          <Text style={styles.sectionText}>
            Review what you&apos;ve added so far. Remove anything you don&apos;t want before finishing.
          </Text>

          {mealDraft.items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No items added yet</Text>
              <Text style={styles.emptyText}>
                Add an item or meal entry to see it here.
              </Text>
            </View>
          ) : (
            mealDraft.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSubtitle}>
                    {formatQuantityLabel(item.quantity, item.unit)}
                    {item.entryKind === "meal" && item.nestedItems?.length ? ` • ${item.nestedItems.length} item${item.nestedItems.length === 1 ? "" : "s"}` : ""}
                  </Text>
                </View>
                <Pressable style={styles.removeButton} onPress={() => removeMealItem(item.id)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Pressable
          style={[styles.doneButton, !canFinish && styles.buttonDisabled]}
          disabled={!canFinish}
          onPress={() =>
            router.push(
              `${"/meals/log-meal/review"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}` as Href
            )
          }
        >
          <Text style={[styles.primaryButtonText, !canFinish && styles.buttonTextDisabled]}>Done</Text>
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
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#86efac",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 14,
    color: "#d1d5db",
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#d1d5db",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  modeChip: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  modeChipSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  modeChipTextSelected: {
    color: "#166534",
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
  selectedHelperText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 19,
    marginTop: 8,
  },
  previewListCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
    padding: 12,
  },
  previewListTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  previewListText: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 8,
  },
  previewListItem: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    marginBottom: 4,
  },
  inlineFieldBlock: {
    marginTop: 14,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  itemTextWrap: {
    flex: 1,
    marginRight: 12,
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
  removeButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonText: {
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
