"use server";

import { AssignmentRole, CampaignStage, InvitationStatus, Role, SoftwareType } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import type { ActionState } from "@/app/actions/auth";
import { requireSession } from "@/lib/auth";
import { acceptCampaignInvitation, inviteCampaignParticipants } from "@/lib/campaigns";
import { estimateCampaignPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { splitList } from "@/lib/utils";
import { createCampaignSchema } from "@/lib/validation";
import { notifyDataChanged } from "@/lib/realtime/publish";

export async function createCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession([Role.CLIENT]);

  const fileEntry = formData.get("softwareFile");
  const softwareFile =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : undefined;

  const parsed = createCampaignSchema.safeParse({
    projectName: formData.get("projectName"),
    description: formData.get("description"),
    softwareType: formData.get("softwareType"),
    websiteUrl: formData.get("websiteUrl"),
    testerLoginCredentials: formData.get("testerLoginCredentials"),
    selectedPlatforms: splitList(String(formData.get("selectedPlatforms") ?? "")),
    selectedBrowsers: splitList(String(formData.get("selectedBrowsers") ?? "")),
    targetCountries: splitList(String(formData.get("targetCountries") ?? "")),
    crowdTesterCount: formData.get("crowdTesterCount"),
    certTesterCount: formData.get("certTesterCount"),
    tasks: splitList(String(formData.get("tasks") ?? "")),
    softwareFilePath: undefined,
    isPremium: formData.get("isPremium") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fill in the required campaign details.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const price = estimateCampaignPrice({
    crowdTesterCount: parsed.data.crowdTesterCount,
    certTesterCount: parsed.data.certTesterCount,
    countries: parsed.data.targetCountries,
    platforms: parsed.data.selectedPlatforms,
    browsers: parsed.data.selectedBrowsers,
    isPremium: parsed.data.isPremium,
  });

  const uploaded = softwareFile ? await saveUpload(softwareFile, "attachments") : null;

  const campaign = await prisma.campaign.create({
    data: {
      clientId: session.id,
      projectName: parsed.data.projectName,
      description: parsed.data.description,
      softwareType: parsed.data.softwareType as SoftwareType,
      websiteUrl: parsed.data.websiteUrl || null,
      downloadPath: uploaded?.relativePath ?? null,
      testerCredentials: parsed.data.testerLoginCredentials
        ? { value: parsed.data.testerLoginCredentials }
        : undefined,
      stage: CampaignStage.PENDING_APPROVAL,
      isPremium: parsed.data.isPremium ?? false,
      crowdTesterCount: parsed.data.crowdTesterCount,
      certTesterCount: parsed.data.certTesterCount,
      targetCountries: parsed.data.targetCountries,
      selectedPlatforms: parsed.data.selectedPlatforms,
      selectedBrowsers: parsed.data.selectedBrowsers,
      estimatedCost: price.estimatedCost,
      moderatorSlots: price.moderatorSlots,
      requirements: {
        taskCount: parsed.data.tasks.length,
      },
      tasks: {
        create: parsed.data.tasks.map((task, index) => ({
          title: `Task ${index + 1}`,
          description: task,
          orderIndex: index + 1,
        })),
      },
      auditLogs: {
        create: {
          actorId: session.id,
          action: "CAMPAIGN_CREATED",
          entityType: "Campaign",
          entityId: "pending",
          metadata: price,
        },
      },
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/campaigns");
  return await redirectTo("/client/dashboard");
}

/**
 * Allowed manual transitions for TEST_MANAGER and ADMIN via the
 * "Mark completed" quick-action button.
 *
 * The ACTIVE → BUG_REVIEW transition is automatic (triggered by the first bug
 * submission) and is NOT exposed as a manual action.
 *
 * The edit-icon flow (forceStage=true) bypasses this map and allows any stage.
 */
const ALLOWED_MANUAL_TRANSITIONS: Partial<Record<CampaignStage, CampaignStage[]>> = {
  [CampaignStage.ACTIVE]: [CampaignStage.COMPLETED],
  [CampaignStage.TESTING]: [CampaignStage.COMPLETED],
  [CampaignStage.BUG_REVIEW]: [CampaignStage.COMPLETED],
};

const ALL_STAGES = Object.values(CampaignStage);

export async function updateCampaignStageAction(formData: FormData): Promise<void> {
  const session = await requireSession([Role.TEST_MANAGER, Role.ADMIN]);
  const campaignId = String(formData.get("campaignId") ?? "");
  const targetStage = String(formData.get("stage") ?? "") as CampaignStage;
  // forceStage=true is sent by the edit-icon flow to allow any stage.
  const forceStage = formData.get("forceStage") === "true";

  if (!campaignId || !targetStage || !ALL_STAGES.includes(targetStage)) return;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, stage: true, testManagerId: true },
  });

  if (!campaign) return;

  // TEST_MANAGER can only update campaigns they manage; ADMIN can update any.
  if (session.role === Role.TEST_MANAGER && campaign.testManagerId !== session.id) return;

  if (!forceStage) {
    const allowed = ALLOWED_MANUAL_TRANSITIONS[campaign.stage] ?? [];
    if (!allowed.includes(targetStage)) return;
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { stage: targetStage },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/campaigns");
  revalidatePath("/manager/dashboard");
  revalidatePath(`/manager/campaigns/${campaignId}`);
  revalidatePath("/moderator/review-queue");

  await notifyDataChanged({
    roles: [Role.ADMIN, Role.TEST_MANAGER],
    scope: "campaign_stage_updated",
  });
}

export async function acceptInvitationAction(formData: FormData) {
  const session = await requireSession([
    Role.TESTER,
    Role.CERT_TESTER,
    Role.MODERATOR,
    Role.TEST_MANAGER,
  ]);
  const invitationId = String(formData.get("invitationId") ?? "");
  const result = await acceptCampaignInvitation(invitationId, session);

  revalidatePath("/tester/campaigns");
  revalidatePath("/manager/dashboard");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/admin/campaigns");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/reports");

  if (result.campaignId) {
    revalidatePath(`/tester/workspace/${result.campaignId}`);
    revalidatePath(`/moderator/campaigns/${result.campaignId}`);
  }
}

export async function sendManualInvitationsAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession([Role.ADMIN, Role.TEST_MANAGER]);

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const assignmentRole = String(formData.get("assignmentRole") ?? "") as AssignmentRole;
  const recipientIds = formData.getAll("recipientIds").map(String).filter(Boolean);

  if (!campaignId) return { success: false, message: "Campaign ID is required." };
  if (!Object.values(AssignmentRole).includes(assignmentRole)) {
    return { success: false, message: "Invalid assignment role." };
  }
  if (recipientIds.length === 0) return { success: false, message: "Select at least one person." };

  // TEST_MANAGER may only staff their own campaigns
  if (session.role === Role.TEST_MANAGER) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { testManagerId: true },
    });
    if (!campaign || campaign.testManagerId !== session.id) {
      return { success: false, message: "Access denied." };
    }
    // TEST_MANAGER cannot invite other TEST_MANAGERs
    if (assignmentRole === AssignmentRole.TEST_MANAGER) {
      return { success: false, message: "Only admins can invite test managers." };
    }
  }

  // Skip already-invited or already-assigned recipients
  const [existing, assigned] = await Promise.all([
    prisma.campaignInvitation.findMany({
      where: {
        campaignId,
        recipientId: { in: recipientIds },
        assignmentRole,
        status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
      },
      select: { recipientId: true },
    }),
    prisma.campaignAssignment.findMany({
      where: {
        campaignId,
        userId: { in: recipientIds },
        assignmentRole,
      },
      select: { userId: true },
    }),
  ]);

  const skipIds = new Set([
    ...existing.map((e) => e.recipientId),
    ...assigned.map((a) => a.userId),
  ]);

  const toCreate = recipientIds.filter((id) => !skipIds.has(id));

  if (toCreate.length === 0) {
    return { success: false, message: "All selected users are already invited or assigned." };
  }

  await prisma.campaignInvitation.createMany({
    data: toCreate.map((recipientId) => ({
      campaignId,
      recipientId,
      assignmentRole,
      status: InvitationStatus.PENDING,
    })),
  });

  revalidatePath("/admin/campaigns");
  revalidatePath("/manager/dashboard");
  revalidatePath(`/manager/campaigns/${campaignId}`);
  revalidatePath("/moderator/review-queue");
  revalidatePath("/tester/campaigns");

  await notifyDataChanged({
    roles: [Role.ADMIN, Role.TEST_MANAGER],
    scope: "invitations_sent",
  });

  return {
    success: true,
    message: `${toCreate.length} invitation${toCreate.length > 1 ? "s" : ""} sent.`,
  };
}
