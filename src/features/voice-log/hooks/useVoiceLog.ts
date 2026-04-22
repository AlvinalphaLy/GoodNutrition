import { useCallback, useRef, useState } from "react";
import { startRecording, type RecordingHandle } from "../services/recording";
import { speechToText } from "../services/speechToText";
import { parseVoiceText } from "../services/parseVoice";
import { lookupNutrition } from "../services/nutritionLookup";
import type { VoiceLogState } from "../types/voice";

type UseVoiceLogReturn = {
  state: VoiceLogState;
  startVoice: () => Promise<void>;
  stopVoice: () => Promise<void>;
  reset: () => void;
};

export function useVoiceLog(): UseVoiceLogReturn {
  const [state, setState] = useState<VoiceLogState>({ status: "idle" });
  const recordingRef = useRef<RecordingHandle | null>(null);

  const startVoice = useCallback(async () => {
    try {
      setState({ status: "recording" });
      recordingRef.current = await startRecording();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start recording";
      setState({ status: "error", message });
    }
  }, []);

  const stopVoice = useCallback(async () => {
    const handle = recordingRef.current;
    if (!handle) return;

    recordingRef.current = null;
    setState({ status: "processing" });

    try {
      const uri = await handle.stop();
      const text = await speechToText(uri);
      const result = await parseVoiceText(text);

      const itemsWithNutrition = await Promise.all(
        result.items.map(async (item) => {
          const nutrition = await lookupNutrition(item.name, item.quantity, item.unit);
          return nutrition ? { ...item, nutrition } : item;
        })
      );

      setState({ status: "preview", result: { ...result, items: itemsWithNutrition } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice processing failed";
      setState({ status: "error", message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, startVoice, stopVoice, reset };
}
