import { BugStatus, Role } from "@/generated/prisma";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

import type { ApprovedBugPayload, RealtimeBroadcastRequest } from "./events";

function getRealtimeHttpUrl() {
  return process.env.REALTIME_HTTP_URL ?? "http://127.0.0.1:3031/broadcast";
}

function getRealtimeSecret() {
  return process.env.REALTIME_SECRET ?? env.JWT_SECRET;
}

export async function publishRealtimeEvent(body: RealtimeBroadcastRequest) {
  try {
    const response = await fetch(getRealtimeHttpUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getRealtimeSecret()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("[realtime] broadcast failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("[realtime] broadcast failed:", error);
  }
}

export async function notifyDataChanged(options: {
  userIds?: string[];
  roles?: Role[];
  scope?: string;
}) {
  await publishRealtimeEvent({
    userIds: options.userIds,
    roles: options.roles,
    event: {
      type: "data_changed",
      payload: { scope: options.scope },
    },
  });
}

export async function publishBugApproved(clientId: string, payload: ApprovedBugPayload) {
  await publishRealtimeEvent({
    userIds: [clientId],
    event: {
      type: "bug_approved",
      payload,
    },
  });
}

export async function notifyBugApproved(bugReportId: string) {
  const bug = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      moderatedAt: true,
      createdAt: true,
      campaign: {
        select: {
          id: true,
          projectName: true,
          clientId: true,
        },
      },
    },
  });

  if (!bug || bug.status !== BugStatus.APPROVED) {
    return;
  }

  await publishBugApproved(bug.campaign.clientId, {
    id: bug.id,
    campaignId: bug.campaign.id,
    campaignName: bug.campaign.projectName,
    title: bug.title,
    severity: bug.severity,
    approvedAt: (bug.moderatedAt ?? bug.createdAt).toISOString(),
  });

  await notifyDataChanged({
    roles: [Role.MODERATOR, Role.TEST_MANAGER, Role.ADMIN],
    scope: "bug_approved",
  });
}

export async function notifyBugsApproved(bugReportIds: string[]) {
  await Promise.all(bugReportIds.map((bugReportId) => notifyBugApproved(bugReportId)));
}
