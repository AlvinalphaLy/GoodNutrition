import React from "react";
import { Button, View, Text, StyleSheet, TextInput } from "react-native";
import { Link } from "expo-router";

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
    borderBottomColor: "#737373",
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: "80%",
  },
  link: {
    color: "#1E90FF",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  subText: {
    color: "#737373",
  },
});

const Separator = () => <View style={styles.separator} />;

export default function Index() {
  return (
    <View style={[styles.center, { flex: 1 }]}>
      <Text style={styles.h1}>Sign up</Text>
      <Text style={[styles.subText, { marginBottom: 10 }]}>
        Sign up to get started
      </Text>
      <TextFields />

      <View style={{ width: 350, margin: 20 }}>
        <Button title="Sign up" />
      </View>
      <Separator />

      <View style={{ margin: 20 }}>
        <Text style={styles.subText}>
          Already have an account?{" "}
          <Link href="/auth/login" style={styles.link}>
            Log in
          </Link>
        </Text>
      </View>
    </View>
  );
}
const TextFields = () => {
  const [fullName, setFullname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <View>
      <TextInput
        value={fullName}
        onChangeText={setFullname}
        style={styles.input}
        placeholder="Full Name"
        autoCorrect={false}
      ></TextInput>
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
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry={true}
      ></TextInput>
    </View>
  );
};
