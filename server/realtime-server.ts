import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { WebSocket, WebSocketServer } from "ws";

import type { Role } from "../src/generated/prisma";
import type { RealtimeAuthMessage, RealtimeBroadcastRequest, RealtimeServerMessage } from "../src/lib/realtime/events";
import { verifySessionToken } from "../src/lib/realtime/session-token";

const REALTIME_PORT = Number(process.env.REALTIME_PORT ?? 3031);
const REALTIME_SECRET = process.env.REALTIME_SECRET ?? process.env.JWT_SECRET ?? "";

type ClientSocket = WebSocket & {
  userId?: string;
  role?: Role;
  authenticated?: boolean;
  rooms?: Set<string>;
};

const rooms = new Map<string, Set<ClientSocket>>();

function roomKey(kind: "user" | "role", id: string) {
  return `${kind}:${id}`;
}

function addToRoom(key: string, socket: ClientSocket) {
  const room = rooms.get(key) ?? new Set<ClientSocket>();
  room.add(socket);
  rooms.set(key, room);
  socket.rooms ??= new Set();
  socket.rooms.add(key);
}

function removeFromRoom(socket: ClientSocket) {
  if (!socket.rooms) {
    return;
  }

  for (const key of socket.rooms) {
    const room = rooms.get(key);
    if (!room) {
      continue;
    }

    room.delete(socket);
    if (room.size === 0) {
      rooms.delete(key);
    }
  }

  socket.rooms.clear();
}

function broadcastToRoom(key: string, event: RealtimeServerMessage) {
  const room = rooms.get(key);
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

function broadcastEvent(request: RealtimeBroadcastRequest) {
  const userIds = new Set<string>();

  if (request.clientId) {
    userIds.add(request.clientId);
  }

  for (const userId of request.userIds ?? []) {
    userIds.add(userId);
  }

  for (const userId of userIds) {
    broadcastToRoom(roomKey("user", userId), request.event);
  }

  for (const role of request.roles ?? []) {
    broadcastToRoom(roomKey("role", role), request.event);
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

function isValidEvent(body: RealtimeBroadcastRequest | null): body is RealtimeBroadcastRequest {
  if (!body?.event?.type) {
    return false;
  }

  const hasTarget =
    Boolean(body.clientId) ||
    Boolean(body.userIds?.length) ||
    Boolean(body.roles?.length);

  if (!hasTarget) {
    return false;
  }

  if (body.event.type === "bug_approved") {
    return Boolean(body.event.payload?.id);
  }

  return body.event.type === "data_changed";
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

    if (!isValidEvent(body)) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid broadcast payload." }));
      return;
    }

    broadcastEvent(body);
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

    if (!session) {
      socket.close(1008, "Valid session required.");
      return;
    }

    socket.authenticated = true;
    socket.userId = session.id;
    socket.role = session.role;
    addToRoom(roomKey("user", session.id), socket);
    addToRoom(roomKey("role", session.role), socket);

    const connected: RealtimeServerMessage = {
      type: "connected",
      userId: session.id,
      role: session.role,
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
