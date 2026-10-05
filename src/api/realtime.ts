import { WS_BASE_URL } from "./config";

export type StreamStatus = "connected" | "reconnecting" | "fallback";

export interface OrderStreamHandlers {
  path: string; // e.g. "/customer/realtime/ws"
  token: string;
  onEvent: (event: { type: string; order?: unknown }) => void;
  onStatus?: (status: StreamStatus) => void;
}

/**
 * Subscribe to the order WebSocket with capped reconnect backoff. After several
 * consecutive failures it reports "fallback" so the caller can poll the list
 * endpoint with ?updatedSince instead. Returns a cleanup function.
 */
export function openOrderStream(h: OrderStreamHandlers): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    const url = `${WS_BASE_URL}${h.path}?token=${encodeURIComponent(h.token)}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      failures = 0;
      h.onStatus?.("connected");
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (data && data.type && data.type !== "connected") h.onEvent(data);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onerror = () => {
      /* onclose handles reconnection */
    };
    ws.onclose = () => {
      if (closed) return;
      failures += 1;
      if (failures >= 4) {
        h.onStatus?.("fallback");
        return; // stop trying; caller polls
      }
      h.onStatus?.("reconnecting");
      const delay = Math.min(1000 * 2 ** failures, 15000);
      timer = setTimeout(connect, delay);
    };
  };

  connect();
  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    ws?.close();
  };
}
