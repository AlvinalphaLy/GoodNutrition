import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  h1: {
    fontSize: 40,
  },
  input: {
    height: 40,
    width: 250,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default function Index() {
  return (
      <View style={[styles.center, { bottom: 50 }, { flex: 1 }]}>
        <Text style={styles.h1}>Welcome Back</Text>
        <Text style={{ marginBottom: 10 }}>Enter your email and password</Text>
        <TextFields />
      </View>
  );
}

const TextFields = () => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <View>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="email"
        autoCorrect={false}
      ></TextInput>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="password"
        secureTextEntry={true}
      ></TextInput>
    </View>
  );
};
