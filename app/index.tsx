import React from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>YOU ARE AT THE INDEX SCREEN!</Text>
      <Link href="/(auth)/login" push>
        Login Screen
      </Link>
    </View>
  );
}
