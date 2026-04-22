import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChatMessage } from "../types/chat";
import { ChatBubble } from "./ChatBubble";
import { palette } from "./palette";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  assistantName?: string;
}

export function ChatMessageList({ messages, isStreaming, assistantName }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Ask me anything about nutrition</Text>
        <Text style={styles.emptySubtitle}>
          I can suggest meals, calculate macros, and help you reach your goals.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} assistantName={assistantName} />
      ))}

      {/* Show spinner if streaming hasn't started yet (placeholder is empty) */}
      {isStreaming &&
        messages.length > 0 &&
        messages[messages.length - 1].content === "" && (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.thinkingText}>Thinking…</Text>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.onSurface,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  thinkingText: {
    fontSize: 13,
    color: palette.onSurfaceVariant,
    fontStyle: "italic",
  },
});
