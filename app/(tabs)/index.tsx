import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useProfile } from "../context/profileContext";

import { colors } from "../lib/colors";

const TAG_COLORS: Record<TagProps["variant"], { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.successText },
  warning: { bg: colors.warningLight, text: colors.warningText },
  danger: { bg: colors.dangerLight, text: colors.dangerText },
};

type MealCardProps = {
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
  calories: number;
  time: string;
  macros: { protein: number; carbs: number; fats: number };
  tags: { label: string; variant: "success" | "warning" | "danger" }[];
};

type TagProps = {
  label: string;
  variant: "success" | "warning" | "danger";
};

type CaloriesProps = {
  current: number;
  goal: number;
};

type MacroProps = {
  nutrient: "Protein" | "Carbs" | "Fats";
  current: number;
  goal: number;
};

type LogButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  path: string;
};

type ProfileData = {
  weight: number;
  height: number;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

type SummaryProps = {
  profile: ProfileData;
};

export default function Index() {
  const { profile } = useProfile();
  // console.log(profile);
  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20 }}>
      <Summary profile={profile} />
      <LogMeal />
      <Meals />
    </ScrollView>
  );
}

const Summary = ({ profile }: SummaryProps) => (
  <View>
    <Text style={styles.header}>Today&apos;s Summary</Text>
    <View>
      <View style={styles.subContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <Calories current={1500} goal={profile.calories} />
          <Macros profile={profile} />
          <Score rate={2} />
        </View>
        <Separator />
        <HarmfulIngredientsSummary count={2} />
      </View>
    </View>
  </View>
);

const HarmfulIngredientsSummary = ({ count }: { count: number }) => (
  <Pressable style={styles.harmfulRow} onPress={() => console.log("pressed")}>
    <Text style={styles.harmfulText}>{count} harmful ingredients detected</Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textMedium} />
  </Pressable>
);

const Score = ({ rate }: { rate: number }) => (
  <View>
    <Text style={[styles.subHeader, { marginLeft: 3 }]}>SCORE</Text>
    <View style={styles.circle}>
      <Text style={styles.circleText}>{rate}/5</Text>
    </View>
  </View>
);

const Calories = ({ current, goal }: CaloriesProps) => (
  <View>
    <Text style={styles.subHeader}>CALORIES</Text>
    <Text style={styles.caloriesNumber}>{current}</Text>
    <Text> / {goal}</Text>
  </View>
);

const Macros = ({ profile }: SummaryProps) => (
  <View>
    <Text style={styles.subHeader}>MACROS</Text>
    <View style={styles.macrosContainer}>
      <MacroNutrient nutrient="Protein" current={120} goal={profile.protein} />
      <MacroNutrient nutrient="Carbs" current={150} goal={profile.carb} />
      <MacroNutrient nutrient="Fats" current={44} goal={profile.fat} />
    </View>
  </View>
);

const MacroNutrient = ({ nutrient, current, goal }: MacroProps) => (
  <Text>
    {nutrient}: <Text style={styles.macroBold}>{current}g</Text> / {goal}g
  </Text>
);

const LogMeal = () => (
  <View>
    <Text style={styles.header}>Log Meal</Text>
    <View style={[styles.subContainer, styles.logMealRow]}>
      <LogButton name="barcode" path="barcode-scan" />
      <LogButton name="search" path="" />
      <LogButton name="mic" path="" />
      <LogButton name="chatbubble-ellipses" path="" />
    </View>
  </View>
);

const LogButton = ({ name, path }: LogButtonProps) => (
  <Link href={`../${path}`}>
    <Ionicons name={name} size={28} color={colors.textDark} />
  </Link>
);

// Dummy Data
const meals: MealCardProps[] = [
  {
    mealType: "BREAKFAST",
    calories: 450,
    time: "8:34 AM",
    macros: { protein: 24, carbs: 58, fats: 12 },
    tags: [{ label: "High fiber", variant: "success" }],
  },
  {
    mealType: "LUNCH",
    calories: 680,
    time: "1:00 PM",
    macros: { protein: 58, carbs: 64, fats: 24 },
    tags: [{ label: "Moderate sodium", variant: "warning" }],
  },
];
const Meals = () => (
  <View>
    <Text style={styles.header}>Today&apos;s Meals</Text>
    <View>
      {meals.length === 0 ? (
        <Text style={styles.emptyState}>No meals logged yet today.</Text>
      ) : (
        meals.map((meal) => <MealCard key={meal.mealType} {...meal} />)
      )}
    </View>
  </View>
);

const MealCard = ({
  mealType,
  calories,
  time,
  macros,
  tags,
}: MealCardProps) => (
  <View>
    <Text style={styles.mealTypeLabel}>{mealType}</Text>
    <View style={styles.subContainer}>
      <View style={styles.mealTopRow}>
        <Text style={styles.mealCalories}>
          {calories} <Text style={styles.mealKcal}>kcal</Text>
        </Text>
        <Text style={styles.mealTime}>{time}</Text>
      </View>
      <View style={styles.mealMacrosRow}>
        <Text style={styles.mealMacroValue}>
          {macros.protein}g <Text style={styles.mealMacroLabel}>protein</Text>
        </Text>
        <Text style={styles.mealMacroValue}>
          {macros.carbs}g <Text style={styles.mealMacroLabel}>carbs</Text>
        </Text>
        <Text style={styles.mealMacroValue}>
          {macros.fats}g <Text style={styles.mealMacroLabel}>fats</Text>
        </Text>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.textMedium}
          style={{ marginLeft: "auto" }}
        />
      </View>
      <View style={styles.tagsRow}>
        {tags.map((tag, i) => (
          <Tag key={i} label={tag.label} variant={tag.variant} />
        ))}
      </View>
    </View>
  </View>
);

const Tag = ({ label, variant }: TagProps) => (
  <View style={[styles.tag, { backgroundColor: TAG_COLORS[variant].bg }]}>
    <Text style={[styles.tagText, { color: TAG_COLORS[variant].text }]}>
      {label}
    </Text>
  </View>
);

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subHeader: {
    color: colors.textMedium,
    marginBottom: 3,
  },
  subContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  harmfulRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
  },
  harmfulText: {
    color: colors.danger,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  caloriesNumber: {
    fontWeight: "bold",
    fontSize: 26,
  },
  macrosContainer: {
    gap: 3,
  },
  macroBold: {
    fontWeight: "bold",
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    fontWeight: "bold",
    fontSize: 18,
    color: colors.white,
  },
  logMealRow: {
    justifyContent: "space-around",
    flexDirection: "row",
  },
  mealTypeLabel: {
    marginTop: 8,
    color: colors.textLight,
  },
  mealTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealCalories: {
    fontSize: 22,
    fontWeight: "bold",
  },
  mealKcal: {
    fontSize: 14,
    color: colors.textMedium,
    fontWeight: "normal",
  },
  mealTime: {
    color: colors.textMedium,
  },
  mealMacrosRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  mealMacroValue: {
    fontWeight: "bold",
  },
  mealMacroLabel: {
    color: colors.textMedium,
    fontWeight: "normal",
  },
  separator: {
    height: 1,
    width: "95%",
    backgroundColor: colors.textLight,
    marginVertical: 14,
    alignSelf: "center",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  emptyState: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
});
