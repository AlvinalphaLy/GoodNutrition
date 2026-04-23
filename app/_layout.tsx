import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { MealsProvider } from "./(tabs)/meals/meals-context";
import { ProfileProvider } from "./context/profileContext";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <MealsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="barcode-scan"
            options={{ title: "Scan Barcode", headerShown: true }}
          />
          <Stack.Screen
            name="product-result"
            options={{ title: "Product Result", headerShown: true }}
          />
        </Stack>
      </MealsProvider>
    </ProfileProvider>
  );
}