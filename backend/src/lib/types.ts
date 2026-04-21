// ─── Agent State ─────────────────────────────────────────────────────────────
// Stored in the Durable Object's in-memory state. Survives hibernation via
// the agents SDK serialisation. For heavy data use SQLite (see storage.ts).
export interface AgentState {
  sessionId: string;
  userId: string;
  profile: UserProfile;
  messageCount: number;
  initialized: boolean;
}

export const DEFAULT_AGENT_STATE: AgentState = {
  sessionId: "",
  userId: "",
  profile: {
    userId: "",
    goals: [],
    allergies: [],
    dietaryPreferences: [],
    cookingSkill: "beginner",
    budgetLevel: "medium",
  },
  messageCount: 0,
  initialized: false,
};

// ─── User Profile ─────────────────────────────────────────────────────────────
export interface UserProfile {
  userId: string;
  name?: string;
  goals: string[];
  allergies: string[];
  dietaryPreferences: string[];
  cookingSkill: "beginner" | "intermediate" | "advanced";
  budgetLevel: "low" | "medium" | "high";
  weeklySchedule?: string;
  culturalBackground?: string;
}

// ─── Messages (SQLite row shape) ──────────────────────────────────────────────
export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ChatRequest {
  message: string;
  attachment?: AttachmentPayload | null;
}

export interface AttachmentPayload {
  name: string;
  mimeType: string;
  base64: string;
}

export interface ProfileUpdateRequest {
  profile: Partial<UserProfile>;
}

// ─── Environment bindings (wrangler.jsonc → TypeScript) ──────────────────────
export interface Env {
  NUTRITION_CHAT_AGENT: DurableObjectNamespace;
  ANTHROPIC_API_KEY: string;
  ENVIRONMENT?: "development" | "production";
  ALLOWED_ORIGIN?: string; // defaults to "*"
}

// ─── SSE chunk sent to frontend ───────────────────────────────────────────────
export type StreamChunk =
  | { type: "text_delta"; content: string }
  | { type: "done" }
  | { type: "error"; error: string };
