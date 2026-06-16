import type { Role } from "@/generated/prisma";

export type BugSeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ApprovedBugPayload = {
  id: string;
  campaignId: string;
  campaignName: string;
  title: string;
  severity: BugSeverityLevel;
  approvedAt: string;
};

export type DataChangedPayload = {
  scope?: string;
};

export type RealtimeClientEvent =
  | { type: "bug_approved"; payload: ApprovedBugPayload }
  | { type: "data_changed"; payload: DataChangedPayload };

export type RealtimeServerMessage =
  | { type: "connected"; userId: string; role: Role }
  | RealtimeClientEvent;

export type RealtimeAuthMessage = {
  type: "auth";
  token: string;
};

export type RealtimeBroadcastRequest = {
  /** @deprecated use userIds */
  clientId?: string;
  userIds?: string[];
  roles?: Role[];
  event: RealtimeClientEvent;
};
