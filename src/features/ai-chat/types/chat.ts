// ─── Message & Role ────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ─── User Profile ───────────────────────────────────────────────────────────
export type GoalType =
  | "fat_loss"
  | "muscle_gain"
  | "better_energy"
  | "healthy_eating"
  | "maintenance";

export type CookingSkill = "beginner" | "intermediate" | "advanced";
export type BudgetLevel = "low" | "medium" | "high";
export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "keto"
  | "paleo"
  | "gluten_free"
  | "dairy_free"
  | "halal"
  | "kosher";

export interface UserProfile {
  userId: string;
  name?: string;
  goals: GoalType[];
  allergies: string[]; // e.g. ["peanuts", "shellfish"]
  dietaryPreferences: DietaryPreference[];
  cookingSkill: CookingSkill;
  budgetLevel: BudgetLevel;
  weeklySchedule?: string; // e.g. "works late Mon–Wed, meal preps Sunday"
  culturalBackground?: string; // e.g. "West African", "Mediterranean"
}

export const DEFAULT_PROFILE: Omit<UserProfile, "userId"> = {
  goals: [],
  allergies: [],
  dietaryPreferences: [],
  cookingSkill: "beginner",
  budgetLevel: "medium",
};

// ─── API Contracts ──────────────────────────────────────────────────────────
export interface SendMessageRequest {
  message: string;
  attachment?: ChatAttachment | null;
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  base64: string;
}

export interface StreamChunk {
  type: "text_delta" | "done" | "error";
  content?: string;
  error?: string;
}

export interface SessionMessagesResponse {
  messages: ChatMessage[];
}

export interface ProfileUpdateRequest {
  profile: Partial<UserProfile>;
}

// ─── Hook Shape ─────────────────────────────────────────────────────────────
export interface UseAiChatOptions {
  profile?: Partial<UserProfile> & { userId: string };
  initialSessionId?: string;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string;
  sendMessage: (text: string, attachment?: ChatAttachment | null) => void;
  loadHistory: () => Promise<void>;
  clearError: () => void;
  stopStream: () => void;
}
