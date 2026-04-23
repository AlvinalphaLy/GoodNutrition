// TODO: Health conditions
// TODO: Activity level
// TODO: Weight goal
// TODO: Switch macro goals to percentages
// TODO: Height in ft
// TODO: Add sex

import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { colors } from "../lib/colors";

export default function Profile() {
  const { profile, setProfile, fetchProfile, saveProfile, loading } =
    useProfile();

  const [image, setImage] = useState<string | null>(profile.image);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    setImage(profile.image);
  }, [profile.image]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setProfile((prev) => ({ ...prev, image: uri }));
    }
  };

  const validateProfile = () => {
    if (!profile.name.trim()) {
      Alert.alert("Invalid Name", "Please enter your name.");
      return false;
    }

    if (profile.age < 18 || profile.age > 100) {
      Alert.alert("Invalid Age", "Age must be between 0 and 100");
      return false;
    }

    if (profile.weight <= 70 || profile.weight > 1000) {
      Alert.alert("Invalid Weight", "Weight must be between 70 and 1000");
      return false;
    }

    if (profile.height <= 24 || profile.height > 108) {
      Alert.alert("Invalid Height", "Height must be between 24 and 108");
      return false;
    }

    if (profile.calories < 800 || profile.calories > 10000) {
      Alert.alert("Invalid Calories", "Calories must be between 800 and 10000");
      return false;
    }

    if (profile.protein < 0 || profile.protein > 250) {
      Alert.alert("Invalid Protein", "Protein must be between 0 and 250");
      return false;
    }

    if (profile.carb < 0 || profile.carb > 400) {
      Alert.alert("Invalid Carbs", "Carbs must be between 0 and 400");
      return false;
    }

    if (profile.fat < 0 || profile.fat > 300) {
      Alert.alert("Invalid Fat", "Fat must be between 0 and 300");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    const { error } = await saveProfile();

    if (error) {
      Alert.alert("Error", "Failed to save profile");
      return;
    }

    Alert.alert("Success", "Profile saved");
  };

  const handleNumberChange = (
    key: "age" | "weight" | "height" | "calories" | "protein" | "carb" | "fat",
    text: string
  ) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    setProfile((prev) => ({
      ...prev,
      [key]: cleaned === "" ? 0 : Number(cleaned),
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={70}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z\s'-]/g, "");
                  setProfile((prev) => ({ ...prev, name: cleaned }));
                }}
                style={styles.nameInput}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  value={String(profile.age)}
                  onChangeText={(text) => handleNumberChange("age", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Weight(lbs)</Text>
                <TextInput
                  value={String(profile.weight)}
                  onChangeText={(text) => handleNumberChange("weight", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Height(in)</Text>
                <TextInput
                  value={String(profile.height)}
                  onChangeText={(text) => handleNumberChange("height", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Calorie Goal</Text>
                <TextInput
                  value={String(profile.calories)}
                  onChangeText={(text) => handleNumberChange("calories", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Protein Goal</Text>
                <TextInput
                  value={String(profile.protein)}
                  onChangeText={(text) => handleNumberChange("protein", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Carb Goal</Text>
                <TextInput
                  value={String(profile.carb)}
                  onChangeText={(text) => handleNumberChange("carb", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Fat Goal</Text>
                <TextInput
                  value={String(profile.fat)}
                  onChangeText={(text) => handleNumberChange("fat", text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    backgroundColor: colors.white,
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
    width: 110,
    fontSize: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    borderRadius: 6,
  },
  saveButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});