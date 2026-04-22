import { useRouter } from "expo-router";

import { ChatScreen } from "@/src/features/ai-chat/components/ChatScreen";

export default function AiChatTab() {
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
