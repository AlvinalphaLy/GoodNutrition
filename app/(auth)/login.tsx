import React from "react";
import { Button, View, Text, StyleSheet, TextInput } from "react-native";
import { Link } from "expo-router";
import { colors } from "../lib/colors";

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  h1: {
    fontSize: 55,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    width: 350,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  separator: {
    borderBottomColor: colors.textMedium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: "80%",
  },
  link: {
    color: colors.info,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  logo: {
    fontSize: 50,
  },
  subText: {
    color: colors.textMedium,
  },
});

const Separator = () => <View style={styles.separator} />;

export default function Index() {
  return (
    <View style={[styles.center, { flex: 1 }]}>
      <Text style={styles.logo}>[ INSERT LOGO ]</Text>

      <Text style={styles.h1}>Welcome Back</Text>
      <Text style={[styles.subText, { marginBottom: 10 }]}>
        Enter your email and password
      </Text>
      <TextFields />

      <View style={{ alignItems: "flex-end", width: 350, marginTop: 5 }}>
        <Link href="../(auth)/forgotPassword" style={styles.link}>
          Forgot password
        </Link>
      </View>

      <View style={{ width: 350, margin: 20 }}>
        <Button title="Log in" color={colors.primary} />
      </View>
      <Separator />

      <View style={[{ margin: 20 }]}>
        <Text style={styles.subText}>
          Don’t have an account?{" "}
          <Link href="../(auth)/signup" style={styles.link}>
            Sign up
          </Link>
        </Text>
      </View>
    </View>
  );
}
const TextFields = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email"
        autoCorrect={false}
      ></TextInput>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
      ></TextInput>
    </View>
  );
};
