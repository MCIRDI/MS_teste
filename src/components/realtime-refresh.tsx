"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

import { useAppRealtime } from "@/components/app-realtime-provider";

function hasEditableFocus() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.getAttribute("contenteditable") === "true"
  );
}

const FALLBACK_POLLING_MS = 30_000;

export function RealtimeRefresh({ fallbackIntervalMs = FALLBACK_POLLING_MS }: { fallbackIntervalMs?: number }) {
  const router = useRouter();
  const { connectionState, lastDataChangeAt } = useAppRealtime();

  useEffect(() => {
    if (!lastDataChangeAt || document.hidden || hasEditableFocus()) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }, [lastDataChangeAt, router]);

  useEffect(() => {
    if (connectionState === "connected") {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.hidden || hasEditableFocus()) {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    }, fallbackIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connectionState, fallbackIntervalMs, router]);

  return null;
}

/** @deprecated use RealtimeRefresh */
export function LiveRefresh({ intervalMs = FALLBACK_POLLING_MS }: { intervalMs?: number }) {
  return <RealtimeRefresh fallbackIntervalMs={intervalMs} />;
}
