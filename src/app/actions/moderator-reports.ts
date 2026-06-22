"use server";

import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BugStatus } from "@/generated/prisma";

/**
 * Moderator submits (or updates) their structured report for a campaign.
 * The TEST_MANAGER will see this when composing the final PDF.
 */
export async function submitModeratorReportAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession(["MODERATOR"]);

  const campaignId      = String(formData.get("campaignId") ?? "");
  const summary         = String(formData.get("summary") ?? "").trim();
  const observations    = String(formData.get("observations") ?? "").trim();
  const recommendations = String(formData.get("recommendations") ?? "").trim();

  if (!campaignId || !summary) {
    return { success: false, message: "Campaign and summary are required." };
  }

  // Verify the moderator is actually assigned
  const assignment = await prisma.campaignAssignment.findFirst({
    where: { campaignId, userId: session.id, assignmentRole: "MODERATOR" },
  });
  if (!assignment) {
    return { success: false, message: "You are not assigned as moderator for this campaign." };
  }

  // Compute live stats from DB
  const stats = await prisma.bugReport.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { campaignId, moderatorId: session.id },
  });

  const getCount = (status: string) =>
    stats.find((s) => s.status === status)?._count._all ?? 0;

  const totalReviewed =
    getCount(BugStatus.APPROVED) +
    getCount(BugStatus.REJECTED) +
    getCount(BugStatus.DUPLICATE) +
    getCount(BugStatus.NEEDS_INFO);

  await prisma.moderatorReport.upsert({
    where: { campaignId_moderatorId: { campaignId, moderatorId: session.id } },
    create: {
      campaignId,
      moderatorId: session.id,
      summary,
      observations,
      recommendations,
      totalReviewed,
      approved:   getCount(BugStatus.APPROVED),
      rejected:   getCount(BugStatus.REJECTED),
      duplicates: getCount(BugStatus.DUPLICATE),
    },
    update: {
      summary,
      observations,
      recommendations,
      totalReviewed,
      approved:   getCount(BugStatus.APPROVED),
      rejected:   getCount(BugStatus.REJECTED),
      duplicates: getCount(BugStatus.DUPLICATE),
    },
  });

  revalidatePath(`/moderator/campaigns/${campaignId}`);
  revalidatePath("/manager/reports");

  return await redirectTo(`/moderator/campaigns/${campaignId}`);
}
