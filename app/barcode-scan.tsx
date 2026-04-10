import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

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
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "upc_e", "ean13"],
        }}
        onBarcodeScanned={({ data }) => {
          if (scanned) return;

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanned(true);

          router.push({
            pathname: "/product-result",
            params: { code: data },
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
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
    borderRadius: 12,
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
