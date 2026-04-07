import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MealItem = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

export default function AddMealItemsScreen() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);

  const handleAddItem = () => {
    if (!itemName.trim()) return;

    const newItem: MealItem = {
      id: Date.now(),
      name: itemName.trim(),
      quantity: quantity.trim() || "1",
      unit: unit.trim() || "serving",
    };

    setItems((prev) => [...prev, newItem]);
    setItemName("");
    setQuantity("");
    setUnit("");
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Food Items</Text>
      <Text style={styles.subtitle}>
        Add food items and quantities for this meal
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Food Item</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Greek yogurt"
          value={itemName}
          onChangeText={setItemName}
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Unit</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. cups, slices, servings"
          value={unit}
          onChangeText={setUnit}
        />

        <Pressable style={styles.primaryButton} onPress={handleAddItem}>
          <Text style={styles.primaryButtonText}>Add Item</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Added Items</Text>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No items added yet</Text>
            <Text style={styles.emptyText}>
              Added meal items will appear here.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemText}>
                  {item.quantity} {item.unit}
                </Text>
              </View>

              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Step</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Review Meal</Text>
          <Text style={styles.placeholderText}>
            The next screen will show placeholder totals, harmful ingredients,
            and an eating score.
          </Text>
        </View>

        <Pressable style={styles.disabledButton}>
          <Text style={styles.disabledButtonText}>Done (Review Coming Next)</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: "#6b7280",
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },
  removeButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
});