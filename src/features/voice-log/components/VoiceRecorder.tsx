import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { VoiceLogState } from "../types/voice";

type Props = {
  state: VoiceLogState;
  onStop: () => void;
  onDismiss: () => void;
};

export function VoiceRecorder({ state, onStop, onDismiss }: Props) {
  const visible =
    state.status === "recording" ||
    state.status === "processing" ||
    state.status === "error";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {state.status === "recording" && (
            <>
              <View style={styles.pulse}>
                <Ionicons name="mic" size={36} color="#fff" />
              </View>
              <Text style={styles.title}>Listening…</Text>
              <Text style={styles.hint}>Speak now, tap stop when done</Text>
              <Pressable style={styles.stopButton} onPress={onStop}>
                <Ionicons name="stop" size={28} color="#fff" />
              </Pressable>
            </>
          )}

          {state.status === "processing" && (
            <>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.title}>Processing…</Text>
              <Text style={styles.hint}>Parsing your voice input</Text>
            </>
          )}

          {state.status === "error" && (
            <>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.errorText}>{state.message}</Text>
              <Pressable style={styles.dismissButton} onPress={onDismiss}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: 300,
    alignItems: "center",
    gap: 12,
  },
  pulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  hint: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  stopButton: {
    marginTop: 12,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  dismissButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  dismissText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
