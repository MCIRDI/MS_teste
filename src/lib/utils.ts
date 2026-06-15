import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { formatMoney, type DisplayCurrency } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** @deprecated Prefer formatMoney from @/lib/currency or useDisplayCurrency().format */
export function formatCurrency(value: number, currency: DisplayCurrency = "USD", locale = "en-US") {
  return formatMoney(value, currency, locale);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function calculateModeratorSlots(totalTesters: number) {
  return Math.max(1, Math.ceil(totalTesters / 50));
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return splitList(value);
  }

  return [];
}
