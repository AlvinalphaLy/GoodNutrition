// Thin glue route — runs inside MealsProvider so it can call useMeals().
// Reads the parsed voice result from pendingVoiceStore, shows VoicePreview,
// and on confirmation commits items to the meal draft before navigating
// to the review screen.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { VoicePreview } from "../../../../src/features/voice-log/components/VoicePreview";
import { pendingVoiceStore } from "../../../../src/features/voice-log/store/pendingVoice";
import type { ParsedVoiceResult } from "../../../../src/features/voice-log/types/voice";
import { adaptImportedNutrition } from "../nutrition";
import { useMeals } from "../meals-context";

export default function VoiceConfirmScreen() {
  const router = useRouter();
  const { setMealType, setMealMethod, beginNewMealDraft, addMealItem } = useMeals();

  const [result, setResult] = useState<ParsedVoiceResult | null>(null);

  useEffect(() => {
    const pending = pendingVoiceStore.get();
    if (pending) {
      setResult(pending);
      pendingVoiceStore.clear();
    } else {
      router.back();
    }
  }, [router]);

  function handleConfirm(parsed: ParsedVoiceResult) {
    beginNewMealDraft();

    if (parsed.meal) setMealType(parsed.meal);
    setMealMethod("Voice");

    parsed.items.forEach((item) =>
      addMealItem({
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit ?? "serving",
        entryKind: "single",
        sourceType: "manual",
        nutrition: adaptImportedNutrition(item.nutrition),
      })
    );

    router.replace("/meals/log-meal/review");
  }

  function handleDismiss() {
    router.back();
  }

  if (!result) return null;

  return (
    <VoicePreview
      result={result}
      onConfirm={handleConfirm}
      onDismiss={handleDismiss}
    />
  );
}
