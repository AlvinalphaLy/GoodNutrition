import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { palette } from "./palette";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = "Ask about meals, calories, or food swaps…",
}: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleStop() {
    onStop?.();
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.iconBtn} hitSlop={8}>
        <MaterialIcons name="attach-file" size={22} color="#677082" />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#7b8394"
        style={styles.input}
        multiline
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit
      />

      {isStreaming ? (
        <Pressable style={[styles.sendBtn, styles.stopBtn]} onPress={handleStop} hitSlop={8}>
          <MaterialIcons name="stop" size={18} color="#ffffff" />
        </Pressable>
      ) : (
        <Pressable
          style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          hitSlop={8}
        >
          <MaterialIcons name="send" size={18} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 56,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: palette.onSurface,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  sendBtnDisabled: {
    backgroundColor: palette.surfaceContainer,
  },
  stopBtn: {
    backgroundColor: palette.danger,
  },
});
