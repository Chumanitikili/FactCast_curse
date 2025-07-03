import { NextResponse } from "next/server";
// import WebSocket from "ws";
import { MultiModalWebSocketServer } from "@/lib/websocket/multi-modal-server";

// Initialize WebSocket server (requires an HTTP server instance in actual use)
let wss: MultiModalWebSocketServer | undefined;
if (typeof global !== 'undefined') {
  // This is a placeholder; actual instantiation should be done in a custom server entry point
  wss = undefined;
}

export const GET = () => {
  return NextResponse.json({ message: "WebSocket server is running" });
};

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const dynamicParams = true;

// Export the WebSocket server for testing
export { wss };
  