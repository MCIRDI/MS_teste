"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { ApprovedBugPayload, RealtimeClientEvent, RealtimeServerMessage } from "@/lib/realtime/events";

type ConnectionState = "connecting" | "connected" | "disconnected";

type ClientRealtimeContextValue = {
  connectionState: ConnectionState;
  recentApprovedBugs: ApprovedBugPayload[];
};

const ClientRealtimeContext = createContext<ClientRealtimeContextValue>({
  connectionState: "disconnected",
  recentApprovedBugs: [],
});

const MAX_RECENT_EVENTS = 20;
const RECONNECT_DELAY_MS = 3000;

export function ClientRealtimeProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [recentApprovedBugs, setRecentApprovedBugs] = useState<ApprovedBugPayload[]>([]);
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const pushApprovedBug = useCallback((payload: ApprovedBugPayload) => {
    setRecentApprovedBugs((current) => {
      if (current.some((bug) => bug.id === payload.id)) {
        return current;
      }

      return [payload, ...current].slice(0, MAX_RECENT_EVENTS);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function connect() {
      if (!mountedRef.current) {
        return;
      }

      setConnectionState("connecting");

      try {
        const response = await fetch("/api/realtime/ws-token", { credentials: "include" });

        if (!response.ok) {
          setConnectionState("disconnected");
          return;
        }

        const credentials = (await response.json()) as {
          token: string;
          wsUrl: string;
        };

        const socket = new WebSocket(credentials.wsUrl);
        socketRef.current = socket;

        socket.addEventListener("open", () => {
          socket.send(JSON.stringify({ type: "auth", token: credentials.token }));
        });

        socket.addEventListener("message", (event) => {
          let message: RealtimeServerMessage;

          try {
            message = JSON.parse(String(event.data)) as RealtimeServerMessage;
          } catch {
            return;
          }

          if (message.type === "connected") {
            setConnectionState("connected");
            return;
          }

          if (message.type === "bug_approved") {
            pushApprovedBug((message as RealtimeClientEvent).payload);
          }
        });

        socket.addEventListener("close", () => {
          socketRef.current = null;
          setConnectionState("disconnected");

          if (mountedRef.current) {
            reconnectTimerRef.current = window.setTimeout(() => {
              void connect();
            }, RECONNECT_DELAY_MS);
          }
        });

        socket.addEventListener("error", () => {
          socket.close();
        });
      } catch {
        setConnectionState("disconnected");

        if (mountedRef.current) {
          reconnectTimerRef.current = window.setTimeout(() => {
            void connect();
          }, RECONNECT_DELAY_MS);
        }
      }
    }

    void connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [pushApprovedBug]);

  const value = useMemo(
    () => ({
      connectionState,
      recentApprovedBugs,
    }),
    [connectionState, recentApprovedBugs],
  );

  return <ClientRealtimeContext.Provider value={value}>{children}</ClientRealtimeContext.Provider>;
}

export function useClientRealtime() {
  return useContext(ClientRealtimeContext);
}
