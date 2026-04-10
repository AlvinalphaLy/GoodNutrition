import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChatMessage } from "../types/chat";
import { formatTimestamp } from "../utils/messageMapper";
import { palette } from "./palette";

interface Props {
  message: ChatMessage;
  assistantName?: string;
}

export function ChatBubble({ message, assistantName = "Nutrition AI" }: Props) {
  const isAI = message.role === "assistant";
  const time = formatTimestamp(message.timestamp);

  return (
    <View style={[styles.wrap, isAI ? styles.aiWrap : styles.userWrap]}>
      <View style={styles.meta}>
        {isAI ? (
          <Text style={styles.botLabel}>{assistantName}</Text>
        ) : null}
        {time ? <Text style={styles.timeLabel}>{time}</Text> : null}
        {!isAI ? <Text style={styles.youLabel}>You</Text> : null}
      </View>

      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.text, !isAI && styles.userText]}>
          {message.content}
          {message.isStreaming ? (
            <Text style={styles.cursor}>▋</Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "88%",
  },
  aiWrap: {
    alignSelf: "flex-start",
  },
  userWrap: {
    alignSelf: "flex-end",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
    paddingHorizontal: 4,
  },
  botLabel: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  youLabel: {
    color: palette.onSurface,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  timeLabel: {
    color: "#778091",
    fontSize: 10,
    fontStyle: "italic",
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: palette.outline,
  },
  userBubble: {
    backgroundColor: palette.primaryContainer,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 24,
  },
  text: {
    color: palette.onSurface,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: palette.onPrimaryContainer,
  },
  cursor: {
    color: palette.primary,
    opacity: 0.7,
  },
});
