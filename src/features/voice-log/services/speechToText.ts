import { Platform } from "react-native";

const BACKEND_URL = (
  process.env.EXPO_PUBLIC_AI_BACKEND_URL ?? "http://localhost:8787"
).replace(/\/$/, "");

function getAudioFormat(): string {
  return Platform.OS === "web" ? "webm" : "m4a";
}

async function audioUriToBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    // On web, expo-av returns a blob: URL — fetch it and convert via FileReader
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native: read file directly as base64
  const FileSystem = await import("expo-file-system/legacy");
  return FileSystem.readAsStringAsync(uri, {
    encoding: "base64" as FileSystem.EncodingType,
  });
}

export async function speechToText(audioUri: string): Promise<string> {
  const base64 = await audioUriToBase64(audioUri);

  const res = await fetch(`${BACKEND_URL}/api/voice-stt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: base64, format: getAudioFormat() }),
  });

  if (!res.ok) throw new Error(`STT request failed: ${res.status}`);

  const json = (await res.json()) as { text: string };
  console.log("[STT] Whisper response:", JSON.stringify(json));
  return json.text ?? "";
}
