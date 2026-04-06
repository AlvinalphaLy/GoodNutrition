import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const palette = {
  background: "#f9fafb",
  surface: "#ffffff",
  surfaceContainerLow: "#f3f4f6",
  surfaceContainer: "#e5e7eb",
  outline: "#e5e7eb",
  onSurface: "#1f2937",
  onSurfaceVariant: "#6b7280",
  primary: "#2553eb",
  primaryContainer: "#dbeafe",
  onPrimaryContainer: "#1e3a8a",
  secondary: "#10b981",
  secondaryContainer: "#d1fae5",
  accent: "#f59e0b",
  textLight: "#9ca3af",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

type BubbleProps = {
  role: "ai" | "user";
  time: string;
  text: string;
};

function MessageBubble({ role, time, text }: BubbleProps) {
  const isAI = role === "ai";

  return (
    <View style={[styles.messageWrap, isAI ? styles.aiWrap : styles.userWrap]}>
      <View style={styles.messageMeta}>
        {isAI ? <Text style={styles.botLabel}>Burger AI</Text> : null}
        <Text style={styles.timeLabel}>{time}</Text>
        {!isAI ? <Text style={styles.youLabel}>You</Text> : null}
      </View>

      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.bubbleText, !isAI ? styles.userBubbleText : null]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <Pressable style={styles.actionChip}>
      <MaterialIcons name={icon as never} size={18} color={color} />
      <Text style={styles.actionChipLabel}>{label}</Text>
    </Pressable>
  );
}

export default function AiChatScreen() {
  const [prompt, setPrompt] = React.useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
          </View>

          <View>
            <Text style={styles.title}>Burger AI Assistant</Text>
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable style={styles.iconButton}>
            <MaterialIcons name="search" size={22} color="#677082" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <MaterialIcons name="more-vert" size={22} color="#677082" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MessageBubble
            role="ai"
            time="10:24 AM"
            text="Good morning. I reviewed your meal plan for today. We can start by lowering calories, balancing protein, or reducing fat in the next meal."
          />

          <View style={styles.quickRow}>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Lower Calories</Text>
            </Pressable>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Reduce Fat</Text>
            </Pressable>
          </View>

          <MessageBubble
            role="user"
            time="10:25 AM"
            text="Let's start with lunch. I want a meal that keeps calories moderate but still feels filling. Can you cut down on fat without making it bland?"
          />

          <View style={styles.messageWrap}>
            <View style={styles.messageMeta}>
              <Text style={styles.botLabel}>Burger AI</Text>
              <Text style={styles.timeLabel}>10:26 AM</Text>
            </View>
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={styles.bubbleText}>
                Understood. I drafted three food options that keep calories
                reasonable while still feeling satisfying.
              </Text>

              <View style={styles.quoteBefore}>
                <Text style={styles.quoteBeforeText}>
                  "Cheeseburger with fries..."
                </Text>
              </View>

              <Text style={styles.transformsTo}>becomes</Text>

              <View style={styles.quoteAfter}>
                <Text style={styles.quoteAfterText}>
                  "Grilled chicken burger with side salad and lighter sauce..."
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            <ActionChip
              icon="auto-fix-high"
              label="Cut Calories"
              color={palette.primary}
            />
            <ActionChip
              icon="spellcheck"
              label="Balance Fat"
              color={palette.secondary}
            />
            <ActionChip
              icon="lightbulb"
              label="Meal Idea"
              color={palette.accent}
            />
            <ActionChip
              icon="history-edu"
              label="Apply Swap"
              color={palette.info}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomInputWrap}>
          <View style={styles.inputCard}>
            <Pressable style={styles.iconButton}>
              <MaterialIcons name="attach-file" size={22} color="#677082" />
            </Pressable>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Ask Burger AI to suggest meals, calories, or swaps..."
              placeholderTextColor="#7b8394"
              style={styles.input}
            />
            <Pressable style={styles.sendButton}>
              <MaterialIcons name="send" size={18} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.bottomNav}>
            <Pressable style={styles.navButton}>
              <MaterialIcons name="history" size={24} color="#9ca3af" />
            </Pressable>
            <Pressable style={[styles.navButton, styles.navPrimaryButton]}>
              <MaterialIcons name="add-box" size={24} color={palette.primary} />
            </Pressable>
            <Pressable style={styles.navButton}>
              <MaterialIcons name="settings" size={24} color="#9ca3af" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flexFill: {
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
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 190,
    gap: 14,
  },
  messageWrap: {
    maxWidth: "88%",
  },
  aiWrap: {
    alignSelf: "flex-start",
  },
  userWrap: {
    alignSelf: "flex-end",
  },
  messageMeta: {
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
  bubbleText: {
    color: palette.onSurface,
    fontSize: 15,
    lineHeight: 22,
  },
  userBubbleText: {
    color: palette.onPrimaryContainer,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: -2,
  },
  quickButton: {
    backgroundColor: palette.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  quickButtonText: {
    color: palette.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
  },
  quoteBefore: {
    marginTop: 10,
    backgroundColor: palette.surfaceContainerLow,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    borderRadius: 12,
    padding: 10,
  },
  quoteBeforeText: {
    color: palette.onSurfaceVariant,
    fontStyle: "italic",
    fontWeight: "600",
    fontSize: 13,
  },
  transformsTo: {
    marginTop: 9,
    color: palette.onSurface,
    fontSize: 14,
  },
  quoteAfter: {
    marginTop: 8,
    backgroundColor: palette.secondaryContainer,
    borderLeftWidth: 3,
    borderLeftColor: palette.secondary,
    borderRadius: 12,
    padding: 10,
  },
  quoteAfterText: {
    color: "#065f46",
    fontWeight: "600",
    fontSize: 13,
  },
  actionsGrid: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionChip: {
    width: "48%",
    minHeight: 72,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.outline,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.onSurface,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bottomInputWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  inputCard: {
    minHeight: 56,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    color: palette.onSurface,
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  bottomNav: {
    height: 58,
    borderRadius: 22,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.outline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  navPrimaryButton: {
    backgroundColor: palette.surfaceContainer,
  },
});
