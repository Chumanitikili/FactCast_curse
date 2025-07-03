import { useEffect, useState } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketState {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

export function useWebSocket(): WebSocketState {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const initializeWebSocket = () => {
      ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001");

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    initializeWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (isConnected) {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001");
      ws.onopen = () => {
        ws.send(JSON.stringify(message));
      };
    }
  };

  return { isConnected, sendMessage };
}
