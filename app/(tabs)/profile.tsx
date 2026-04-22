// TODO: Health conditions
// TODO: Activity level
// TODO: Weight goal
// TODO: Switch macro goals to percentages
// TODO: Height in ft
// TODO: Add sex

import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useProfile } from "../context/profileContext";

export default function Profile() {
  const { profile, setProfile } = useProfile();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={70}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.screen}>
            <View style={styles.header}>
              <TouchableOpacity onPress={pickImage}>
                <Image
                  source={
                    image
                      ? { uri: image }
                      : { uri: "https://picsum.photos/200" }
                  }
                  style={styles.avatar}
                />
              </TouchableOpacity>

              <TextInput
                value={profile.name}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, name: text }))
                }
                style={styles.nameInput}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  value={profile.age.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      age: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Weight(lbs)</Text>
                <TextInput
                  value={profile.weight.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      weight: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Height(cm)</Text>
                <TextInput
                  value={profile.height.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      height: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Calorie Goal</Text>
                <TextInput
                  value={profile.calories.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      calories: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Protein Goal</Text>
                <TextInput
                  value={profile.protein.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      protein: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Carb Goal</Text>
                <TextInput
                  value={profile.carb.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      carb: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Fat Goal</Text>
                <TextInput
                  value={profile.fat.toString()}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      fat: text === "" ? 0 : Number(text),
                    }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  nameInput: {
    marginTop: 10,
    fontSize: 18,
    borderBottomWidth: 1,
    width: 200,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    width: 90,
    fontSize: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
