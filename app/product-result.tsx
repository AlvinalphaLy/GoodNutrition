import { useLocalSearchParams } from "expo-router";
import { Text } from "@react-navigation/elements";
import {
  Pressable,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { useState, useEffect } from "react";

import getData, { ProductResult } from "./api/openFoodFacts";
import { colors } from "./lib/colors";

type ProductBrandProps = {
  productName: ProductResult["product"]["product_name"];
  productBrand: ProductResult["product"]["brands"];
  nutriScore: ProductResult["product"]["nutriscore_grade"];
  novaGroup: ProductResult["product"]["nova_group"];
};

type CaloriesProps = {
  caloriesPer100g: ProductResult["product"]["nutriments"]["energy-kcal_100g"];
  caloriesPerServing: ProductResult["product"]["nutriments"]["energy-kcal_serving"];
};

type NutrientLevelsProps = {
  nutrientLevels: ProductResult["product"]["nutrient_levels"];
};

type MacrosProps = {
  nutriments: ProductResult["product"]["nutriments"];
};

type AllergensProps = {
  allergensTags: ProductResult["product"]["allergens_tags"];
};

type IngredientsProps = {
  ingredientsText: ProductResult["product"]["ingredients_text"];
};

export default function Product() {
  const { code } = useLocalSearchParams();
  const [product, setProduct] = useState<ProductResult | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getData(code);
      if (data) {
        setProduct(data);
      }
    }
    load();
  }, [code]);

  if (!product) return <Text style={styles.loading}>Loading...</Text>;

  const { product: details } = product;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProductBrand
        productName={details.product_name}
        productBrand={details.brands}
        nutriScore={details.nutriscore_grade}
        novaGroup={details.nova_group}
      />
      <Calories
        caloriesPerServing={details.nutriments["energy-kcal_serving"]}
        caloriesPer100g={details.nutriments["energy-kcal_100g"]}
      />
      <NutrientLevels nutrientLevels={details.nutrient_levels} />
      <Macros nutriments={details.nutriments} />
      <Allergens allergensTags={details.allergens_tags} />
      <Ingredients ingredientsText={details.ingredients_text} />
      <LogProduct />
    </ScrollView>
  );
}

const ProductBrand = ({
  productName,
  productBrand,
  nutriScore,
  novaGroup,
}: ProductBrandProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.productName}>{productName}</Text>
      <Text style={styles.brandName}>{productBrand ?? "Unknown brand"}</Text>
      <View style={styles.badgeRow}>
        {nutriScore && (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={styles.badgeSuccessText}>
              Nutri-score {nutriScore.toUpperCase()}
            </Text>
          </View>
        )}
        {novaGroup && (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text style={styles.badgeWarningText}>NOVA {novaGroup}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const Calories = ({ caloriesPer100g, caloriesPerServing }: CaloriesProps) => {
  const [activeTab, setActiveTab] = useState<"100g" | "serving">("100g");

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Calories</Text>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === "100g" && styles.tabActive]}
          onPress={() => setActiveTab("100g")}
        >
          <Text style={[styles.tabText, activeTab === "100g" && styles.tabTextActive]}>
            Per 100g
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "serving" && styles.tabActive]}
          onPress={() => setActiveTab("serving")}
        >
          <Text style={[styles.tabText, activeTab === "serving" && styles.tabTextActive]}>
            Per serving
          </Text>
        </Pressable>
      </View>
      <View style={styles.calItem}>
        <Text style={styles.calNumber}>
          {activeTab === "100g"
            ? (caloriesPer100g ?? "N/A")
            : (caloriesPerServing ?? "N/A")}
        </Text>
        <Text style={styles.calLabel}>
          {activeTab === "100g" ? "kcal / 100g" : "kcal / serving"}
        </Text>
      </View>
    </View>
  );
};

const levelStyle = (level: string | null | undefined) => {
  if (level === "high")
    return { badge: styles.badgeDanger, text: styles.badgeDangerText };
  if (level === "moderate")
    return { badge: styles.badgeWarning, text: styles.badgeWarningText };
  if (level === "low")
    return { badge: styles.badgeSuccess, text: styles.badgeSuccessText };
  return { badge: styles.badgeNeutral, text: styles.badgeNeutralText };
};

const NutrientLevels = ({ nutrientLevels }: NutrientLevelsProps) => {
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Fat", value: nutrientLevels?.fat },
    { label: "Saturated fat", value: nutrientLevels?.["saturated-fat"] },
    { label: "Sugars", value: nutrientLevels?.sugars },
    { label: "Salt", value: nutrientLevels?.salt },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Nutrient levels</Text>
      {rows.map(({ label, value }) => {
        const { badge, text } = levelStyle(value);
        return (
          <View key={label} style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>{label}</Text>
            <View style={[styles.badge, badge]}>
              <Text style={text}>{value ?? "N/A"}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const Macros = ({ nutriments }: MacrosProps) => {
  const rows = [
    { label: "Proteins", per100g: nutriments.proteins_100g, perServing: nutriments.proteins_serving },
    { label: "Carbohydrates", per100g: nutriments.carbohydrates_100g, perServing: nutriments.carbohydrates_serving },
    { label: "Fat", per100g: nutriments.fat_100g, perServing: nutriments.fat_serving },
    { label: "Fiber", per100g: nutriments.fiber_100g, perServing: nutriments.fiber_serving },
    { label: "Salt", per100g: nutriments.salt_100g, perServing: nutriments.salt_serving },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Nutrients per 100g</Text>
      <View style={styles.macroHeaderRow}>
        <Text style={[styles.macroCell, { flex: 2 }]} />
        <Text style={styles.macroHeaderCell}>100g</Text>
        <Text style={styles.macroHeaderCell}>Serving</Text>
      </View>
      {rows.map(({ label, per100g, perServing }) => (
        <View key={label} style={styles.macroRow}>
          <Text style={[styles.macroCell, { flex: 2 }]}>{label}</Text>
          <Text style={styles.macroValueCell}>
            {per100g != null ? `${per100g}g` : "N/A"}
          </Text>
          <Text style={styles.macroValueCell}>
            {perServing != null ? `${perServing}g` : "N/A"}
          </Text>
        </View>
      ))}
    </View>
  );
};

const Allergens = ({ allergensTags }: AllergensProps) => {
  if (!allergensTags || allergensTags.length === 0) return null;

  return (
    <View style={[styles.card, styles.dangerCard]}>
      <Text style={styles.dangerCardTitle}>Allergens</Text>
      <View style={styles.tagRow}>
        {allergensTags.map((tag) => (
          <View key={tag} style={[styles.badge, styles.badgeDanger]}>
            <Text style={styles.badgeDangerText}>{tag.replace("en:", "")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const Ingredients = ({ ingredientsText }: IngredientsProps) => {
  if (!ingredientsText) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Ingredients</Text>
      <Text style={styles.ingredientsText}>{ingredientsText}</Text>
    </View>
  );
};

const LogProduct = () => {
  const [activeTab, setActiveTab] = useState<"grams" | "servings">("grams");

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Log product</Text>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === "grams" && styles.tabActive]}
          onPress={() => setActiveTab("grams")}
        >
          <Text style={[styles.tabText, activeTab === "grams" && styles.tabTextActive]}>
            Grams
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "servings" && styles.tabActive]}
          onPress={() => setActiveTab("servings")}
        >
          <Text style={[styles.tabText, activeTab === "servings" && styles.tabTextActive]}>
            Servings
          </Text>
        </Pressable>
      </View>
      <View style={styles.logInputRow}>
        <TextInput
          style={styles.logInput}
          keyboardType="numeric"
          placeholder={activeTab === "grams" ? "Enter grams" : "Enter servings"}
          placeholderTextColor={colors.textLight}
        />
        <Pressable style={styles.logButton}>
          <Text style={styles.logButtonText}>Log</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  loading: {
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  dangerCardTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.dangerText,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textDark,
  },
  brandName: {
    fontSize: 12,
    color: colors.textMedium,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeSuccess: { backgroundColor: colors.successLight },
  badgeSuccessText: { fontSize: 11, color: colors.successText },
  badgeWarning: { backgroundColor: colors.warningLight },
  badgeWarningText: { fontSize: 11, color: colors.warningText },
  badgeDanger: { backgroundColor: colors.dangerLight },
  badgeDangerText: { fontSize: 11, color: colors.dangerText },
  badgeNeutral: { backgroundColor: colors.background },
  badgeNeutralText: { fontSize: 11, color: colors.textMedium },
  sectionLabel: {
    fontSize: 11,
    color: colors.textMedium,
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 3,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMedium,
  },
  tabTextActive: {
    color: colors.textDark,
    fontWeight: "500",
  },
  calItem: {
    alignItems: "center",
    paddingVertical: 4,
  },
  calNumber: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.textDark,
  },
  calLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  nutrientLabel: {
    fontSize: 12,
    color: colors.textDark,
  },
  macroHeaderRow: {
    flexDirection: "row",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  macroRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  macroCell: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
  },
  macroHeaderCell: {
    flex: 1,
    fontSize: 10,
    color: colors.textLight,
    textAlign: "right",
  },
  macroValueCell: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
    textAlign: "right",
  },
  ingredientsText: {
    fontSize: 12,
    color: colors.textMedium,
    lineHeight: 18,
  },
  logInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  logInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textDark,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  logButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
});
