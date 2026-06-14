"use server";

import { BugStatus, DisputeStatus, Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAdmins, notifyModerators } from "@/lib/notifications";

export async function createDisputeAction(formData: FormData) {
  const session = await requireSession([Role.CLIENT]);
  const bugReportId = String(formData.get("bugReportId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!bugReportId || reason.length < 10) {
    return;
  }

  const bugReport = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
    include: { campaign: true, dispute: true },
  });

  if (!bugReport || bugReport.campaign.clientId !== session.id || bugReport.dispute) {
    return;
  }

  if (bugReport.status !== BugStatus.APPROVED) {
    return;
  }

  await prisma.dispute.create({
    data: {
      bugReportId,
      clientId: session.id,
      reason,
    },
  });

  await notifyModerators(
    `Dispute opened on bug "${bugReport.title}" for campaign ${bugReport.campaign.projectName}.`,
    "dispute_opened",
    { bugReportId, campaignId: bugReport.campaignId },
  );

  revalidatePath("/client/reports");
  revalidatePath("/moderator/disputes");
}

export async function resolveDisputeAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR, Role.ADMIN]);
  const disputeId = String(formData.get("disputeId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const resolution = String(formData.get("resolution") ?? "").trim();

  if (!disputeId || !resolution) {
    return;
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      bugReport: {
        include: { campaign: true, tester: true },
      },
    },
  });

  if (!dispute || dispute.status !== DisputeStatus.OPEN) {
    return;
  }

  if (session.role === Role.MODERATOR && dispute.moderatorId && dispute.moderatorId !== session.id) {
    return;
  }

  const maintainBug = decision === "maintain";
  const nextBugStatus = maintainBug ? BugStatus.APPROVED : BugStatus.REJECTED;

  await prisma.$transaction(async (tx) => {
    await tx.bugReport.update({
      where: { id: dispute.bugReportId },
      data: {
        status: nextBugStatus,
        moderatorId: session.id,
        moderationNotes: resolution,
        moderatedAt: new Date(),
      },
    });

    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        moderatorId: session.role === Role.MODERATOR ? session.id : dispute.moderatorId,
        adminId: session.role === Role.ADMIN ? session.id : undefined,
        resolution,
        resolvedAt: new Date(),
      },
    });
  });

  await createNotification({
    userId: dispute.bugReport.testerId,
    message: maintainBug
      ? `Dispute resolved: your bug "${dispute.bugReport.title}" was maintained.`
      : `Dispute resolved: your bug "${dispute.bugReport.title}" was rejected.`,
    type: "dispute_resolved_tester",
    metadata: { bugReportId: dispute.bugReportId, decision },
  });

  await createNotification({
    userId: dispute.clientId,
    message: maintainBug
      ? `Dispute resolved in favor of the tester for "${dispute.bugReport.title}".`
      : `Dispute resolved in your favor for "${dispute.bugReport.title}".`,
    type: "dispute_resolved_client",
    metadata: { bugReportId: dispute.bugReportId, decision },
  });

  revalidatePath("/moderator/disputes");
  revalidatePath("/admin/disputes");
  revalidatePath("/client/reports");
  revalidatePath("/moderator/review-queue");
}

export async function escalateDisputeAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR]);
  const disputeId = String(formData.get("disputeId") ?? "");

  if (!disputeId) {
    return;
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { bugReport: { include: { campaign: true } } },
  });

  if (!dispute || dispute.status !== DisputeStatus.OPEN) {
    return;
  }

  await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: DisputeStatus.ESCALATED,
      moderatorId: session.id,
      escalatedAt: new Date(),
    },
  });

  await notifyAdmins(
    `Dispute escalated on "${dispute.bugReport.title}" — admin decision required.`,
    "dispute_escalated",
    { disputeId, bugReportId: dispute.bugReportId },
  );

  revalidatePath("/moderator/disputes");
  revalidatePath("/admin/disputes");
}
