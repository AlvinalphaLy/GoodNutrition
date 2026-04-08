import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors } from "../lib/colors";

const EmptyState = () => {
  return (
    <View style={styles.container}>
      <View style={styles.stackWrapper}>
        {/* Background Decorative Cards */}
        <View style={[styles.card, styles.bgCard2]} />
        <View style={[styles.card, styles.bgCard1]} />

        {/* Main Placeholder Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            {/* The "Meal Image" placeholder */}
            <View style={styles.squarePlaceholder} />
            <View style={styles.lineWrapper}>
              {/* The "Meal Title" placeholder */}
              <View style={styles.lineLong} />
              {/* The "Calories/Macros" placeholder */}
              <View style={styles.lineShort} />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>No meals logged yet</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  stackWrapper: {
    alignItems: "center",
    height: 120,
    width: "100%",
    marginBottom: 20,
  },
  card: {
    width: 280,
    height: 90,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
    zIndex: 3,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bgCard1: {
    position: "absolute",
    top: 10,
    width: 250,
    zIndex: 2,
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  bgCard2: {
    position: "absolute",
    top: 20,
    width: 220,
    zIndex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  squarePlaceholder: {
    width: 45,
    height: 45,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  lineWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  lineLong: {
    height: 8,
    width: "70%",
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  lineShort: {
    height: 8,
    width: "40%",
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  subtitle: {
    color: colors.textMedium,
    fontSize: 14,
  },
});

export default EmptyState;
