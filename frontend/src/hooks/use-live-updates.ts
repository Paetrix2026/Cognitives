import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

function getSocketUrl() {
  const url = new URL("/ws", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function useLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let disposed = false;

    const connect = () => {
      socket = new WebSocket(getSocketUrl());

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { type?: string };
          if (message.type === "connected") {
            return;
          }
        } catch {
          // Ignore parse failures and still refresh queries below.
        }

        queryClient.invalidateQueries();
      };

      socket.onclose = () => {
        if (disposed) {
          return;
        }
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [queryClient]);
}
