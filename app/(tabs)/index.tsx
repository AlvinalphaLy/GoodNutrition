import React from "react";
import { Pressable, Text, ScrollView, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";

import { colors } from "../lib/colors";
// import EmptyState from "../components/EmptyState";

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

export default function Index() {
  return (
    <ScrollView contentContainerStyle={{ gap: 20, padding: 20 }}>
      <Summary />
      <LogMeal />
      <Meals />
    </ScrollView>
  );
}

const Summary = () => (
  <View>
    <Text style={styles.header}>Today&apos;s Summary</Text>
    <View>
      <View style={styles.subContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <Calories current={1450} goal={2500} />
          <Macros />
          <Score rate={2} />
        </View>
        <Separator />
        <HarmfulIngredientsSummary count={2} />
      </View>
    </View>
  </View>
);

const HarmfulIngredientsSummary = ({ count }: { count: number }) => (
  <Pressable
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 12,
    }}
    onPress={() => console.log("pressed")}
  >
    <Text
      style={{
        color: colors.danger,
        fontStyle: "italic",
        textDecorationLine: "underline",
      }}
    >
      {count} harmful ingredients detected
    </Text>
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
    <Text style={{ fontWeight: "bold", fontSize: 30 }}>{current}</Text>
    <Text> / {goal}</Text>
  </View>
);

// NOTE: How are we going to pass each macro info?
const Macros = () => (
  <View>
    <Text style={styles.subHeader}>MACROS</Text>
    <View style={styles.macrosContainer}>
      <MacroNutrient nutrient={"Protein"} current={120} goal={160} />
      <MacroNutrient nutrient={"Carbs"} current={150} goal={200} />
      <MacroNutrient nutrient={"Fats"} current={44} goal={77} />
    </View>
  </View>
);

const MacroNutrient = ({ nutrient, current, goal }: MacroProps) => (
  <Text>
    {nutrient}: <Text style={{ fontWeight: "bold" }}>{current}g</Text> / {goal}g
  </Text>
);

const LogMeal = () => (
  <View>
    <Text style={styles.header}>Log Meal</Text>
    <View
      style={[
        styles.subContainer,
        { justifyContent: "space-around", flexDirection: "row" },
      ]}
    >
      <LogButton name={"barcode"} path="barcode-scan" />
      <LogButton name={"search"} path="" />
      <LogButton name={"mic"} path="" />
      <LogButton name={"chatbubble-ellipses"} path="" />
    </View>
  </View>
);

const LogButton = ({ name, path }: LogButtonProps) => (
  <Link href={`../${path}`}>
    <Ionicons name={name} size={30} color={colors.textDark} />
  </Link>
);

// TODO: Handle empty state
const Meals = () => (
  <View>
    <Text style={styles.header}>Today&apos;s Meals</Text>
    {/* <EmptyState /> */}
    <View style={{ marginVertical: 10, marginHorizontal: 5 }}>
      <Text style={{ color: colors.textLight, fontSize: 16 }}>BREAKFAST</Text>
    </View>
  </View>
);

const Separator = () => (
  <View
    style={{
      height: 1,
      width: "95%",
      backgroundColor: colors.textLight,
      marginVertical: 14,
      alignSelf: "center",
    }}
  />
);

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subHeader: {
    color: colors.textMedium,
    marginBottom: 5,
  },
  subContainer: {
    justifyContent: "space-around",
    marginTop: 8,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  macrosContainer: {
    gap: 3,
  },
  //TODO: move bg color somewhere else
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
});
