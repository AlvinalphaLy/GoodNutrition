import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChatMessage,
  DEFAULT_PROFILE,
  UseAiChatOptions,
  UseAiChatReturn,
  UserProfile,
} from "../types/chat";
import { chatStreamUrl, getSessionMessages, updateSessionProfile } from "../services/chatApi";
import { streamChatMessage } from "../services/streamClient";
import {
  appendChunk,
  createAssistantPlaceholder,
  createUserMessage,
  finalizeMessage,
} from "../utils/messageMapper";

export function useAiChat({
  profile,
  initialSessionId,
}: UseAiChatOptions = {}): UseAiChatReturn {
  // Stable session ID — generated once, stable across re-renders.
  const sessionId = useMemo<string>(() => {
    if (initialSessionId) return initialSessionId;
    const uid = profile?.userId ?? `anon`;
    return `${uid}-${Date.now()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Track the placeholder message ID so we can update it during streaming.
  const streamingIdRef = useRef<string | null>(null);

  // ── Sync profile to backend whenever it changes ───────────────────────────
  const profileRef = useRef<Partial<UserProfile> & { userId: string } | undefined>(profile);
  if (profile && profile !== profileRef.current) {
    profileRef.current = profile;
    const fullProfile: UserProfile = { ...DEFAULT_PROFILE, ...profile, userId: profile.userId };
    updateSessionProfile(sessionId, fullProfile).catch(() => {
      // Non-fatal — the backend stores profile on first chat too
    });
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      const userMsg = createUserMessage(trimmed);
      const placeholder = createAssistantPlaceholder();
      streamingIdRef.current = placeholder.id;

      setMessages((prev) => [...prev, userMsg, placeholder]);

      const controller = new AbortController();
      abortRef.current = controller;

      streamChatMessage({
        url: chatStreamUrl(sessionId),
        message: trimmed,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingIdRef.current ? appendChunk(m, chunk) : m
            )
          );
        },
        onDone: () => {
          // Capture before nulling — React 18 batches updater functions and
          // runs them during render, by which time the ref would already be null.
          const id = streamingIdRef.current;
          streamingIdRef.current = null;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? finalizeMessage(m) : m))
          );
          setIsStreaming(false);
        },
        onError: (err) => {
          const id = streamingIdRef.current;
          streamingIdRef.current = null;
          // Remove the empty placeholder so the list stays clean
          setMessages((prev) => prev.filter((m) => m.id !== id));
          setError(err.message);
          setIsStreaming(false);
        },
      });
    },
    [isStreaming, sessionId]
  );

  // ── Load history from backend ─────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const history = await getSessionMessages(sessionId);
      if (history.length > 0) setMessages(history);
    } catch {
      // Silently skip — this fires on mount and will fail when the backend
      // isn't running yet. Don't show an error banner before the user does
      // anything. The next sendMessage will surface real connection errors.
    }
  }, [sessionId]);

  // ── Stop in-flight stream ─────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    const id = streamingIdRef.current;
    streamingIdRef.current = null;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? finalizeMessage(m) : m))
    );
    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isStreaming,
    error,
    sessionId,
    sendMessage,
    loadHistory,
    clearError,
    stopStream,
  };
}
