import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ProfileProvider } from "./context/profileContext";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="barcode-scan" options={{ title: "Scan Barcode" }} />
        <Stack.Screen
          name="product-result"
          options={{ title: "Product Result" }}
        />
      </Stack>
    </ProfileProvider>
  );
}
