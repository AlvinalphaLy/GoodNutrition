import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "./lib/colors";

export default function BarcodeScan() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={{ color: colors.white, fontSize: 16 }}>
            {" "}
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  return <Camera />;
}

const Camera = () => {
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [flashType, setFlashType] = useState<"flash" | "flash-off">(
    "flash-off",
  );
  const router = useRouter();

  // Reset state when moving back from product-result
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, []),
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={"back"}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "upc_e", "ean13"],
        }}
        onBarcodeScanned={({ data }) => {
          if (scanned) return;

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanned(true);
          setTorch(false);

          router.push({
            pathname: "../product-result",
            params: { code: data },
          });
        }}
      />
      <View style={styles.scanner} />
      <Pressable
        style={styles.flashlight}
        onPress={() => {
          setTorch(!torch);
          setFlashType(torch ? "flash-off" : "flash");
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
  scanner: {
    position: "absolute",
    borderStyle: "dashed",
    borderColor: colors.white,
    borderWidth: 3,
    borderRadius: 12,
    width: "80%",
    height: "18%",
    alignSelf: "center",
  },
  flashlight: {
    position: "absolute",
    bottom: "6%",
    right: "10%",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 8,
    width: 150,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",

    // ios
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // android
    elevation: 5,
  },
});
