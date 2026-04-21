import { Audio } from "expo-av";
import { Platform } from "react-native";

export type RecordingHandle = {
  stop: () => Promise<string>;
};

export async function startRecording(): Promise<RecordingHandle> {
  if (Platform.OS === "web") {
    return startWebRecording();
  }
  return startNativeRecording();
}

// ── Web: native MediaRecorder with proper audio constraints ───────────────────

async function startWebRecording(): Promise<RecordingHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 16000,
    },
  });

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const chunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start(100);

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: mimeType });
          resolve(URL.createObjectURL(blob));
        };
        mediaRecorder.onerror = reject;
        mediaRecorder.stop();
      }),
  };
}

// ── Native: expo-av ───────────────────────────────────────────────────────────

async function startNativeRecording(): Promise<RecordingHandle> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) throw new Error("Microphone permission denied");

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  // Give the mic buffer time to fully open before user speaks
  await new Promise((r) => setTimeout(r, 400));

  return {
    stop: async () => {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (!uri) throw new Error("No audio URI after recording");
      return uri;
    },
  };
}
