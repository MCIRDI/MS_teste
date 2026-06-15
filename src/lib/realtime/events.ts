export type BugSeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ApprovedBugPayload = {
  id: string;
  campaignId: string;
  campaignName: string;
  title: string;
  severity: BugSeverityLevel;
  approvedAt: string;
};

export type RealtimeClientEvent = {
  type: "bug_approved";
  payload: ApprovedBugPayload;
};

export type RealtimeServerMessage =
  | { type: "connected"; clientId: string }
  | RealtimeClientEvent;

export type RealtimeAuthMessage = {
  type: "auth";
  token: string;
};

export type RealtimeBroadcastRequest = {
  clientId: string;
  event: RealtimeClientEvent;
};
