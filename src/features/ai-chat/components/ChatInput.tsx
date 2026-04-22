import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChatAttachment } from "../types/chat";
import { palette } from "./palette";

interface Props {
  onSend: (text: string, attachment?: ChatAttachment | null) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

interface Attachment {
  name: string;
  uri: string;
  mimeType?: string | null;
  base64: string;
}

function inferMimeType(name: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;

  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

function toBase64FromArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function readAssetAsBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    return toBase64FromArrayBuffer(buffer);
  }

  return FileSystem.readAsStringAsync(uri, { encoding: "base64" });
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = "Ask about meals, calories, or food swaps…",
}: Props) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const canSend = Boolean(text.trim() || attachment);

  async function handleAttach() {
    if (disabled || isStreaming) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const selected = result.assets?.[0];
    if (!selected) return;

    const base64 = await readAssetAsBase64(selected.uri);

    const name = selected.name ?? "Attachment";
    const resolvedMimeType = inferMimeType(name, selected.mimeType);

    setAttachment({
      name,
      uri: selected.uri,
      mimeType: resolvedMimeType,
      base64,
    });
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    if (isStreaming || disabled) return;

    const attachmentLabel = attachment
      ? `\n\nAttached file: ${attachment.name}`
      : "";

    onSend(
      `${trimmed}${attachmentLabel}`.trim(),
      attachment
        ? {
            name: attachment.name,
            mimeType: inferMimeType(attachment.name, attachment.mimeType),
            base64: attachment.base64,
          }
        : null,
    );
    setText("");
    setAttachment(null);
  }

  function handleStop() {
    onStop?.();
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.iconBtn} onPress={handleAttach} hitSlop={8}>
        <MaterialIcons name="attach-file" size={22} color="#677082" />
      </Pressable>

      <View style={styles.composer}>
        {attachment && (
          <View style={styles.attachmentChip}>
            <MaterialIcons
              name={
                attachment.mimeType?.startsWith("image/")
                  ? "image"
                  : "picture-as-pdf"
              }
              size={16}
              color={palette.primary}
            />
            <Text style={styles.attachmentText} numberOfLines={1}>
              {attachment.name}
            </Text>
            <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
              <MaterialIcons name="close" size={16} color="#677082" />
            </Pressable>
          </View>
        )}

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
      </View>

      {isStreaming ? (
        <Pressable
          style={[styles.sendBtn, styles.stopBtn]}
          onPress={handleStop}
          hitSlop={8}
        >
          <MaterialIcons name="stop" size={18} color="#ffffff" />
        </Pressable>
      ) : (
        <Pressable
          style={[
            styles.sendBtn,
            (!canSend || disabled) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend || disabled}
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
  composer: {
    flex: 1,
    paddingVertical: 6,
    gap: 4,
  },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.surfaceContainer,
    marginTop: 2,
  },
  attachmentText: {
    maxWidth: 180,
    color: palette.onSurface,
    fontSize: 12,
    flexShrink: 1,
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
