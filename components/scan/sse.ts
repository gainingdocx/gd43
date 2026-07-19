// Minimal SSE reader for the POST /api/parse stream (EventSource only does
// GET). Yields {event, data} pairs as they arrive.

export interface SseEvent {
  event: string;
  data: unknown;
}

export async function* readSse(
  response: Response
): AsyncGenerator<SseEvent, void, unknown> {
  if (!response.body) throw new Error("no response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        let event = "message";
        const dataLines: string[] = [];
        for (const line of chunk.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7).trim();
          else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
        }
        if (dataLines.length > 0) {
          try {
            yield { event, data: JSON.parse(dataLines.join("\n")) };
          } catch {
            // skip malformed frames
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
