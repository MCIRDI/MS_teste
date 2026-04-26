import type { BugReport, BugSeverity, BugStatus } from "@/generated/prisma/client";

export type BugGroup = {
  groupKey: string;
  title: string;
  feature?: string | null;
  errorType?: string | null;
  pageUrl?: string | null;
  severity: BugSeverity;
  status: BugStatus;
  representative: BugReport & { tester: { name: string; id: string } };
  count: number;
  duplicateCount: number;
  latestAt: Date;
  priorityScore: number;
  deviceLabel: string;
  testerRating: number;
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function diceCoefficient(a: string, b: string) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const grams = (s: string) => {
    const out: string[] = [];
    const padded = `  ${s}  `;
    for (let i = 0; i < padded.length - 2; i++) out.push(padded.slice(i, i + 3));
    return out;
  };

  const aGrams = grams(left);
  const bGrams = grams(right);
  const aCount = new Map<string, number>();
  for (const g of aGrams) aCount.set(g, (aCount.get(g) ?? 0) + 1);

  let matches = 0;
  for (const g of bGrams) {
    const count = aCount.get(g) ?? 0;
    if (count > 0) {
      aCount.set(g, count - 1);
      matches += 1;
    }
  }

  return (2 * matches) / (aGrams.length + bGrams.length);
}

export function severityWeight(severity: BugSeverity) {
  switch (severity) {
    case "CRITICAL":
      return 100;
    case "HIGH":
      return 70;
    case "MEDIUM":
      return 40;
    case "LOW":
    default:
      return 10;
  }
}

export function statusWeight(status: BugStatus) {
  switch (status) {
    case "SUBMITTED":
      return 30;
    case "NEEDS_INFO":
      return 20;
    case "DUPLICATE":
      return 5;
    case "APPROVED":
      return 10;
    case "REJECTED":
      return 0;
    case "VALIDATED":
      return 0;
    default:
      return 0;
  }
}

export function platformBoost(device: string, osVersion: string) {
  const hay = `${device} ${osVersion}`.toLowerCase();
  if (hay.includes("ios") || hay.includes("iphone") || hay.includes("ipad")) return 10;
  if (hay.includes("android") || hay.includes("pixel") || hay.includes("galaxy")) return 8;
  if (hay.includes("windows")) return 6;
  if (hay.includes("macos") || hay.includes("macbook") || hay.includes("imac") || hay.includes("mac ")) return 6;
  return 0;
}

export function computePriorityScore(input: {
  severity: BugSeverity;
  status: BugStatus;
  duplicateCount: number;
  testerRating: number;
  device: string;
  osVersion: string;
}) {
  const base = severityWeight(input.severity);
  const dup = clamp(input.duplicateCount, 0, 25) * 8;
  const rep = clamp(input.testerRating, 0, 5) * 6;
  const plat = platformBoost(input.device, input.osVersion);
  const queue = statusWeight(input.status);
  return Math.round(base + dup + rep + plat + queue);
}

export function makeGroupKey(bug: { title: string; feature?: string | null; errorType?: string | null; pageUrl?: string | null; }) {
  const title = normalizeText(bug.title);
  const feature = normalizeText(bug.feature ?? "");
  const errorType = normalizeText(bug.errorType ?? "");
  const page = normalizeText(bug.pageUrl ?? "");
  return `${feature}|${errorType}|${page}|${title}`;
}

export function severityRank(severity: BugSeverity) {
  return severityWeight(severity);
}
