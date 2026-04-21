import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAiChat } from "../hooks/useAiChat";
import { UserProfile } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { palette } from "./palette";

const ASSISTANT_NAME = "Nutrition AI";
const ASSISTANT_AVATAR =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80";

interface Props {
  profile?: Partial<UserProfile> & { userId: string };
  sessionId?: string;
  onBack?: () => void;
}

export function ChatScreen({ profile, sessionId, onBack }: Props) {
  const { messages, isStreaming, error, sendMessage, loadHistory, clearError, stopStream } =
    useAiChat({ profile, initialSessionId: sessionId });

  // Load history on mount so returning users see their conversation
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color="#677082" />
            </Pressable>
          )}
          <View>
            <Image source={{ uri: ASSISTANT_AVATAR }} style={styles.avatar} />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.title}>{ASSISTANT_NAME}</Text>
            <Text style={styles.onlineText}>
              {isStreaming ? "TYPING…" : "ONLINE"}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="search" size={22} color="#677082" />
          </Pressable>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="more-vert" size={22} color="#677082" />
          </Pressable>
        </View>
      </View>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <Pressable style={styles.errorBanner} onPress={clearError}>
          <MaterialIcons name="error-outline" size={16} color="#991b1b" />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
          <MaterialIcons name="close" size={16} color="#991b1b" />
        </Pressable>
      )}

      {/* ── Messages + Input ────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          assistantName={ASSISTANT_NAME}
        />

        <View style={styles.inputWrap}>
          <ChatInput
            onSend={sendMessage}
            onStop={stopStream}
            isStreaming={isStreaming}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: palette.outline,
    backgroundColor: "rgba(249, 250, 251, 0.96)",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.surface,
    backgroundColor: palette.secondary,
    position: "absolute",
    right: -1,
    bottom: -1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.onSurface,
  },
  onlineText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: palette.success,
    fontWeight: "700",
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fca5a5",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#991b1b",
  },
  inputWrap: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.outline,
  },
});
