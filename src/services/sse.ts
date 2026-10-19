import type { AgentEvent } from "@/types/agents";

export type SSEMessage =
  | { type: "message"; data: AgentEvent }
  | { type: "error"; data: { message: string } };

// In-memory SSE subscriber map per reelId
const subscribers = new Map<string, Set<(event: SSEMessage) => void>>();

export function subscribeToReel(
  reelId: string,
  callback: (event: SSEMessage) => void,
): () => void {
  if (!subscribers.has(reelId)) {
    subscribers.set(reelId, new Set());
  }
  subscribers.get(reelId)!.add(callback);

  return () => {
    subscribers.get(reelId)?.delete(callback);
    if (subscribers.get(reelId)?.size === 0) {
      subscribers.delete(reelId);
    }
  };
}

export function emitSSEEvent(reelId: string, event: AgentEvent): void {
  const reelSubscribers = subscribers.get(reelId);
  if (reelSubscribers) {
    const message: SSEMessage = { type: "message", data: event };
    for (const cb of reelSubscribers) {
      cb(message);
    }
  }
}

export function emitSSEError(reelId: string, errorMessage: string): void {
  const reelSubscribers = subscribers.get(reelId);
  if (reelSubscribers) {
    const message: SSEMessage = {
      type: "error",
      data: { message: errorMessage },
    };
    for (const cb of reelSubscribers) {
      cb(message);
    }
  }
}

export function createSSEResponse(reelId: string): Response {
  const encoder = new TextEncoder();
  let unsubscribe: () => void;
  let heartbeat: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const send = (message: SSEMessage) => {
        let payload = "";
        if (message.type === "error") {
          payload += `event: error\n`;
          payload += `data: ${JSON.stringify(message.data)}\n\n`;
        } else {
          // Default event type is 'message'
          payload += `data: ${JSON.stringify(message.data)}\n\n`;
        }
        controller.enqueue(encoder.encode(payload));
      };

      // Send heartbeat every 30s
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30000);

      unsubscribe = subscribeToReel(reelId, send);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
