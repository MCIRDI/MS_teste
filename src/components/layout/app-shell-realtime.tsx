"use client";

import type { ReactNode } from "react";

import { AppRealtimeProvider } from "@/components/app-realtime-provider";

export function AppShellRealtime({ children }: { children: ReactNode }) {
  return <AppRealtimeProvider>{children}</AppRealtimeProvider>;
}
