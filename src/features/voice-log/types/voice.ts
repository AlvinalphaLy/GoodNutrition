export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | null;

export type VoiceItem = {
  name: string;
  quantity: number;
  unit: string | null;
};

export type ParsedVoiceResult = {
  meal: MealType;
  items: VoiceItem[];
  confidence: number;
  rawText: string;
};

export type VoiceLogState =
  | { status: "idle" }
  | { status: "recording" }
  | { status: "processing" }
  | { status: "preview"; result: ParsedVoiceResult }
  | { status: "error"; message: string };
