import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getData, type ProductResult } from "../src/lib/openFoodFacts";
import { colors } from "./lib/colors";
import { useMeals } from "./(tabs)/meals/meals-context";
import { buildOpenFoodFactsNutrition, buildScoreSummary, type NutritionInfo } from "./(tabs)/meals/nutrition";
import { useProfile } from "./context/profileContext";

type TabType = "serving" | "100g";
type ProductDetails = ProductResult["product"];

const normalizeParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default function Product() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    returnTo?: string | string[];
    finalReturnTo?: string | string[];
  }>();
  const { profile } = useProfile();
  const { addMealItem, mealDraft, setMealLogMode, setMealMethod, setMealType } = useMeals();

  const code = normalizeParam(params.code);
  const returnTo = normalizeParam(params.returnTo);
  const finalReturnTo = normalizeParam(params.finalReturnTo);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("serving");
  const [grams, setGrams] = useState("100");
  const [servings, setServings] = useState("1");
  const [logMessage, setLogMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!code) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getData(code);
      if (active) {
        setProduct(data ?? null);
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [code]);

  const details = product?.product;
  const amount = activeTab === "100g" ? grams : servings;
  const nutrition = useMemo(
    () => (details ? buildOpenFoodFactsNutrition(details, amount, activeTab === "100g" ? "g" : "serving") : null),
    [activeTab, amount, details]
  );
  const scoreSummary = useMemo(
    () =>
      nutrition
        ? buildScoreSummary(nutrition, {
            calories: profile.calories,
            protein: profile.protein,
            carbs: profile.carb,
            fat: profile.fat,
          })
        : null,
    [nutrition, profile.calories, profile.carb, profile.fat, profile.protein]
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  if (!details || !code) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>We couldn&apos;t load this Open Food Facts item.</Text>
      </View>
    );
  }

  const selectedAmountValid = Number(amount) > 0 || /\d/.test(amount);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.productName}>{details.product_name || "Unknown product"}</Text>
        <Text style={styles.brandName}>{details.brands ?? "Unknown brand"}</Text>
        <View style={styles.badgeRow}>
          {details.nutriscore_grade ? (
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Text style={styles.badgeNeutralText}>
                Nutri-score {details.nutriscore_grade.toUpperCase()}
              </Text>
            </View>
          ) : null}
          {details.nova_group ? (
            <View style={[styles.badge, styles.badgeWarning]}>
              <Text style={styles.badgeWarningText}>NOVA {details.nova_group}</Text>
            </View>
          ) : null}
          {details.serving_size ? (
            <View style={[styles.badge, styles.badgeSuccess]}>
              <Text style={styles.badgeSuccessText}>{details.serving_size}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Log this item</Text>
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, activeTab === "serving" && styles.tabActive]}
            onPress={() => setActiveTab("serving")}
          >
            <Text style={[styles.tabText, activeTab === "serving" && styles.tabTextActive]}>Per serving</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "100g" && styles.tabActive]}
            onPress={() => setActiveTab("100g")}
          >
            <Text style={[styles.tabText, activeTab === "100g" && styles.tabTextActive]}>Per 100g</Text>
          </Pressable>
        </View>

        <View style={styles.logInputRow}>
          <TextInput
            style={styles.logInput}
            keyboardType="numbers-and-punctuation"
            value={amount}
            onChangeText={activeTab === "100g" ? setGrams : setServings}
            placeholder={activeTab === "100g" ? "Enter grams" : "Enter servings"}
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.inputLabel}>{activeTab === "100g" ? "g" : "servings"}</Text>
        </View>

        <Text style={styles.logSummaryText}>
          {nutrition
            ? `${Math.round(nutrition.calories)} kcal • ${Math.round(nutrition.protein)}g protein • ${Math.round(nutrition.carbs)}g carbs • ${Math.round(nutrition.fat)}g fat`
            : "Nutrition is unavailable for the selected log mode."}
        </Text>

        {logMessage ? <Text style={styles.errorText}>{logMessage}</Text> : null}

        <Pressable
          style={[styles.logButton, (!selectedAmountValid || !nutrition) && styles.logButtonDisabled]}
          disabled={!selectedAmountValid || !nutrition}
          onPress={() => {
            if (!nutrition) {
              setLogMessage("This item does not have enough nutrition data to log in the selected mode.");
              return;
            }

            setLogMessage(null);
            setMealMethod("Barcode");
            if (!mealDraft.mealType) {
              setMealType("Snack");
            }
            setMealLogMode("single");
            addMealItem({
              name: details.product_name || "Scanned item",
              brand: details.brands ?? undefined,
              quantity: amount,
              unit: activeTab === "100g" ? "g" : "serving",
              entryKind: "single",
              sourceType: "off",
              offProductCode: code,
              nutrition,
            });

            const nextRoute = returnTo || "/meals/log-meal/review";
            const finalTarget = finalReturnTo || "/meals";
            const separator = nextRoute.includes("?") ? "&" : "?";
            const target = `${nextRoute}${separator}returnTo=${encodeURIComponent(finalTarget)}`;
            router.replace(target as Href);
          }}
        >
          <Text style={styles.logButtonText}>
            {activeTab === "100g" ? "Add to Meals by gram" : "Add to Meals by serving"}
          </Text>
        </Pressable>
      </View>

      {nutrition ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Estimated impact on today&apos;s score</Text>
          <Text style={styles.scoreValue}>{scoreSummary?.score ?? 0} / 100</Text>
          <Text style={styles.sectionText}>Approximate rating: {scoreSummary?.rating ?? 0}/5</Text>
          {(scoreSummary?.notes ?? []).slice(0, 3).map((note) => (
            <Text key={note} style={styles.sectionText}>• {note}</Text>
          ))}
        </View>
      ) : null}

      {details.additives_tags?.length || details.allergens_tags?.length || nutrition?.harmfulIngredientMatches.length ? (
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerCardTitle}>Ingredient flags</Text>
          {nutrition?.harmfulIngredientMatches.length ? (
            <Text style={styles.dangerCardText}>
              Harmful ingredient matches: {nutrition.harmfulIngredientMatches.join(", ")}
            </Text>
          ) : null}
          {details.additives_tags?.length ? (
            <Text style={styles.dangerCardText}>OFF additives: {details.additives_tags.length}</Text>
          ) : null}
          {details.allergens_tags?.length ? (
            <Text style={styles.dangerCardText}>OFF allergens: {details.allergens_tags.length}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Nutrient levels</Text>
        {[
          { label: "Fat", value: details.nutrient_levels?.fat },
          { label: "Saturated fat", value: details.nutrient_levels?.["saturated-fat"] },
          { label: "Sugars", value: details.nutrient_levels?.sugars },
          { label: "Salt", value: details.nutrient_levels?.salt },
        ].map((row) => (
          <View key={row.label} style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>{row.label}</Text>
            <Text style={styles.nutrientValue}>{row.value ?? "N/A"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Nutrients</Text>
        {[
          { label: "Calories", value: activeTab === "100g" ? details.nutriments["energy-kcal_100g"] : details.nutriments["energy-kcal_serving"], suffix: "kcal" },
          { label: "Protein", value: activeTab === "100g" ? details.nutriments.proteins_100g : details.nutriments.proteins_serving, suffix: "g" },
          { label: "Carbs", value: activeTab === "100g" ? details.nutriments.carbohydrates_100g : details.nutriments.carbohydrates_serving, suffix: "g" },
          { label: "Fat", value: activeTab === "100g" ? details.nutriments.fat_100g : details.nutriments.fat_serving, suffix: "g" },
          { label: "Sugar", value: activeTab === "100g" ? details.nutriments.sugars_100g : details.nutriments.sugars_serving, suffix: "g" },
          { label: "Fiber", value: activeTab === "100g" ? details.nutriments.fiber_100g : details.nutriments.fiber_serving, suffix: "g" },
          { label: "Salt", value: activeTab === "100g" ? details.nutriments.salt_100g : details.nutriments.salt_serving, suffix: "g" },
        ].map((row) => (
          <View key={row.label} style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>{row.label}</Text>
            <Text style={styles.nutrientValue}>{row.value != null ? `${row.value}${row.suffix}` : "N/A"}</Text>
          </View>
        ))}
      </View>

      {details.ingredients_text ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          <Text style={styles.ingredientsText}>{details.ingredients_text}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: colors.textMedium,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  dangerCard: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  dangerCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dangerText,
  },
  dangerCardText: {
    fontSize: 14,
    color: colors.dangerText,
    lineHeight: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
  },
  brandName: {
    fontSize: 15,
    color: colors.textMedium,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeNeutral: {
    backgroundColor: colors.background,
  },
  badgeNeutralText: {
    fontSize: 12,
    color: colors.textDark,
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
  },
  badgeSuccessText: {
    fontSize: 12,
    color: colors.successText,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
  },
  badgeWarningText: {
    fontSize: 12,
    color: colors.warningText,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    color: colors.textMedium,
  },
  tabTextActive: {
    color: colors.textDark,
    fontWeight: "700",
  },
  logInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textDark,
    backgroundColor: colors.background,
  },
  inputLabel: {
    color: colors.textMedium,
    minWidth: 58,
    textAlign: "right",
  },
  logSummaryText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 13,
    fontWeight: "600",
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logButtonDisabled: {
    opacity: 0.5,
  },
  logButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nutrientLabel: {
    color: colors.textDark,
    fontSize: 14,
  },
  nutrientValue: {
    color: colors.textMedium,
    fontSize: 14,
    fontWeight: "600",
  },
  ingredientsText: {
    color: colors.textMedium,
    lineHeight: 22,
    fontSize: 14,
  },
});
