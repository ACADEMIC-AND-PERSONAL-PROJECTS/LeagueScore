import { RealtimeEvent } from './types';

type Handler = (event: RealtimeEvent) => void;
const handlers = new Set<Handler>();
let socket: WebSocket | null = null;
let pollTimer: number | null = null;

const websocketUrl = () => {
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1')
    .replace(/^http/, 'ws')
    .replace(/\/api\/v1$/, '');
  return `${base}/ws`;
};

export const realtime = {
  subscribe(handler: Handler): () => void {
    handlers.add(handler);
    this.connect();
    return () => handlers.delete(handler);
  },
  connect() {
    if (socket || typeof WebSocket === 'undefined') return;
    socket = new WebSocket(websocketUrl());
    socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as RealtimeEvent;
      handlers.forEach((handler) => handler(event));
    };
    socket.onclose = () => {
      socket = null;
      if (pollTimer !== null) window.clearInterval(pollTimer);
      pollTimer = null;
    };
    pollTimer = window.setInterval(() => socket?.send('poll'), 1000);
  },
  publish(event: RealtimeEvent) {
    handlers.forEach((handler) => handler(event));
  },
};
