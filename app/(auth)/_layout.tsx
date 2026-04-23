import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Log in" }} />
      <Stack.Screen name="signup" options={{ title: "Sign up" }} />
      <Stack.Screen
        name="forgotPassword"
        options={{ title: "Forgot Password" }}
      />
    </Stack>
  );
}
