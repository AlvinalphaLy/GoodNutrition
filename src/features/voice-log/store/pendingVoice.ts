// Module-level store that bridges voice parsing (home screen, outside
// MealsProvider) to the voice-confirm route (inside MealsProvider).
//
// This avoids serializing complex objects into URL params.
// The store is cleared immediately after voice-confirm reads it.

import type { ParsedVoiceResult } from "../types/voice";

let pending: ParsedVoiceResult | null = null;

export const pendingVoiceStore = {
  set(result: ParsedVoiceResult): void {
    pending = result;
  },
  get(): ParsedVoiceResult | null {
    return pending;
  },
  clear(): void {
    pending = null;
  },
};
