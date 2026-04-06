import { useRouter } from "expo-router";
import { ChatScreen } from "@/src/features/ai-chat/components/ChatScreen";

/**
 * Route entry for /ai-chat.
 * All logic and UI live in src/features/ai-chat — this file is just the
 * Expo Router integration point.
 *
 * Pass a real `profile` from your auth context once users are logged in.
 * For now we use an anonymous guest profile so you can test immediately.
 */
export default function AiChatRoute() {
  const router = useRouter();

  return (
    <ChatScreen
      profile={{
        userId: "guest",
        goals: ["healthy_eating"],
        allergies: [],
        dietaryPreferences: [],
        cookingSkill: "beginner",
        budgetLevel: "medium",
      }}
      onBack={() => router.back()}
    />
  );
}
