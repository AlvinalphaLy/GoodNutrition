import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useRef, useState } from "react";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { fieldPlaceholderColor, formatQuantityLabel } from "../display";
import { commonUnits, type PresetFoodItem } from "../meals-data";
import { useMeals, type MealDraftItem } from "../meals-context";
import {
  adaptImportedNutrition,
  buildOpenFoodFactsNutrition,
  getOpenFoodFactsDefaultUnit,
  parseAmount,
} from "../nutrition";
import {
  getAmountError,
  getNamedItemError,
  isValidNamedItem,
  isValidPositiveAmount,
} from "../validation";
import {
  searchOpenFoodFactsPage,
  type OpenFoodFactsSearchProduct,
} from "../../../../src/lib/openFoodFacts";
import { lookupNutrition } from "../../../../src/features/voice-log/services/nutritionLookup";

type MealMatch =
  | { id: string; name: string; kind: "recipe"; subtitle: string }
  | { id: string; name: string; kind: "loggedMeal"; subtitle: string };

type SelectedFoodState = {
  id: string | null;
  name: string;
  source: "system" | "custom" | "off";
  isLibraryItem: boolean;
  brand?: string;
  offProduct?: OpenFoodFactsSearchProduct | null;
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

type CustomMealIngredient = Pick<MealDraftItem, "id" | "name" | "quantity" | "unit" | "brand" | "sourceType" | "offProductCode" | "nutrition">;

type AddedItemEditorState = {
  id: string;
  quantity: string;
  unit: string;
} | null;

type CustomMealItemEditorState = {
  id: string;
  quantity: string;
  unit: string;
} | null;

export default function AddFoodItemsScreen() {
  const router = useRouter();
  const { returnTo, fromBarcode } = useLocalSearchParams<{ returnTo?: string; fromBarcode?: string }>();
  const {
    mealDraft,
    presetFoods,
    customFoods,
    setMealLogMode,
    setMealMethod,
    setMealName,
    setMealServingsLogged,
    applyRecipeToMeal,
    applyLoggedMealToDraft,
    addMealItem,
    updateMealItem,
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
  const [addedItemEditor, setAddedItemEditor] = useState<AddedItemEditorState>(null);
  const [attemptedAddedItemSave, setAttemptedAddedItemSave] = useState(false);
  const [customMealItemEditor, setCustomMealItemEditor] = useState<CustomMealItemEditorState>(null);
  const [attemptedCustomMealItemSave, setAttemptedCustomMealItemSave] = useState(false);
  const [foodResults, setFoodResults] = useState<OpenFoodFactsSearchProduct[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [foodSearchLoadingMore, setFoodSearchLoadingMore] = useState(false);
  const reviewNavigationLockRef = useRef(false);
  const [foodSearchStatus, setFoodSearchStatus] = useState<string | null>(null);
  const [hasSearchedFoods, setHasSearchedFoods] = useState(false);
  const [foodResultsPage, setFoodResultsPage] = useState(1);
  const [foodResultsHasMore, setFoodResultsHasMore] = useState(false);
  const [foodResultsQuery, setFoodResultsQuery] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const backToMethodTarget = useMemo(() => {
    if (fromBarcode !== "1") return null;
    return `${"/meals/log-meal/method"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}` as Href;
  }, [fromBarcode, returnTo]);

  useFocusEffect(
    useCallback(() => {
      reviewNavigationLockRef.current = false;
    }, [])
  );

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
      if (meal.logMode !== "meal") return;

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

  const filteredPresetFoods = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return presetFoods.slice(0, 8);

    return presetFoods.filter((food) => {
      const haystack = [food.name, ...(food.aliases ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [foodSearch, presetFoods]);

  const filteredCustomFoods = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return customFoods.slice(0, 8);

    return customFoods.filter((food) => {
      const haystack = [food.name, ...(food.aliases ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [customFoods, foodSearch]);

  const exactPresetFoodMatchExists = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return false;

    return presetFoods.some((food) => {
      const names = [food.name, ...(food.aliases ?? [])].map((entry) => entry.toLowerCase());
      return names.includes(normalized);
    });
  }, [foodSearch, presetFoods]);

  const exactCustomFoodMatchExists = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return false;

    return customFoods.some((food) => {
      const names = [food.name, ...(food.aliases ?? [])].map((entry) => entry.toLowerCase());
      return names.includes(normalized);
    });
  }, [customFoods, foodSearch]);

  const exactOffFoodMatchExists = useMemo(() => {
    const normalized = foodSearch.trim().toLowerCase();
    if (!normalized) return false;

    return foodResults.some((food) => food.product_name.trim().toLowerCase() === normalized);
  }, [foodResults, foodSearch]);

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

  const selectedFoodNutrition = useMemo(() => {
    if (selectedFood?.source !== "off" || !selectedFood.offProduct) return null;

    return buildOpenFoodFactsNutrition(
      selectedFood.offProduct,
      quantity,
      unit.trim() || getOpenFoodFactsDefaultUnit(selectedFood.offProduct)
    );
  }, [quantity, selectedFood, unit]);

  const availableFoodUnits = selectedFood?.source === "off" ? (["serving", "g"] as const) : commonUnits;

  const canCreateCustomFood =
    !selectedFood &&
    foodSearch.trim().length > 0 &&
    isValidNamedItem(foodSearch.trim()) &&
    filteredPresetFoods.length === 0 &&
    filteredCustomFoods.length === 0 &&
    !exactPresetFoodMatchExists &&
    !exactCustomFoodMatchExists &&
    !exactOffFoodMatchExists;

  const canCreateCustomMeal =
    mealDraft.logMode === "meal" &&
    mealSearch.trim().length > 0 &&
    isValidNamedItem(mealSearch.trim()) &&
    mealMatches.length === 0 &&
    !exactMealMatchExists;

  const quantityIsValid = isValidPositiveAmount(quantity);
  const canAddItem = !!selectedFood?.name.trim() && quantityIsValid && (selectedFood?.source !== "off" || !!selectedFoodNutrition);
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
  const addedItemQuantityError = attemptedAddedItemSave && addedItemEditor
    ? getAmountError(addedItemEditor.quantity)
    : "";
  const canSaveAddedItemEdit = !!addedItemEditor && isValidPositiveAmount(addedItemEditor.quantity);
  const customMealItemQuantityError = attemptedCustomMealItemSave && customMealItemEditor
    ? getAmountError(customMealItemEditor.quantity)
    : "";
  const canSaveCustomMealItemEdit = !!customMealItemEditor && isValidPositiveAmount(customMealItemEditor.quantity);

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
    setFoodResults([]);
    setFoodSearchLoading(false);
    setFoodSearchStatus(null);
    setHasSearchedFoods(false);
    setLookingUp(false);
  };

  const cancelAddedItemEdit = () => {
    setAddedItemEditor(null);
    setAttemptedAddedItemSave(false);
  };

  const beginAddedItemEdit = (item: MealDraftItem) => {
    setAddedItemEditor({
      id: item.id,
      quantity: item.quantity,
      unit: item.unit,
    });
    setAttemptedAddedItemSave(false);
  };

  const saveAddedItemEdit = () => {
    setAttemptedAddedItemSave(true);
    if (!addedItemEditor || !canSaveAddedItemEdit) return;

    updateMealItem(addedItemEditor.id, {
      quantity: addedItemEditor.quantity.trim(),
      unit: addedItemEditor.unit.trim(),
    });
    cancelAddedItemEdit();
  };

  const cancelCustomMealItemEdit = () => {
    setCustomMealItemEditor(null);
    setAttemptedCustomMealItemSave(false);
  };

  const beginCustomMealItemEdit = (item: CustomMealIngredient) => {
    setCustomMealItemEditor({
      id: item.id,
      quantity: item.quantity,
      unit: item.unit,
    });
    setAttemptedCustomMealItemSave(false);
  };

  const saveCustomMealItemEdit = () => {
    setAttemptedCustomMealItemSave(true);
    if (!customMealItemEditor || !canSaveCustomMealItemEdit) return;

    setCustomMealItems((prev) =>
      prev.map((item) =>
        item.id === customMealItemEditor.id
          ? {
              ...item,
              quantity: customMealItemEditor.quantity.trim(),
              unit: customMealItemEditor.unit.trim(),
            }
          : item
      )
    );
    cancelCustomMealItemEdit();
  };

  const selectFood = (item: PresetFoodItem) => {
    setSelectedFood({
      id: item.id,
      name: item.name,
      source: item.source,
      isLibraryItem: true,
      offProduct: null,
    });
    setFoodSearch(item.name);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit(item.suggestedUnit ?? "");
    setCustomEditor(null);
    setAttemptedCustomSave(false);
  };

  const selectOffFood = (product: OpenFoodFactsSearchProduct) => {
    const normalizedName = product.product_name.trim();
    setSelectedFood({
      id: product.code,
      name: normalizedName,
      source: "off",
      isLibraryItem: false,
      brand: product.brands ?? undefined,
      offProduct: product,
    });
    setFoodSearch(normalizedName);
    setAttemptedAdd(false);
    setQuantity("");
    setUnit(getOpenFoodFactsDefaultUnit(product));
    setCustomEditor(null);
    setAttemptedCustomSave(false);
    setFoodSearchStatus(null);
  };

  const selectCustomFood = () => {
    const trimmedName = foodSearch.trim();
    setSelectedFood({
      id: null,
      name: trimmedName,
      source: "custom",
      isLibraryItem: false,
      offProduct: null,
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
    cancelCustomMealItemEdit();
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
      addMealItem({
        name: mealDraft.mealName.trim(),
        quantity: mealDraft.servingsLogged.trim() || "1",
        unit: "serving",
        entryKind: "meal",
        nestedItems: customMealItems.map((item) => ({ ...item })),
        mealSourceType: "custom",
        mealSourceId: null,
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
    setFoodResults([]);
    setFoodSearchLoading(false);
    setFoodSearchLoadingMore(false);
    setFoodSearchStatus(null);
    setHasSearchedFoods(false);
    setFoodResultsPage(1);
    setFoodResultsHasMore(false);
    setFoodResultsQuery("");
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

  const handleFoodSearch = async () => {
    const trimmedQuery = foodSearch.trim();

    if (trimmedQuery.length < 3) {
      setFoodResults([]);
      setHasSearchedFoods(false);
      setFoodResultsPage(1);
      setFoodResultsHasMore(false);
      setFoodResultsQuery("");
      setFoodSearchStatus("Enter at least 3 characters before searching Open Food Facts.");
      return;
    }

    setFoodSearchLoading(true);
    setFoodSearchStatus(null);
    setHasSearchedFoods(true);

    try {
      const resultPage = await searchOpenFoodFactsPage(trimmedQuery, 1, 8);
      setFoodResults(resultPage.products);
      setFoodResultsPage(resultPage.page);
      setFoodResultsHasMore(resultPage.hasMore);
      setFoodResultsQuery(trimmedQuery);

      if (resultPage.products.length === 0) {
        setFoodSearchStatus(
          filteredCustomFoods.length > 0
            ? "No Open Food Facts matches found. Matching custom items are shown below."
            : "No Open Food Facts matches found. You can create a custom item below."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("RATE_LIMIT:")) {
        const waitMs = Number(message.split(":")[1] ?? 0);
        const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
        setFoodSearchStatus(`Search limit reached. Wait about ${waitSeconds}s and try again.`);
      } else {
        setFoodSearchStatus("We couldn't reach Open Food Facts right now. Please try again.");
      }
      setFoodResults([]);
      setFoodResultsPage(1);
      setFoodResultsHasMore(false);
      setFoodResultsQuery("");
    } finally {
      setFoodSearchLoading(false);
    }
  };

  const handleLoadMoreFoods = async () => {
    if (!foodResultsHasMore || foodSearchLoadingMore || !foodResultsQuery) return;

    setFoodSearchLoadingMore(true);
    setFoodSearchStatus(null);
    try {
      const nextPage = foodResultsPage + 1;
      const resultPage = await searchOpenFoodFactsPage(foodResultsQuery, nextPage, 8);
      setFoodResults((prev) => {
        const seenCodes = new Set(prev.map((item) => item.code));
        const appended = resultPage.products.filter((item) => !seenCodes.has(item.code));
        return [...prev, ...appended];
      });
      setFoodResultsPage(resultPage.page);
      setFoodResultsHasMore(resultPage.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("RATE_LIMIT:")) {
        const waitMs = Number(message.split(":")[1] ?? 0);
        const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
        setFoodSearchStatus(`Search limit reached. Wait about ${waitSeconds}s and try again.`);
      } else {
        setFoodSearchStatus("We couldn't load more Open Food Facts results right now. Please try again.");
      }
    } finally {
      setFoodSearchLoadingMore(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: backToMethodTarget
            ? () => (
                <Pressable
                  onPress={() => router.replace(backToMethodTarget)}
                  accessibilityRole="button"
                  style={{ marginLeft: 4, paddingHorizontal: 8, paddingVertical: 6 }}
                >
                  <Ionicons name="chevron-back" size={26} color="#111827" />
                </Pressable>
              )
            : undefined,
        }}
      />
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
              Search for a saved meal. If it isn't found, create a new meal and add its items.
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
              Search Open Food Facts when you want nutrition data, or create and reuse your own custom items.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Search foods like salt, bread, or yogurt"
              placeholderTextColor={fieldPlaceholderColor}
              value={foodSearch}
              onChangeText={(value) => {
                setFoodSearch(value);
                setFoodResults([]);
                setHasSearchedFoods(false);
                setFoodSearchStatus(null);
                if (selectedFood && value.trim() !== selectedFood.name.trim()) {
                  setSelectedFood(null);
                  setQuantity("");
                  setUnit("");
                }
              }}
            />

            {!selectedFood?.name.trim() ? (
              <Pressable
                style={[styles.searchButton, foodSearchLoading && styles.buttonDisabled]}
                onPress={handleFoodSearch}
                disabled={foodSearchLoading}
              >
                {foodSearchLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.searchButtonText}>Search Open Food Facts</Text>}
              </Pressable>
            ) : null}

            {selectedFood?.name.trim() ? (
              <View style={styles.selectedCard}>
                <View style={styles.selectedHeaderRow}>
                  <View style={styles.selectedTextWrap}>
                    <Text style={styles.selectedLabel}>Selected food</Text>
                    <Text style={styles.selectedValue}>{selectedFood.name.trim()}</Text>
                    {selectedFood.brand ? <Text style={styles.selectedMeta}>{selectedFood.brand}</Text> : null}
                    {selectedFood.source === "off" && selectedFood.offProduct?.serving_size ? (
                      <Text style={styles.selectedMeta}>Serving size: {selectedFood.offProduct.serving_size}</Text>
                    ) : null}
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
                          const customItem = customFoods.find((item) => item.id === selectedFood.id);
                          if (customItem) startCustomEditor(customItem);
                        }}
                      >
                        <Text style={styles.inlineEditButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.inlineDeleteButton}
                        onPress={() => {
                          const customItem = customFoods.find((item) => item.id === selectedFood.id);
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
                <Text style={styles.resultsTitle}>Search results</Text>
                <Text style={styles.sectionText}>Use preset foods for quick logging, search Open Food Facts when you want broader product data, or reuse your custom items below.</Text>

                {foodSearchStatus ? <Text style={styles.helperText}>{foodSearchStatus}</Text> : null}

                {filteredPresetFoods.length > 0 ? (
                  <>
                    <Text style={styles.resultsSubtitle}>Preset foods</Text>
                    {filteredPresetFoods.map((food) => (
                      <View key={food.id} style={styles.resultRow}>
                        <Pressable style={styles.resultPressable} onPress={() => selectFood(food)}>
                          <View style={styles.resultTextWrap}>
                            <Text style={styles.resultTitle}>{food.name}</Text>
                            <Text style={styles.resultSubtitle}>Suggested unit: {food.suggestedUnit} • preset</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </Pressable>
                      </View>
                    ))}
                  </>
                ) : null}

                {hasSearchedFoods && !foodSearchLoading && foodResults.length > 0 ? (
                  <>
                    <Text style={styles.resultsSubtitle}>Open Food Facts results</Text>
                    {foodResults.map((food) => (
                      <View key={food.code} style={styles.resultRow}>
                        <Pressable style={styles.resultPressable} onPress={() => selectOffFood(food)}>
                          <View style={styles.resultTextWrap}>
                            <Text style={styles.resultTitle}>{food.product_name}</Text>
                            <Text style={styles.resultSubtitle}>
                              {food.brands ? `${food.brands} • ` : ""}
                              Default unit: {getOpenFoodFactsDefaultUnit(food)}
                              {food.serving_size ? ` • ${food.serving_size}` : ""}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </Pressable>
                      </View>
                    ))}
                    {foodResultsHasMore ? (
                      <Pressable
                        style={[styles.searchButton, foodSearchLoadingMore && styles.buttonDisabled]}
                        onPress={handleLoadMoreFoods}
                        disabled={foodSearchLoadingMore}
                      >
                        {foodSearchLoadingMore ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.searchButtonText}>Show More</Text>
                        )}
                      </Pressable>
                    ) : null}
                  </>
                ) : null}

                {filteredCustomFoods.length > 0 ? (
                  <>
                    <Text style={styles.resultsSubtitle}>Your custom items</Text>
                    {filteredCustomFoods.map((food) => (
                      <View key={food.id} style={styles.resultRow}>
                        <Pressable style={styles.resultPressable} onPress={() => selectFood(food)}>
                          <View style={styles.resultTextWrap}>
                            <Text style={styles.resultTitle}>{food.name}</Text>
                            <Text style={styles.resultSubtitle}>Suggested unit: {food.suggestedUnit} • custom</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </Pressable>
                      </View>
                    ))}
                  </>
                ) : null}

                {!foodSearchLoading && hasSearchedFoods && foodResults.length === 0 && filteredPresetFoods.length === 0 && filteredCustomFoods.length === 0 ? (
                  <View style={styles.emptyMatchCard}>
                    <Text style={styles.emptyMatchTitle}>No results found</Text>
                    <Text style={styles.emptyMatchText}>Create a custom item below if Open Food Facts doesn't have what you need.</Text>
                  </View>
                ) : null}

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
                {selectedFood?.source !== "off" ? (
                  <Pressable
                    style={[styles.unitChip, !unit && styles.unitChipSelected]}
                    onPress={() => setUnit("")}
                  >
                    <Text style={[styles.unitChipText, !unit && styles.unitChipTextSelected]}>No unit</Text>
                  </Pressable>
                ) : null}
                {availableFoodUnits.map((item) => {
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
              {selectedFood?.source === "off" ? (
                <Text style={styles.helperText}>Open Food Facts items support serving when that data exists, or grams for per-100g nutrition.</Text>
              ) : null}
              {selectedFood?.source === "off" && quantity.trim() && !selectedFoodNutrition ? (
                <Text style={styles.errorText}>This Open Food Facts result doesn't have enough nutrition for the selected unit. Try grams.</Text>
              ) : null}
            </View>

            <Pressable
              style={[styles.primaryButton, (!canAddItem || lookingUp) && styles.buttonDisabled]}
              disabled={!canAddItem || lookingUp}
              onPress={async () => {
                setAttemptedAdd(true);
                if (!canAddItem || !selectedFood) return;

                let normalizedName = selectedFood.name.trim();
                let normalizedUnit = unit.trim();
                let brand = selectedFood.brand;
                let sourceType: MealDraftItem["sourceType"] = "manual";
                let offProductCode: string | null | undefined;
                let nutrition: MealDraftItem["nutrition"] | null = null;

                if (selectedFood.source === "custom") {
                  const savedCustom = saveCustomFood(normalizedName, normalizedUnit || "serving");
                  normalizedName = savedCustom.name;
                  if (!normalizedUnit && savedCustom.source === "custom") {
                    normalizedUnit = savedCustom.suggestedUnit;
                  }
                }

                if (selectedFood.source === "off" && selectedFood.offProduct) {
                  normalizedUnit = normalizedUnit || getOpenFoodFactsDefaultUnit(selectedFood.offProduct);
                  nutrition = selectedFoodNutrition;
                  sourceType = "off";
                  offProductCode = selectedFood.offProduct.code;
                  brand = selectedFood.offProduct.brands ?? undefined;
                } else {
                  setLookingUp(true);
                  try {
                    const lookedUp = await lookupNutrition(
                      normalizedName,
                      parseAmount(quantity),
                      normalizedUnit || null
                    );
                    const adapted = adaptImportedNutrition(lookedUp);
                    nutrition = adapted;
                    if (!brand && adapted?.brand) {
                      brand = adapted.brand ?? undefined;
                    }
                  } finally {
                    setLookingUp(false);
                  }
                }

                if (customMealSelected) {
                  setCustomMealItems((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      name: normalizedName,
                      quantity: quantity.trim(),
                      unit: normalizedUnit,
                      brand,
                      sourceType,
                      offProductCode,
                      nutrition,
                    },
                  ]);
                } else {
                  if (selectedFood.source === "off") {
                    setMealMethod("Open Food Facts Search");
                  }

                  addMealItem({
                    name: normalizedName,
                    brand,
                    quantity: quantity.trim(),
                    unit: normalizedUnit,
                    entryKind: "single",
                    sourceType,
                    offProductCode,
                    nutrition,
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
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.itemTextWrap}>
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        <Text style={styles.itemSubtitle}>{formatQuantityLabel(item.quantity, item.unit)}</Text>
                      </View>

                      <View style={styles.itemActionRow}>
                        <Pressable
                          style={styles.itemEditButton}
                          onPress={() => beginCustomMealItemEdit(item)}
                        >
                          <Text style={styles.itemEditButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.itemRemoveButton}
                          onPress={() => {
                            if (customMealItemEditor?.id === item.id) {
                              cancelCustomMealItemEdit();
                            }
                            setCustomMealItems((prev) => prev.filter((entry) => entry.id !== item.id));
                          }}
                        >
                          <Text style={styles.itemRemoveButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>

                    {customMealItemEditor?.id === item.id ? (
                      <View style={styles.inlineItemEditor}>
                        <Text style={styles.editorLabel}>Quantity</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 1, 1/2, or 2"
                          placeholderTextColor={fieldPlaceholderColor}
                          value={customMealItemEditor.quantity}
                          onChangeText={(value) =>
                            setCustomMealItemEditor((prev) => (prev ? { ...prev, quantity: value } : prev))
                          }
                          keyboardType="numbers-and-punctuation"
                        />
                        {customMealItemQuantityError ? <Text style={styles.errorText}>{customMealItemQuantityError}</Text> : null}

                        <Text style={styles.editorLabel}>Unit</Text>
                        <View style={styles.unitChips}>
                          <Pressable
                            style={[styles.unitChip, !customMealItemEditor.unit && styles.unitChipSelected]}
                            onPress={() =>
                              setCustomMealItemEditor((prev) => (prev ? { ...prev, unit: "" } : prev))
                            }
                          >
                            <Text style={[styles.unitChipText, !customMealItemEditor.unit && styles.unitChipTextSelected]}>No unit</Text>
                          </Pressable>
                          {commonUnits.map((chipUnit) => {
                            const isSelected = customMealItemEditor.unit.trim().toLowerCase() === chipUnit.toLowerCase();
                            return (
                              <Pressable
                                key={`${item.id}-${chipUnit}`}
                                style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                                onPress={() =>
                                  setCustomMealItemEditor((prev) => (prev ? { ...prev, unit: chipUnit } : prev))
                                }
                              >
                                <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>{chipUnit}</Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <View style={styles.editorButtonRow}>
                          <Pressable style={styles.inlineEditButton} onPress={saveCustomMealItemEdit}>
                            <Text style={styles.inlineEditButtonText}>Save</Text>
                          </Pressable>
                          <Pressable style={styles.inlineDeleteButton} onPress={cancelCustomMealItemEdit}>
                            <Text style={styles.inlineDeleteButtonText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
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
            Review and edit what you've added so far. Remove anything you don't want before finishing.
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
                <View style={styles.itemHeaderRow}>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {formatQuantityLabel(item.quantity, item.unit)}
                      {item.entryKind === "meal" && item.nestedItems?.length ? ` • ${item.nestedItems.length} item${item.nestedItems.length === 1 ? "" : "s"}` : ""}
                    </Text>
                  </View>

                  <View style={styles.itemActionRow}>
                    <Pressable style={styles.itemEditButton} onPress={() => beginAddedItemEdit(item)}>
                      <Text style={styles.itemEditButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.itemRemoveButton}
                      onPress={() => {
                        if (addedItemEditor?.id === item.id) {
                          cancelAddedItemEdit();
                        }
                        removeMealItem(item.id);
                      }}
                    >
                      <Text style={styles.itemRemoveButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>

                {item.entryKind === "meal" && item.nestedItems?.length ? (
                  <View style={styles.nestedList}>
                    {item.nestedItems.map((nestedItem) => (
                      <Text key={nestedItem.id} style={styles.nestedItemText}>
                        • {nestedItem.name} — {formatQuantityLabel(nestedItem.quantity, nestedItem.unit)}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {addedItemEditor?.id === item.id ? (
                  <View style={styles.inlineItemEditor}>
                    <Text style={styles.editorLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1, 1/2, or 2"
                      placeholderTextColor={fieldPlaceholderColor}
                      value={addedItemEditor.quantity}
                      onChangeText={(value) =>
                        setAddedItemEditor((prev) => (prev ? { ...prev, quantity: value } : prev))
                      }
                      keyboardType="numbers-and-punctuation"
                    />
                    {addedItemQuantityError ? <Text style={styles.errorText}>{addedItemQuantityError}</Text> : null}

                    <Text style={styles.editorLabel}>Unit</Text>
                    <View style={styles.unitChips}>
                      <Pressable
                        style={[styles.unitChip, !addedItemEditor.unit && styles.unitChipSelected]}
                        onPress={() => setAddedItemEditor((prev) => (prev ? { ...prev, unit: "" } : prev))}
                      >
                        <Text style={[styles.unitChipText, !addedItemEditor.unit && styles.unitChipTextSelected]}>No unit</Text>
                      </Pressable>
                      {commonUnits.map((chipUnit) => {
                        const isSelected = addedItemEditor.unit.trim().toLowerCase() === chipUnit.toLowerCase();
                        return (
                          <Pressable
                            key={`${item.id}-${chipUnit}`}
                            style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                            onPress={() =>
                              setAddedItemEditor((prev) => (prev ? { ...prev, unit: chipUnit } : prev))
                            }
                          >
                            <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>{chipUnit}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.editorButtonRow}>
                      <Pressable style={styles.inlineEditButton} onPress={saveAddedItemEdit}>
                        <Text style={styles.inlineEditButtonText}>Save</Text>
                      </Pressable>
                      <Pressable style={styles.inlineDeleteButton} onPress={cancelAddedItemEdit}>
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
          style={[styles.doneButton, !canFinish && styles.buttonDisabled]}
          disabled={!canFinish}
          onPress={() => {
            if (!canFinish || reviewNavigationLockRef.current) return;
            reviewNavigationLockRef.current = true;
            const target = `${"/meals/log-meal/review"}${typeof returnTo === "string" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
            router.navigate(target as Href);
          }}
        >
          <Text style={[styles.primaryButtonText, !canFinish && styles.buttonTextDisabled]}>Done</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
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
  topActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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
  itemRemoveButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  searchButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  helperText: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  resultsSubtitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  selectedMeta: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
  },

  nestedList: {
    marginTop: -2,
    paddingLeft: 4,
  },
  nestedItemText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 19,
    marginBottom: 2,
  },
  inlineItemEditor: {
    marginTop: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
