import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "./lib/colors";

export default function BarcodeScan() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return <Camera />;
}

const Camera = () => {
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [flashType, setFlashType] = useState<"flash" | "flash-off">("flash-off");
  const params = useLocalSearchParams<{
    returnTo?: string | string[];
    finalReturnTo?: string | string[];
  }>();
  const router = useRouter();

  const returnTo = useMemo(
    () => (Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo),
    [params.returnTo]
  );
  const finalReturnTo = useMemo(
    () => (Array.isArray(params.finalReturnTo) ? params.finalReturnTo[0] : params.finalReturnTo),
    [params.finalReturnTo]
  );

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "upc_e", "ean13"],
        }}
        onBarcodeScanned={({ data }) => {
          if (scanned) return;

          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanned(true);
          setTorch(false);

          router.push({
            pathname: "/product-result",
            params: {
              code: data,
              returnTo,
              finalReturnTo,
            },
          });
        }}
      />
      <View style={styles.overlayTop} pointerEvents="none" />
      <View style={styles.overlayBottom} pointerEvents="none" />
      <View style={styles.overlayLeft} pointerEvents="none" />
      <View style={styles.overlayRight} pointerEvents="none" />

      <View style={styles.scanner} />
      <Pressable
        style={styles.flashlight}
        onPress={() => {
          setTorch((prev) => !prev);
          setFlashType((prev) => (prev === "flash" ? "flash-off" : "flash"));
        }}
      >
        <Ionicons name={flashType} size={28} color={colors.white} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "37.5%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "37.5%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  overlayLeft: {
    position: "absolute",
    top: "37.5%",
    left: 0,
    width: "10%",
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  overlayRight: {
    position: "absolute",
    top: "37.5%",
    right: 0,
    width: "10%",
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  scanner: {
    position: "absolute",
    borderStyle: "solid",
    borderColor: colors.primary,
    borderWidth: 4,
    width: "80%",
    height: "25%",
    alignSelf: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  flashlight: {
    position: "absolute",
    bottom: "6%",
    right: "10%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
  },
});
