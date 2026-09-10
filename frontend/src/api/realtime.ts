import { RealtimeEvent } from './types';

type Handler = (event: RealtimeEvent) => void;

/**
 * Stand-in for the WebSocket/real-time channel (spec §13).
 * The mock "backend" publishes through here; spectator views subscribe.
 * When the real backend exists, only this module changes (same subscribe API).
 */
const handlers = new Set<Handler>();

export const realtime = {
  subscribe(handler: Handler): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
  publish(event: RealtimeEvent) {
    handlers.forEach((h) => h(event));
  },
};
