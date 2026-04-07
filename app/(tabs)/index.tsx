import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "../lib/colors";
export default function Index() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.header}>Today&apos;s Summary</Text>
        <View style={styles.summaryContainer}>
          <View>
            <Text style={styles.subHeader}>CALORIES</Text>
            <Text style={{ fontWeight: "bold", fontSize: 30 }}>1,450</Text>
            <Text> / 2,000</Text>
          </View>
          <View>
            <Text style={styles.subHeader}>MACROS</Text>
            <View style={styles.macrosContainer}>
              <Text>
                Protein: <Text style={{ fontWeight: "bold" }}>120g</Text> / 160g
              </Text>
              <Text>
                Carbs: <Text style={{ fontWeight: "bold" }}>120g</Text> / 160g
              </Text>
              <Text>
                Fats: <Text style={{ fontWeight: "bold" }}>44g</Text> / 78g
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.subHeader}>SCORE</Text>
            <View style={styles.circle}>
              <Text style={styles.circleText}>3</Text>
            </View>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.header}>Log Meal</Text>
        <View style={styles.logMealContainer}>
          <Pressable onPress={() => console.log("pressed")}>
            <Ionicons name="search" size={30} color={colors.textDark} />
          </Pressable>
          <Pressable onPress={() => console.log("pressed")}>
            <Ionicons name="barcode-sharp" size={30} color={colors.textDark} />
          </Pressable>
          <Pressable onPress={() => console.log("pressed")}>
            <Ionicons name="mic" size={30} color={colors.textDark} />
          </Pressable>
        </View>
      </View>
      <View>
        <Text style={styles.header}>Today&apos;s Meals</Text>
      </View>
    </View>
  );
}

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
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    shadowColor: "black",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  macrosContainer: {
    gap: 3,
  },
  logMealContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-evenly",
    padding: 15,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    shadowColor: "black",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 25,
    color: colors.white,
  },
});
