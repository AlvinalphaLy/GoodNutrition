// Thin glue route — runs inside MealsProvider so it can call useMeals().
// Reads the parsed voice result from pendingVoiceStore, shows VoicePreview,
// and on confirmation commits items to the meal draft before navigating
// to the review screen.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { VoicePreview } from "../../../../src/features/voice-log/components/VoicePreview";
import { pendingVoiceStore } from "../../../../src/features/voice-log/store/pendingVoice";
import type { ParsedVoiceResult } from "../../../../src/features/voice-log/types/voice";
import { useMeals } from "../meals-context";

export default function VoiceConfirmScreen() {
  const router = useRouter();
  const { setMealType, setMealMethod, beginNewMealDraft, addMealItem } =
    useMeals();

  const [result, setResult] = useState<ParsedVoiceResult | null>(null);

  useEffect(() => {
    const pending = pendingVoiceStore.get();
    if (pending) {
      setResult(pending);
      pendingVoiceStore.clear();
    } else {
      // Nothing to preview — go back
      router.back();
    }
  }, []);

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
        calories:                  item.nutrition?.calories,
        protein:                   item.nutrition?.protein,
        carbs:                     item.nutrition?.carbs,
        fat:                       item.nutrition?.fat,
        saturated_fat:             item.nutrition?.saturated_fat,
        sugars:                    item.nutrition?.sugars,
        fiber:                     item.nutrition?.fiber,
        salt:                      item.nutrition?.salt,
        sodium:                    item.nutrition?.sodium,
        serving_size:              item.nutrition?.serving_size,
        brand:                     item.nutrition?.brand,
        nova_group:                item.nutrition?.nova_group,
        nutriscore_grade:          item.nutrition?.nutriscore_grade,
        additives_tags:            item.nutrition?.additives_tags,
        allergens_tags:            item.nutrition?.allergens_tags,
        ingredients_analysis_tags: item.nutrition?.ingredients_analysis_tags,
        nutrient_levels:           item.nutrition?.nutrient_levels,
        ingredients_text:          item.nutrition?.ingredients_text,
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
