import React from "react";
import { Pressable, View, Text, StyleSheet, TextInput } from "react-native";
import { colors } from "../lib/colors";

export default function Index() {
  return (
    <View style={[styles.center, { flex: 1 }]}>
      <Text style={styles.h1}>Forgot Password</Text>
      <Text style={[styles.subText, { marginBottom: 10 }]}>
        Enter your email to reset your password
      </Text>
      <TextFields />

      <View style={{ width: 350, margin: 10 }}>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
const TextFields = () => {
  const [email, setEmail] = React.useState("");

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email"
        autoCorrect={false}
      ></TextInput>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    marginTop: 70,
    alignItems: "center",
  },
  h1: {
    fontSize: 35,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    width: 350,
    margin: 12,
    borderWidth: 1,
    borderColor: colors.textMedium,
    borderRadius: 8,
    padding: 10,
  },
  link: {
    color: colors.info,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  subText: {
    color: colors.textMedium,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
});
