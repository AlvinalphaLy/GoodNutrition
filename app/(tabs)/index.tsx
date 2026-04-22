import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo } from "react";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { VoiceRecorder } from "../../src/features/voice-log/components/VoiceRecorder";
import { useVoiceLog } from "../../src/features/voice-log/hooks/useVoiceLog";
import { pendingVoiceStore } from "../../src/features/voice-log/store/pendingVoice";
import { useProfile } from "../context/profileContext";
import { colors } from "../lib/colors";
import { useMeals } from "./meals/meals-context";
import { buildMealTags, buildScoreSummary, summarizeNutritionEntries } from "./meals/nutrition";

const TAG_COLORS: Record<TagProps["variant"], { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.successText },
  warning: { bg: colors.warningLight, text: colors.warningText },
  danger: { bg: colors.dangerLight, text: colors.dangerText },
};

type TagProps = {
  label: string;
  variant: "success" | "warning" | "danger";
};

type MacroProps = {
  nutrient: "Protein" | "Carbs" | "Fats";
  current: number;
  goal: number;
};

type SummaryProps = {
  currentCalories: number;
  calorieGoal: number;
  macros: { protein: number; carbs: number; fat: number };
  macroGoals: { protein: number; carbs: number; fat: number };
  rating: number;
  score: number;
  harmfulCount: number;
};

type HomeMealCard = {
  id: string;
  mealType: string;
  calories: number;
  time: string;
  macros: { protein: number; carbs: number; fats: number };
  tags: { label: string; variant: "success" | "warning" | "danger" }[];
};

export default function Index() {
  const router = useRouter();
  const { profile } = useProfile();
  const { loggedMeals } = useMeals();
  const { state, startVoice, stopVoice, reset } = useVoiceLog();

  const todayKey = new Date().toDateString();
  const todaysMeals = useMemo(
    () => loggedMeals.filter((meal) => new Date(meal.loggedAt).toDateString() === todayKey),
    [loggedMeals, todayKey]
  );

  const mealCards = useMemo<HomeMealCard[]>(() => {
    return todaysMeals.map((meal) => {
      const nutrition = summarizeNutritionEntries(meal.items);
      return {
        id: meal.id,
        mealType: meal.mealType.toUpperCase(),
        calories: Math.round(nutrition.calories),
        time: new Date(meal.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        macros: {
          protein: Math.round(nutrition.protein),
          carbs: Math.round(nutrition.carbs),
          fats: Math.round(nutrition.fat),
        },
        tags: buildMealTags(nutrition),
      };
    });
  }, [todaysMeals]);

  const todayNutrition = useMemo(
    () => summarizeNutritionEntries(todaysMeals.map((meal) => ({ nutrition: summarizeNutritionEntries(meal.items) }))),
    [todaysMeals]
  );

  const scoreSummary = useMemo(
    () =>
      buildScoreSummary(todayNutrition, {
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carb,
        fat: profile.fat,
      }),
    [profile.calories, profile.carb, profile.fat, profile.protein, todayNutrition]
  );

  useEffect(() => {
    if (state.status === "preview") {
      pendingVoiceStore.set(state.result);
      reset();
      router.push("/meals/log-meal/voice-confirm" as Href);
    }
  }, [state, reset, router]);

  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}>
      <Summary
        currentCalories={Math.round(todayNutrition.calories)}
        calorieGoal={profile.calories}
        macros={{
          protein: Math.round(todayNutrition.protein),
          carbs: Math.round(todayNutrition.carbs),
          fat: Math.round(todayNutrition.fat),
        }}
        macroGoals={{ protein: profile.protein, carbs: profile.carb, fat: profile.fat }}
        rating={scoreSummary.rating}
        score={scoreSummary.score}
        harmfulCount={todayNutrition.harmfulIngredientMatches.length}
      />
      <QuickActions
        onLogMeal={() => router.push(`/meals/log-meal/meal-type?returnTo=${encodeURIComponent("/")}` as Href)}
        onBarcode={() =>
          router.push(
            `/barcode-scan?returnTo=${encodeURIComponent("/meals/log-meal/review")}&finalReturnTo=${encodeURIComponent("/")}` as Href
          )
        }
        onMicPress={() => {
          void startVoice();
        }}
      />
      <Meals
        meals={mealCards}
        onOpenMeal={(mealId) => router.push(`/meals/log-meal/review?loggedMealId=${mealId}` as Href)}
      />
      <VoiceRecorder state={state} onStop={() => void stopVoice()} onDismiss={reset} />
    </ScrollView>
  );
}

const Summary = ({
  currentCalories,
  calorieGoal,
  macros,
  macroGoals,
  rating,
  score,
  harmfulCount,
}: SummaryProps) => (
  <View>
    <Text style={styles.header}>Today&apos;s Summary</Text>
    <View style={styles.subContainer}>
      <View style={styles.summaryTopRow}>
        <Calories current={currentCalories} goal={calorieGoal} />
        <Macros current={macros} goals={macroGoals} />
        <Score rate={rating} score={score} />
      </View>
      <Separator />
      <HarmfulIngredientsSummary count={harmfulCount} />
    </View>
  </View>
);

const HarmfulIngredientsSummary = ({ count }: { count: number }) => (
  <View style={styles.harmfulRow}>
    <Text style={styles.harmfulText}>
      {count > 0 ? `${count} harmful ingredient${count === 1 ? "" : "s"} detected` : "No harmful ingredients detected"}
    </Text>
    <Ionicons name="warning-outline" size={18} color={count > 0 ? colors.dangerText : colors.textMedium} />
  </View>
);

const Score = ({ rate, score }: { rate: number; score: number }) => (
  <View>
    <Text style={[styles.subHeader, { marginLeft: 3 }]}>SCORE</Text>
    <View style={styles.circle}>
      <Text style={styles.circleText}>{rate || "--"}/5</Text>
    </View>
    <Text style={styles.scoreCaption}>{score}/100</Text>
  </View>
);

const Calories = ({ current, goal }: { current: number; goal: number }) => (
  <View>
    <Text style={styles.subHeader}>CALORIES</Text>
    <Text style={styles.caloriesNumber}>{current}</Text>
    <Text> / {goal}</Text>
  </View>
);

const Macros = ({ current, goals }: { current: { protein: number; carbs: number; fat: number }; goals: { protein: number; carbs: number; fat: number } }) => (
  <View>
    <Text style={styles.subHeader}>MACROS</Text>
    <View style={styles.macrosContainer}>
      <MacroNutrient nutrient="Protein" current={current.protein} goal={goals.protein} />
      <MacroNutrient nutrient="Carbs" current={current.carbs} goal={goals.carbs} />
      <MacroNutrient nutrient="Fats" current={current.fat} goal={goals.fat} />
    </View>
  </View>
);

const MacroNutrient = ({ nutrient, current, goal }: MacroProps) => (
  <Text>
    {nutrient}: <Text style={styles.macroBold}>{current}g</Text> / {goal}g
  </Text>
);

const QuickActions = ({
  onLogMeal,
  onBarcode,
  onMicPress,
}: {
  onLogMeal: () => void;
  onBarcode: () => void;
  onMicPress: () => void;
}) => (
  <View>
    <Text style={styles.header}>Quick actions</Text>
    <View style={[styles.subContainer, styles.logMealRow]}>
      <ActionButton label="Log meal" icon="restaurant-outline" onPress={onLogMeal} />
      <ActionButton label="Barcode" icon="barcode-outline" onPress={onBarcode} />
      <ActionButton label="Voice" icon="mic-outline" onPress={onMicPress} />
      <ActionButton label="AI" icon="chatbubble-ellipses-outline" disabled />
    </View>
  </View>
);

const ActionButton = ({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
}) => (
  <Pressable style={[styles.actionButton, disabled && styles.actionButtonDisabled]} disabled={disabled} onPress={onPress}>
    <Ionicons name={icon} size={24} color={disabled ? colors.textLight : colors.textDark} />
    <Text style={[styles.actionButtonText, disabled && styles.actionButtonTextDisabled]}>{label}</Text>
  </Pressable>
);

const Meals = ({ meals, onOpenMeal }: { meals: HomeMealCard[]; onOpenMeal: (mealId: string) => void }) => (
  <View>
    <Text style={styles.header}>Today&apos;s Meals</Text>
    <View>
      {meals.length === 0 ? (
        <Text style={styles.emptyState}>No meals logged yet today.</Text>
      ) : (
        meals.map((meal) => <MealCard key={meal.id} {...meal} onPress={() => onOpenMeal(meal.id)} />)
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
  onPress,
}: HomeMealCard & { onPress: () => void }) => (
  <Pressable onPress={onPress}>
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
        {tags.map((tag) => (
          <Tag key={`${mealType}-${tag.label}`} label={tag.label} variant={tag.variant} />
        ))}
      </View>
    </View>
  </Pressable>
);

const Tag = ({ label, variant }: TagProps) => (
  <View style={[styles.tag, { backgroundColor: TAG_COLORS[variant].bg }]}>
    <Text style={[styles.tagText, { color: TAG_COLORS[variant].text }]}>{label}</Text>
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
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  harmfulRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
  },
  harmfulText: {
    color: colors.danger,
    fontStyle: "italic",
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.white,
  },
  scoreCaption: {
    color: colors.textMedium,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  logMealRow: {
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: "600",
  },
  actionButtonTextDisabled: {
    color: colors.textMedium,
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    color: colors.textMedium,
    marginTop: 8,
  },
});
