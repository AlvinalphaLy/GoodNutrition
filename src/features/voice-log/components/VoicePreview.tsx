import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { NutritionInfo, ParsedVoiceResult } from "../types/voice";

type Props = {
  result: ParsedVoiceResult;
  onConfirm: (result: ParsedVoiceResult) => void;
  onDismiss: () => void;
};

function sumNutrition(items: ParsedVoiceResult["items"]): NutritionInfo | null {
  const withNutrition = items.filter((i) => i.nutrition);
  if (withNutrition.length === 0) return null;
  return withNutrition.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.nutrition?.calories ?? 0),
      protein:  acc.protein  + (item.nutrition?.protein  ?? 0),
      carbs:    acc.carbs    + (item.nutrition?.carbs    ?? 0),
      fat:      acc.fat      + (item.nutrition?.fat      ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function VoicePreview({ result, onConfirm, onDismiss }: Props) {
  const hasItems = result.items.length > 0;
  const total = sumNutrition(result.items);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Review Voice Log</Text>

          {result.meal && (
            <View style={styles.mealBadge}>
              <Text style={styles.mealBadgeText}>
                {result.meal.charAt(0).toUpperCase() + result.meal.slice(1)}
              </Text>
            </View>
          )}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {result.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemQty}>
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                {item.nutrition ? (
                  <Text style={styles.macroLine}>
                    {item.nutrition.calories} kcal{"  "}
                    P {item.nutrition.protein}g{"  "}
                    C {item.nutrition.carbs}g{"  "}
                    F {item.nutrition.fat}g
                  </Text>
                ) : (
                  <Text style={styles.macroUnknown}>nutrition unavailable</Text>
                )}
              </View>
            ))}
          </ScrollView>

          {!hasItems && (
            <Text style={styles.empty}>No items detected. Please try again.</Text>
          )}

          {total && result.items.length > 1 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValues}>
                {total.calories} kcal{"  "}
                P {Math.round(total.protein * 10) / 10}g{"  "}
                C {Math.round(total.carbs * 10) / 10}g{"  "}
                F {Math.round(total.fat * 10) / 10}g
              </Text>
            </View>
          )}

          <Text style={styles.rawLabel}>Heard: "{result.rawText}"</Text>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onDismiss}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, !hasItems && styles.confirmDisabled]}
              onPress={() => onConfirm(result)}
              disabled={!hasItems}
            >
              <Text style={styles.confirmText}>Add to Meal</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  mealBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mealBadgeText: {
    color: "#065F46",
    fontWeight: "600",
    fontSize: 13,
  },
  list: {
    maxHeight: 240,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 3,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
    minWidth: 50,
  },
  itemName: {
    fontSize: 15,
    color: "#111827",
    textTransform: "capitalize",
  },
  macroLine: {
    fontSize: 12,
    color: "#6B7280",
    paddingLeft: 2,
  },
  macroUnknown: {
    fontSize: 12,
    color: "#D1D5DB",
    fontStyle: "italic",
    paddingLeft: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
  },
  totalValues: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
  empty: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 8,
  },
  rawLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  confirmDisabled: {
    backgroundColor: "#D1FAE5",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
