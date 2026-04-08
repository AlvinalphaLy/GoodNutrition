import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "../lib/colors";
import EmptyState from "../components/EmptyState";

type CaloriesProps = {
  current: number;
  goal: number;
};

type MacroProps = {
  nutrient: string;
  current: number;
  goal: number;
};

type LogButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void | Promise<void>;
};

export default function Index() {
  return (
    <View style={styles.container}>
      <Summary />
      <LogMeal />
      <Meals />
    </View>
  );
}

const Summary = () => (
  <View>
    <Text style={styles.header}>Today&apos;s Summary</Text>
    <View style={styles.subContainer}>
      <Calories current={1450} goal={2500} />
      <Macros />
      <View>
        <Text style={[styles.subHeader, { marginLeft: 3 }]}>SCORE</Text>
        <View style={styles.circle}>
          <Text style={styles.circleText}>3/10</Text>
        </View>
      </View>
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
    <View style={[styles.subContainer, { justifyContent: "space-evenly" }]}>
      <LogButton name={"search"} onPress={() => console.log("pressed")} />
      <LogButton name={"barcode"} onPress={() => console.log("pressed")} />
      <LogButton name={"mic"} onPress={() => console.log("pressed")} />
      <LogButton
        name={"chatbubble-ellipses"}
        onPress={() => console.log("pressed")}
      />
    </View>
  </View>
);

const LogButton = ({ name, onPress }: LogButtonProps) => (
  <Pressable onPress={onPress}>
    <Ionicons name={name} size={30} color={colors.textDark} />
  </Pressable>
);

// TODO: Handle empty state
const Meals = () => (
  <View>
    <Text style={styles.header}>Today&apos;s Meals</Text>
    <EmptyState />
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: 20,
    flex: 1,
    gap: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subHeader: {
    color: colors.textMedium,
    marginBottom: 5,
  },
  subContainer: {
    flexDirection: "row",
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
