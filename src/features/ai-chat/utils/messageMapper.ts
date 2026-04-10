import { ChatMessage, MessageRole } from "../types/chat";

let counter = 0;

function generateId(): string {
  counter = (counter + 1) % 1_000_000;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createUserMessage(text: string): ChatMessage {
  return {
    id: generateId(),
    role: "user",
    content: text.trim(),
    timestamp: new Date().toISOString(),
  };
}

export function createAssistantPlaceholder(): ChatMessage {
  return {
    id: generateId(),
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
    isStreaming: true,
  };
}

export function appendChunk(message: ChatMessage, chunk: string): ChatMessage {
  return { ...message, content: message.content + chunk };
}

export function finalizeMessage(message: ChatMessage): ChatMessage {
  return { ...message, isStreaming: false };
}

export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Map raw API messages to ChatMessage (for loading history).
export function mapApiMessage(raw: {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}): ChatMessage {
  return {
    id: raw.id,
    role: raw.role as MessageRole,
    content: raw.content,
    timestamp: raw.timestamp,
    isStreaming: false,
  };
}
