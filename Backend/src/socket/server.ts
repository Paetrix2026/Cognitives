import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../lib/logger";
import { registerSocketHandlers } from "./handlers";
import { publishLedgerEvent, subscribeToLedgerEvents, type LedgerRealtimeEvent } from "./events";

function serialize(event: LedgerRealtimeEvent) {
  return JSON.stringify(event);
}

export function attachRealtimeServer(server: Server) {
  const { path } = registerSocketHandlers();
  const wss = new WebSocketServer({ server, path });

  wss.on("connection", (socket) => {
    socket.send(
      serialize({
        type: "connected",
        timestamp: new Date().toISOString(),
      }),
    );
  });

  const unsubscribe = subscribeToLedgerEvents((event) => {
    const payload = serialize(event);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  wss.on("close", unsubscribe);
  logger.info({ path }, "Realtime WebSocket server attached");

  return wss;
}

export { publishLedgerEvent };
