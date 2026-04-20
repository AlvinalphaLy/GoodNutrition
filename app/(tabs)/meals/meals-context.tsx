import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { presetFoodItems, type PresetFoodItem } from "./meals-data";

type NestedMealItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type MealDraftItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  entryKind?: "single" | "meal";
  nestedItems?: NestedMealItem[];
  mealSourceType?: MealSourceType;
  mealSourceId?: string | null;
};

type MealLogMode = "single" | "meal";
type MealSourceType = "none" | "recipe" | "loggedMeal" | "custom";

export type LoggedMeal = {
  id: string;
  mealType: string;
  method: string;
  logMode: MealLogMode;
  mealName: string;
  items: MealDraftItem[];
  loggedAt: string;
  servingsLogged: string;
  mealSourceType: MealSourceType;
  mealSourceId: string | null;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  brand?: string;
  notes?: string;
  source: "search" | "custom";
};

export type SavedRecipe = {
  id: string;
  name: string;
  servings: string;
  ingredients: RecipeIngredient[];
  caloriesPerServing: string;
  macrosPerServing: string;
  summary: string;
};

type PendingRecipeIngredient = {
  name: string;
  brand?: string;
  notes?: string;
  source: "search" | "custom";
} | null;

type MealDraft = {
  mealType: string;
  method: string;
  logMode: MealLogMode;
  mealName: string;
  items: MealDraftItem[];
  servingsLogged: string;
  mealSourceType: MealSourceType;
  mealSourceId: string | null;
};

type RecipeDraft = {
  name: string;
  servings: string;
  ingredients: RecipeIngredient[];
};

type MealsContextValue = {
  mealDraft: MealDraft;
  recipeDraft: RecipeDraft;
  pendingRecipeIngredient: PendingRecipeIngredient;
  loggedMeals: LoggedMeal[];
  savedRecipes: SavedRecipe[];
  presetFoods: PresetFoodItem[];
  customFoods: PresetFoodItem[];
  editingLoggedMealId: string | null;
  editingRecipeId: string | null;
  setMealType: (mealType: string) => void;
  setMealMethod: (method: string) => void;
  setMealLogMode: (mode: MealLogMode) => void;
  setMealName: (name: string) => void;
  setMealServingsLogged: (value: string) => void;
  beginNewMealDraft: () => void;
  startEditingLoggedMeal: (id: string) => void;
  applyRecipeToMeal: (recipeId: string) => void;
  applyLoggedMealToDraft: (loggedMealId: string) => void;
  addMealItem: (item: Omit<MealDraftItem, "id">) => void;
  removeMealItem: (id: string) => void;
  saveCustomFood: (name: string, suggestedUnit?: string) => PresetFoodItem;
  updateCustomFood: (id: string, name: string, suggestedUnit: string) => void;
  removeCustomFood: (id: string) => void;
  deleteLoggedMeal: (id: string) => void;
  finishMealLogging: () => void;
  beginNewRecipeDraft: () => void;
  startRecipeDraft: (name: string, servings: string) => void;
  startEditingRecipe: (id: string) => void;
  deleteRecipe: (id: string) => void;
  setPendingRecipeIngredient: (ingredient: PendingRecipeIngredient) => void;
  addRecipeIngredient: (ingredient: Omit<RecipeIngredient, "id">) => void;
  updateRecipeIngredient: (id: string, updates: Partial<Pick<RecipeIngredient, "quantity" | "unit" | "name">>) => void;
  removeRecipeIngredient: (id: string) => void;
  saveRecipeDraft: () => void;
};

const MealsContext = createContext<MealsContextValue | undefined>(undefined);

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const emptyMealDraft: MealDraft = {
  mealType: "",
  method: "",
  logMode: "single",
  mealName: "",
  items: [],
  servingsLogged: "1",
  mealSourceType: "none",
  mealSourceId: null,
};

const emptyRecipeDraft: RecipeDraft = {
  name: "",
  servings: "",
  ingredients: [],
};

const cloneNestedMealItems = (items?: NestedMealItem[]) =>
  items?.map((item) => ({ ...item })) ?? [];

const cloneMealItems = (items: MealDraftItem[]) =>
  items.map((item) => ({
    ...item,
    nestedItems: cloneNestedMealItems(item.nestedItems),
  }));

const cloneRecipeIngredients = (ingredients: RecipeIngredient[]) =>
  ingredients.map((ingredient) => ({ ...ingredient }));

const normalizeEntryName = (value: string) => value.trim().toLowerCase();

const buildRecipeSummary = (ingredientCount: number) => ({
  caloriesPerServing: `${320 + ingredientCount * 45} kcal`,
  macrosPerServing: `${18 + ingredientCount * 4}g protein • ${22 + ingredientCount * 5}g carbs • ${7 + ingredientCount * 2}g fat`,
  summary: `${ingredientCount} ingredient${ingredientCount === 1 ? "" : "s"} in this UI-only recipe draft.`,
});

const initialSavedRecipes: SavedRecipe[] = [
  {
    id: "recipe-1",
    name: "High Protein Oatmeal",
    servings: "2",
    caloriesPerServing: "390 kcal",
    macrosPerServing: "28g protein • 47g carbs • 9g fat",
    summary: "A balanced breakfast bowl with oats, yogurt, and berries.",
    ingredients: [
      { id: "recipe-1-1", name: "Rolled oats", quantity: "1", unit: "cup", source: "search" },
      { id: "recipe-1-2", name: "Greek yogurt", quantity: "1", unit: "cup", source: "search" },
      { id: "recipe-1-3", name: "Blueberries", quantity: "1/2", unit: "cup", source: "search" },
    ],
  },
  {
    id: "recipe-2",
    name: "Chicken Rice Bowl",
    servings: "1",
    caloriesPerServing: "520 kcal",
    macrosPerServing: "41g protein • 49g carbs • 14g fat",
    summary: "Simple bowl with lean protein, rice, and veggies.",
    ingredients: [
      { id: "recipe-2-1", name: "Chicken breast", quantity: "1", unit: "serving", source: "search" },
      { id: "recipe-2-2", name: "White rice", quantity: "1", unit: "cup", source: "search" },
      { id: "recipe-2-3", name: "Bell pepper", quantity: "1/2", unit: "cup", source: "search" },
    ],
  },
  {
    id: "recipe-3",
    name: "Greek Yogurt Fruit Bowl",
    servings: "1",
    caloriesPerServing: "310 kcal",
    macrosPerServing: "23g protein • 36g carbs • 7g fat",
    summary: "Quick snack recipe with yogurt, fruit, and granola.",
    ingredients: [
      { id: "recipe-3-1", name: "Greek yogurt", quantity: "1", unit: "serving", source: "search" },
      { id: "recipe-3-2", name: "Strawberries", quantity: "1/2", unit: "cup", source: "search" },
      { id: "recipe-3-3", name: "Granola", quantity: "1/4", unit: "cup", source: "search" },
    ],
  },
];

export function MealsProvider({ children }: PropsWithChildren) {
  const [mealDraft, setMealDraft] = useState<MealDraft>(emptyMealDraft);
  const [recipeDraft, setRecipeDraft] = useState<RecipeDraft>(emptyRecipeDraft);
  const [pendingRecipeIngredient, setPendingRecipeIngredient] = useState<PendingRecipeIngredient>(null);
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(initialSavedRecipes);
  const [customFoods, setCustomFoods] = useState<PresetFoodItem[]>([]);
  const [editingLoggedMealId, setEditingLoggedMealId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  const beginNewMealDraft = useCallback(() => {
    setEditingLoggedMealId(null);
    setMealDraft(emptyMealDraft);
  }, []);

  const setMealType = useCallback((mealType: string) => {
    setMealDraft((prev) => ({ ...prev, mealType }));
  }, []);

  const setMealMethod = useCallback((method: string) => {
    setMealDraft((prev) => ({ ...prev, method }));
  }, []);

  const setMealLogMode = useCallback((logMode: MealLogMode) => {
    setMealDraft((prev) => ({
      ...prev,
      logMode,
      servingsLogged: prev.servingsLogged || "1",
    }));
  }, []);

  const setMealName = useCallback((mealName: string) => {
    const trimmed = mealName.trim();
    setMealDraft((prev) => ({
      ...prev,
      mealName: mealName.trimStart(),
      mealSourceType: trimmed ? "custom" : "none",
      mealSourceId: null,
      servingsLogged: prev.servingsLogged || "1",
    }));
  }, []);

  const setMealServingsLogged = useCallback((value: string) => {
    setMealDraft((prev) => ({ ...prev, servingsLogged: value.trimStart() }));
  }, []);

  const startEditingLoggedMeal = useCallback(
    (id: string) => {
      const meal = loggedMeals.find((entry) => entry.id === id);
      if (!meal) return;

      setEditingLoggedMealId(id);
      setMealDraft({
        mealType: meal.mealType,
        method: meal.method,
        logMode: meal.logMode,
        mealName: meal.mealName,
        items: cloneMealItems(meal.items),
        servingsLogged: meal.servingsLogged || "1",
        mealSourceType: meal.mealSourceType || (meal.logMode === "meal" ? "custom" : "none"),
        mealSourceId: meal.mealSourceId ?? null,
      });
    },
    [loggedMeals]
  );

  const applyRecipeToMeal = useCallback(
    (recipeId: string) => {
      const recipe = savedRecipes.find((entry) => entry.id === recipeId);
      if (!recipe) return;

      setMealDraft((prev) => ({
        ...prev,
        logMode: "meal",
        mealName: recipe.name,
        servingsLogged: recipe.servings || prev.servingsLogged || "1",
        mealSourceType: "recipe",
        mealSourceId: recipe.id,
      }));
    },
    [savedRecipes]
  );

  const applyLoggedMealToDraft = useCallback(
    (loggedMealId: string) => {
      const existingMeal = loggedMeals.find((entry) => entry.id === loggedMealId);
      if (!existingMeal) return;

      setMealDraft((prev) => ({
        ...prev,
        logMode: "meal",
        mealName: existingMeal.mealName,
        servingsLogged: existingMeal.servingsLogged || prev.servingsLogged || "1",
        mealSourceType: "loggedMeal",
        mealSourceId: existingMeal.id,
      }));
    },
    [loggedMeals]
  );

  const addMealItem = useCallback((item: Omit<MealDraftItem, "id">) => {
    setMealDraft((prev) => ({
      ...prev,
      items: [...prev.items, { ...item, id: createId(), entryKind: item.entryKind ?? "single" }],
    }));
  }, []);

  const removeMealItem = useCallback((id: string) => {
    setMealDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const saveCustomFood = useCallback((name: string, suggestedUnit = "serving") => {
    const trimmedName = name.trim();
    const normalizedName = normalizeEntryName(trimmedName);

    const existingCustom = customFoods.find((item) => normalizeEntryName(item.name) === normalizedName);
    if (existingCustom) {
      const updatedItem = {
        ...existingCustom,
        suggestedUnit: suggestedUnit.trim() || existingCustom.suggestedUnit || "serving",
      };
      setCustomFoods((current) =>
        current.map((item) => (item.id === existingCustom.id ? updatedItem : item))
      );
      return updatedItem;
    }

    const existingSystem = presetFoodItems.find((item) => normalizeEntryName(item.name) === normalizedName);
    if (existingSystem) {
      return existingSystem;
    }

    const newItem: PresetFoodItem = {
      id: createId(),
      name: trimmedName,
      suggestedUnit: suggestedUnit.trim() || "serving",
      source: "custom",
    };

    setCustomFoods((current) => [newItem, ...current]);
    return newItem;
  }, [customFoods]);

  const updateCustomFood = useCallback((id: string, name: string, suggestedUnit: string) => {
    const trimmedName = name.trim();
    const trimmedUnit = suggestedUnit.trim() || "serving";
    const existingCustom = customFoods.find((item) => item.id === id);
    if (!trimmedName || !existingCustom) return;

    setCustomFoods((current) =>
      current.map((item) =>
        item.id === id ? { ...item, name: trimmedName, suggestedUnit: trimmedUnit } : item
      )
    );

    setMealDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        name: normalizeEntryName(item.name) === normalizeEntryName(existingCustom.name)
          ? trimmedName
          : item.name,
        unit: normalizeEntryName(item.name) === normalizeEntryName(existingCustom.name) && !item.unit
          ? trimmedUnit
          : item.unit,
        nestedItems: item.nestedItems?.map((nestedItem) =>
          normalizeEntryName(nestedItem.name) === normalizeEntryName(existingCustom.name)
            ? { ...nestedItem, name: trimmedName, unit: nestedItem.unit || trimmedUnit }
            : nestedItem
        ),
      })),
    }));

    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient) =>
        normalizeEntryName(ingredient.name) === normalizeEntryName(existingCustom.name)
          ? { ...ingredient, name: trimmedName, unit: ingredient.unit || trimmedUnit }
          : ingredient
      ),
    }));
  }, [customFoods]);

  const removeCustomFood = useCallback((id: string) => {
    const customItem = customFoods.find((item) => item.id === id);
    setCustomFoods((current) => current.filter((item) => item.id !== id));

    if (!customItem) return;

    setMealDraft((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => normalizeEntryName(item.name) !== normalizeEntryName(customItem.name))
        .map((item) => ({
          ...item,
          nestedItems: item.nestedItems?.filter(
            (nestedItem) => normalizeEntryName(nestedItem.name) !== normalizeEntryName(customItem.name)
          ),
        })),
    }));

    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter(
        (ingredient) => normalizeEntryName(ingredient.name) !== normalizeEntryName(customItem.name)
      ),
    }));
  }, [customFoods]);

  const deleteLoggedMeal = useCallback(
    (id: string) => {
      setLoggedMeals((current) => current.filter((meal) => meal.id !== id));

      if (editingLoggedMealId === id) {
        setEditingLoggedMealId(null);
        setMealDraft(emptyMealDraft);
      }
    },
    [editingLoggedMealId]
  );

  const finishMealLogging = useCallback(() => {
    if (mealDraft.items.length === 0) return;

    const existingMeal = editingLoggedMealId
      ? loggedMeals.find((meal) => meal.id === editingLoggedMealId)
      : undefined;

    const fallbackSingleName = mealDraft.items.length === 1 ? mealDraft.items[0]?.name ?? "Item Entry" : `${mealDraft.mealType || "Meal"} Log`;
    const normalizedMealName = mealDraft.mealName.trim() || existingMeal?.mealName || fallbackSingleName;

    const normalizedMeal: LoggedMeal = {
      id: editingLoggedMealId ?? createId(),
      mealType: mealDraft.mealType || "Meal",
      method: mealDraft.method || "Manual Search",
      logMode: mealDraft.logMode,
      mealName: normalizedMealName,
      items: cloneMealItems(mealDraft.items),
      loggedAt: existingMeal?.loggedAt ?? new Date().toISOString(),
      servingsLogged: mealDraft.logMode === "meal" ? mealDraft.servingsLogged.trim() || existingMeal?.servingsLogged || "1" : "1",
      mealSourceType: mealDraft.logMode === "meal" ? mealDraft.mealSourceType : "none",
      mealSourceId: mealDraft.logMode === "meal" ? mealDraft.mealSourceId : null,
    };

    setLoggedMeals((current) => {
      if (!editingLoggedMealId) {
        return [normalizedMeal, ...current];
      }

      return current.map((meal) =>
        meal.id === editingLoggedMealId ? normalizedMeal : meal
      );
    });

    setEditingLoggedMealId(null);
    setMealDraft(emptyMealDraft);
  }, [editingLoggedMealId, loggedMeals, mealDraft]);

  const beginNewRecipeDraft = useCallback(() => {
    setEditingRecipeId(null);
    setPendingRecipeIngredient(null);
    setRecipeDraft(emptyRecipeDraft);
  }, []);

  const startRecipeDraft = useCallback((name: string, servings: string) => {
    setRecipeDraft((prev) => ({
      ...prev,
      name: name.trim(),
      servings: servings.trim(),
    }));
  }, []);

  const startEditingRecipe = useCallback(
    (id: string) => {
      const recipe = savedRecipes.find((entry) => entry.id === id);
      if (!recipe) return;

      setEditingRecipeId(id);
      setPendingRecipeIngredient(null);
      setRecipeDraft({
        name: recipe.name,
        servings: recipe.servings,
        ingredients: cloneRecipeIngredients(recipe.ingredients),
      });
    },
    [savedRecipes]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      setSavedRecipes((current) => current.filter((recipe) => recipe.id !== id));

      if (editingRecipeId === id) {
        setEditingRecipeId(null);
        setPendingRecipeIngredient(null);
        setRecipeDraft(emptyRecipeDraft);
      }
    },
    [editingRecipeId]
  );

  const addRecipeIngredient = useCallback((ingredient: Omit<RecipeIngredient, "id">) => {
    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...ingredient, id: createId() }],
    }));
    setPendingRecipeIngredient(null);
  }, []);

  const updateRecipeIngredient = useCallback((id: string, updates: Partial<Pick<RecipeIngredient, "quantity" | "unit" | "name">>) => {
    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...updates } : ingredient
      ),
    }));
  }, []);

  const removeRecipeIngredient = useCallback((id: string) => {
    setRecipeDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ingredient) => ingredient.id !== id),
    }));
  }, []);

  const saveRecipeDraft = useCallback(() => {
    if (!recipeDraft.name.trim() || recipeDraft.ingredients.length === 0) return;

    const normalizedRecipe: SavedRecipe = {
      id: editingRecipeId ?? createId(),
      name: recipeDraft.name.trim(),
      servings: recipeDraft.servings.trim() || "1",
      ingredients: cloneRecipeIngredients(recipeDraft.ingredients),
      ...buildRecipeSummary(recipeDraft.ingredients.length),
    };

    setSavedRecipes((current) => {
      if (!editingRecipeId) {
        return [normalizedRecipe, ...current];
      }

      return current.map((recipe) =>
        recipe.id === editingRecipeId ? normalizedRecipe : recipe
      );
    });

    setEditingRecipeId(null);
    setPendingRecipeIngredient(null);
    setRecipeDraft(emptyRecipeDraft);
  }, [editingRecipeId, recipeDraft]);

  const availableFoods = useMemo(() => [...customFoods, ...presetFoodItems], [customFoods]);

  const value = useMemo(
    () => ({
      mealDraft,
      recipeDraft,
      pendingRecipeIngredient,
      loggedMeals,
      savedRecipes,
      presetFoods: availableFoods,
      customFoods,
      editingLoggedMealId,
      editingRecipeId,
      setMealType,
      setMealMethod,
      setMealLogMode,
      setMealName,
      setMealServingsLogged,
      beginNewMealDraft,
      startEditingLoggedMeal,
      applyRecipeToMeal,
      applyLoggedMealToDraft,
      addMealItem,
      removeMealItem,
      saveCustomFood,
      updateCustomFood,
      removeCustomFood,
      deleteLoggedMeal,
      finishMealLogging,
      beginNewRecipeDraft,
      startRecipeDraft,
      startEditingRecipe,
      deleteRecipe,
      setPendingRecipeIngredient,
      addRecipeIngredient,
      updateRecipeIngredient,
      removeRecipeIngredient,
      saveRecipeDraft,
    }),
    [
      mealDraft,
      recipeDraft,
      pendingRecipeIngredient,
      loggedMeals,
      savedRecipes,
      availableFoods,
      customFoods,
      editingLoggedMealId,
      editingRecipeId,
      setMealType,
      setMealMethod,
      setMealLogMode,
      setMealName,
      setMealServingsLogged,
      beginNewMealDraft,
      startEditingLoggedMeal,
      applyRecipeToMeal,
      applyLoggedMealToDraft,
      addMealItem,
      removeMealItem,
      saveCustomFood,
      updateCustomFood,
      removeCustomFood,
      deleteLoggedMeal,
      finishMealLogging,
      beginNewRecipeDraft,
      startRecipeDraft,
      startEditingRecipe,
      deleteRecipe,
      addRecipeIngredient,
      updateRecipeIngredient,
      removeRecipeIngredient,
      saveRecipeDraft,
    ]
  );

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const context = useContext(MealsContext);

  if (!context) {
    throw new Error("useMeals must be used within a MealsProvider");
  }

  return context;
}
