import React from "react";
import { Text, View, StyleSheet } from "react-native";

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
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.cardBg,
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
    fontSize: 25,
    color: colors.white,
  },
});
