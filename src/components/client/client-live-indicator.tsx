"use client";

import { useAppRealtime } from "@/components/app-realtime-provider";
import { cn } from "@/lib/utils";

export function ClientLiveIndicator({ className }: { className?: string }) {
  const { connectionState } = useAppRealtime();

  const label =
    connectionState === "connected"
      ? "Live updates active"
      : connectionState === "connecting"
        ? "Connecting to live updates"
        : "Live updates unavailable";

  const dotClass =
    connectionState === "connected"
      ? "bg-emerald-500"
      : connectionState === "connecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-slate-300";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm",
        className,
      )}
      aria-live="polite"
    >
      <span className={cn("h-2 w-2 rounded-full", dotClass)} aria-hidden />
      {label}
    </div>
  );
}
