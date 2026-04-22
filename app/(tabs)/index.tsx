import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "../context/profileContext";
import { colors } from "../lib/colors";
import { VoiceRecorder } from "../../src/features/voice-log/components/VoiceRecorder";
import { useVoiceLog } from "../../src/features/voice-log/hooks/useVoiceLog";
import { pendingVoiceStore } from "../../src/features/voice-log/store/pendingVoice";
import { useMeals } from "./meals/meals-context";
import { scoreMeal, gradeColor } from "./meals/eatScore";

const TAG_COLORS: Record<TagProps["variant"], { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.successText },
  warning: { bg: colors.warningLight, text: colors.warningText },
  danger: { bg: colors.dangerLight, text: colors.dangerText },
};


type TagProps = {
  label: string;
  variant: "success" | "warning" | "danger";
};

type MealCardProps = {
  mealType: string;
  calories: number;
  time: string;
  macros: { protein: number; carbs: number; fats: number };
  tags: TagProps[];
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
  path?: string;
  onPress?: () => void;
};

type ProfileData = {
  weight: number;
  height: number;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

type Totals = { calories: number; protein: number; carbs: number; fat: number };

export default function Index() {
  const { profile } = useProfile();
  const { loggedMeals } = useMeals();
  const router = useRouter();
  const { state, startVoice, stopVoice, reset } = useVoiceLog();

  const todayKey = new Date().toDateString();

  const todaysMeals = useMemo(
    () => loggedMeals.filter((m) => new Date(m.loggedAt).toDateString() === todayKey),
    [loggedMeals, todayKey]
  );

  const DEFAULT_TOTALS = { calories: 1500, protein: 120, carbs: 150, fat: 44 };
  const DEFAULT_SCORE = 72;

  const todaysTotals = useMemo(() => {
    if (todaysMeals.length === 0) return DEFAULT_TOTALS;
    const allItems = todaysMeals.flatMap((m) => m.items);
    return {
      calories: Math.round(allItems.reduce((s, i) => s + (i.calories ?? 0), 0)),
      protein:  Math.round(allItems.reduce((s, i) => s + (i.protein  ?? 0), 0)),
      carbs:    Math.round(allItems.reduce((s, i) => s + (i.carbs    ?? 0), 0)),
      fat:      Math.round(allItems.reduce((s, i) => s + (i.fat      ?? 0), 0)),
    };
  }, [todaysMeals]);

  const avgScore = useMemo(() => {
    if (todaysMeals.length === 0) return DEFAULT_SCORE;
    const scores = todaysMeals.map((m) => scoreMeal(m.items)).filter(Boolean);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((s, ms) => s + ms!.total, 0) / scores.length);
  }, [todaysMeals]);

  const harmfulCount = useMemo(() => {
    if (todaysMeals.length === 0) return 2; // placeholder when no meals
    const allItems = todaysMeals.flatMap((m) => m.items);
    const hasOffData = allItems.some((i) => i.additives_tags !== undefined);
    if (!hasOffData) return null; // meals logged but no OFF data yet
    const unique = new Set(allItems.flatMap((i) => i.additives_tags ?? []));
    return unique.size;
  }, [todaysMeals]);

  useEffect(() => {
    if (state.status === "preview") {
      pendingVoiceStore.set(state.result);
      reset();
      router.push("/meals/log-meal/voice-confirm" as Href);
    }
  }, [state]);

  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20 }}>
      <Summary profile={profile} totals={todaysTotals} avgScore={avgScore} harmfulCount={harmfulCount} />
      <LogMeal onMicPress={startVoice} />
      <Meals meals={todaysMeals} />
      <VoiceRecorder state={state} onStop={stopVoice} onDismiss={reset} />
    </ScrollView>
  );
}

const Summary = ({
  profile,
  totals,
  avgScore,
  harmfulCount,
}: {
  profile: ProfileData;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  avgScore: number | null;
  harmfulCount: number | null;
}) => (
  <View>
    <Text style={styles.header}>Today&apos;s Summary</Text>
    <View>
      <View style={styles.subContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <Calories current={totals.calories} goal={profile.calories} />
          <Macros totals={totals} profile={profile} />
          <Score score={avgScore} />
        </View>
        <Separator />
        <HarmfulIngredientsSummary count={harmfulCount} />
      </View>
    </View>
  </View>
);

const HarmfulIngredientsSummary = ({ count }: { count: number | null }) => {
  if (count === null) return null;
  const isClean = count === 0;
  return (
    <Pressable style={styles.harmfulRow} onPress={() => console.log("pressed")}>
      <Text style={[styles.harmfulText, isClean && { color: colors.successText }]}>
        {isClean ? "No additives detected" : `${count} additive${count > 1 ? "s" : ""} detected`}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMedium} />
    </Pressable>
  );
};

const Score = ({ score }: { score: number | null }) => {
  const color = score === null ? colors.danger : gradeColor(
    score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Poor"
  );
  return (
    <View>
      <Text style={[styles.subHeader, { marginLeft: 3 }]}>SCORE</Text>
      <View style={[styles.circle, { backgroundColor: color }]}>
        <Text style={styles.circleText}>{score ?? "--"}</Text>
      </View>
    </View>
  );
};

const Calories = ({ current, goal }: CaloriesProps) => (
  <View>
    <Text style={styles.subHeader}>CALORIES</Text>
    <Text style={styles.caloriesNumber}>{current}</Text>
    <Text> / {goal}</Text>
  </View>
);

const Macros = ({
  totals,
  profile,
}: {
  totals: { protein: number; carbs: number; fat: number };
  profile: ProfileData;
}) => (
  <View>
    <Text style={styles.subHeader}>MACROS</Text>
    <View style={styles.macrosContainer}>
      <MacroNutrient nutrient="Protein" current={totals.protein} goal={profile.protein} />
      <MacroNutrient nutrient="Carbs"   current={totals.carbs}   goal={profile.carb} />
      <MacroNutrient nutrient="Fats"    current={totals.fat}     goal={profile.fat} />
    </View>
  </View>
);

const MacroNutrient = ({ nutrient, current, goal }: MacroProps) => (
  <Text>
    {nutrient}: <Text style={styles.macroBold}>{current}g</Text> / {goal}g
  </Text>
);

const LogMeal = ({ onMicPress }: { onMicPress: () => void }) => (
  <View>
    <Text style={styles.header}>Quick actions</Text>
    <View style={[styles.subContainer, styles.logMealRow]}>
      <LogButton name="barcode" path="barcode-scan" />
      <LogButton name="search" path="" />
      <LogButton name="mic" onPress={onMicPress} />
      <LogButton name="chatbubble-ellipses" path="ai-chat" />
    </View>
  </View>
);

const LogButton = ({ name, path, onPress }: LogButtonProps) => {
  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <Ionicons name={name} size={28} color={colors.textDark} />
      </Pressable>
    );
  }
  return (
    <Link href={`../${path ?? ""}`}>
      <Ionicons name={name} size={28} color={colors.textDark} />
    </Link>
  );
};

const DEFAULT_MEALS: MealCardProps[] = [
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

const Meals = ({ meals }: { meals: ReturnType<typeof useMeals>["loggedMeals"] }) => (
  <View>
    <Text style={styles.header}>Today&apos;s Meals</Text>
    <View>
      {meals.length === 0 ? (
        DEFAULT_MEALS.map((meal) => <DefaultMealCard key={meal.mealType} {...meal} />)
      ) : (
        meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
      )}
    </View>
  </View>
);

const DefaultMealCard = ({ mealType, calories, time, macros, tags }: MealCardProps) => (
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
        <Ionicons name="chevron-forward" size={24} color={colors.textMedium} style={{ marginLeft: "auto" }} />
      </View>
      <View style={styles.tagsRow}>
        {tags.map((tag, i) => <Tag key={i} label={tag.label} variant={tag.variant} />)}
      </View>
    </View>
  </View>
);

const MealCard = ({ meal }: { meal: ReturnType<typeof useMeals>["loggedMeals"][number] }) => {
  const calories = meal.items.reduce((s, i) => s + (i.calories ?? 0), 0);
  const protein  = Math.round(meal.items.reduce((s, i) => s + (i.protein  ?? 0), 0));
  const carbs    = Math.round(meal.items.reduce((s, i) => s + (i.carbs    ?? 0), 0));
  const fat      = Math.round(meal.items.reduce((s, i) => s + (i.fat      ?? 0), 0));
  const ms       = scoreMeal(meal.items);
  const time     = new Date(meal.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const gradeTag: TagProps | null = ms
    ? {
        label: ms.grade,
        variant: ms.total >= 65 ? "success" : ms.total >= 50 ? "warning" : "danger",
      }
    : null;

  return (
    <View>
      <Text style={styles.mealTypeLabel}>{meal.mealType.toUpperCase()}</Text>
      <View style={styles.subContainer}>
        <View style={styles.mealTopRow}>
          <Text style={styles.mealCalories}>
            {Math.round(calories)} <Text style={styles.mealKcal}>kcal</Text>
          </Text>
          <Text style={styles.mealTime}>{time}</Text>
        </View>
        <View style={styles.mealMacrosRow}>
          <Text style={styles.mealMacroValue}>
            {protein}g <Text style={styles.mealMacroLabel}>protein</Text>
          </Text>
          <Text style={styles.mealMacroValue}>
            {carbs}g <Text style={styles.mealMacroLabel}>carbs</Text>
          </Text>
          <Text style={styles.mealMacroValue}>
            {fat}g <Text style={styles.mealMacroLabel}>fats</Text>
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textMedium} style={{ marginLeft: "auto" }} />
        </View>
        {gradeTag && (
          <View style={styles.tagsRow}>
            <Tag label={gradeTag.label} variant={gradeTag.variant} />
          </View>
        )}
      </View>
    </View>
  );
};

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
