import type { ClassifyEvent } from "@/lib/types";

/** POST an image and yield live Render workflow events from the SSE body. */
export async function* classifyStream(imageBase64: string): AsyncGenerator<ClassifyEvent> {
  const response = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok || !response.body) {
    yield {
      type: "error",
      data: null,
      error: { code: "request_failed", message: "Not food. Try again." },
      meta: { status: response.status },
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const event = parseEvent(chunk);
      if (event) yield event;
    }
  }

  const trailing = parseEvent(buffer);
  if (trailing) yield trailing;
}

function parseEvent(chunk: string): ClassifyEvent | null {
  const line = chunk
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row.startsWith("data:"));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(5).trim()) as ClassifyEvent;
  } catch {
    return null;
  }
}
