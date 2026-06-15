import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { WebSocket, WebSocketServer } from "ws";

import type { RealtimeAuthMessage, RealtimeBroadcastRequest, RealtimeServerMessage } from "../src/lib/realtime/events";
import { verifySessionToken } from "../src/lib/realtime/session-token";

const REALTIME_PORT = Number(process.env.REALTIME_PORT ?? 3031);
const REALTIME_SECRET = process.env.REALTIME_SECRET ?? process.env.JWT_SECRET ?? "";

type ClientSocket = WebSocket & {
  clientId?: string;
  authenticated?: boolean;
};

const rooms = new Map<string, Set<ClientSocket>>();

function addToRoom(clientId: string, socket: ClientSocket) {
  const room = rooms.get(clientId) ?? new Set<ClientSocket>();
  room.add(socket);
  rooms.set(clientId, room);
}

function removeFromRoom(socket: ClientSocket) {
  if (!socket.clientId) {
    return;
  }

  const room = rooms.get(socket.clientId);
  if (!room) {
    return;
  }

  room.delete(socket);
  if (room.size === 0) {
    rooms.delete(socket.clientId);
  }
}

function broadcastToClient(clientId: string, event: RealtimeServerMessage) {
  const room = rooms.get(clientId);
  if (!room) {
    return;
  }

  const payload = JSON.stringify(event);

  for (const socket of room) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    return null;
  }
}

function isAuthorized(request: IncomingMessage) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return Boolean(REALTIME_SECRET) && token === REALTIME_SECRET;
}

async function handleHttpRequest(request: IncomingMessage, response: ServerResponse) {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && request.url === "/broadcast") {
    if (!isAuthorized(request)) {
      response.writeHead(401, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Unauthorized." }));
      return;
    }

    const body = await readJsonBody<RealtimeBroadcastRequest>(request);

    if (!body?.clientId || body.event?.type !== "bug_approved" || !body.event.payload?.id) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid broadcast payload." }));
      return;
    }

    broadcastToClient(body.clientId, body.event);
    response.writeHead(202, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "Not found." }));
}

const httpServer = createServer((request, response) => {
  void handleHttpRequest(request, response);
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket, head) => {
  if (request.url !== "/ws") {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (socket: ClientSocket) => {
  socket.on("message", async (raw) => {
    if (socket.authenticated) {
      return;
    }

    let message: RealtimeAuthMessage;

    try {
      message = JSON.parse(raw.toString()) as RealtimeAuthMessage;
    } catch {
      socket.close(1008, "Invalid auth payload.");
      return;
    }

    if (message.type !== "auth" || !message.token) {
      socket.close(1008, "Authentication required.");
      return;
    }

    const session = await verifySessionToken(message.token);

    if (!session || session.role !== "CLIENT") {
      socket.close(1008, "Client session required.");
      return;
    }

    socket.authenticated = true;
    socket.clientId = session.id;
    addToRoom(session.id, socket);

    const connected: RealtimeServerMessage = {
      type: "connected",
      clientId: session.id,
    };
    socket.send(JSON.stringify(connected));
  });

  socket.on("close", () => {
    removeFromRoom(socket);
  });
});

httpServer.listen(REALTIME_PORT, () => {
  console.log(`[realtime] listening on http://127.0.0.1:${REALTIME_PORT} (ws: /ws, broadcast: /broadcast)`);
});
