import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ParsedVoiceResult } from "../types/voice";

type Props = {
  result: ParsedVoiceResult;
  onConfirm: (result: ParsedVoiceResult) => void;
  onDismiss: () => void;
};

export function VoicePreview({ result, onConfirm, onDismiss }: Props) {
  const hasItems = result.items.length > 0;

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
                <Text style={styles.itemQty}>
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>

          {!hasItems && (
            <Text style={styles.empty}>
              No items detected. Please try again.
            </Text>
          )}

          <Text style={styles.rawLabel}>Heard: "{result.rawText}"</Text>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onDismiss}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                !hasItems && styles.confirmDisabled,
              ]}
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
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
