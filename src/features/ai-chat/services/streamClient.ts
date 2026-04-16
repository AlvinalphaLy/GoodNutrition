import { StreamChunk } from "../types/chat";

export interface StreamOptions {
  url: string;
  message: string;
  attachment?: {
    name: string;
    mimeType: string;
    base64: string;
  } | null;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

/**
 * Sends a chat message and reads the SSE response using XMLHttpRequest.
 *
 * React Native's fetch() does not expose response.body / getReader(), so we
 * use XHR instead. XHR fires onreadystatechange with readyState=3 (LOADING)
 * as data arrives, giving us incremental chunks on both Android and iOS.
 */
export function streamChatMessage(options: StreamOptions): void {
  const { url, message, attachment, onChunk, onDone, onError, signal } =
    options;

  if (signal?.aborted) return;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Accept", "text/event-stream");

  let processedLength = 0;
  let buffer = "";
  let settled = false;

  const resolve = (cb: () => void) => {
    if (settled) return;
    settled = true;
    cb();
  };

  // Wire up abort signal
  const onAbort = () => xhr.abort();
  signal?.addEventListener("abort", onAbort);

  const cleanup = () => signal?.removeEventListener("abort", onAbort);

  xhr.onreadystatechange = () => {
    // readyState 3 = LOADING (partial data), 4 = DONE
    if (xhr.readyState < 3) return;

    // Consume only the new slice of responseText
    const newText = xhr.responseText.slice(processedLength);
    processedLength = xhr.responseText.length;

    buffer += newText;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();

      if (raw === "[DONE]") {
        cleanup();
        resolve(onDone);
        return;
      }

      try {
        const chunk = JSON.parse(raw) as StreamChunk;
        if (chunk.type === "text_delta" && chunk.content) {
          onChunk(chunk.content);
        } else if (chunk.type === "done") {
          cleanup();
          resolve(onDone);
          return;
        } else if (chunk.type === "error") {
          cleanup();
          resolve(() =>
            onError(new Error(chunk.error ?? "Stream error from server.")),
          );
          return;
        }
      } catch {
        // malformed SSE line — skip
      }
    }

    if (xhr.readyState === 4) {
      cleanup();
      if (xhr.status === 0) {
        // network failure or aborted
        if (!signal?.aborted) {
          resolve(() =>
            onError(new Error("Network error — check your connection.")),
          );
        } else {
          resolve(onDone); // aborted intentionally — treat as clean stop
        }
      } else if (xhr.status >= 400) {
        resolve(() => onError(new Error(`Server error ${xhr.status}`)));
      } else {
        resolve(onDone);
      }
    }
  };

  xhr.onerror = () => {
    cleanup();
    resolve(() => onError(new Error("Network error — check your connection.")));
  };

  xhr.onabort = () => {
    cleanup();
    resolve(onDone);
  };

  xhr.send(JSON.stringify({ message, attachment }));
}
