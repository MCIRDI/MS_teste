"use server";

import { CampaignStage, Role, SoftwareType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/app/actions/auth";
import { requireSession } from "@/lib/auth";
import { assignCampaignStaff, inviteMatchingTesters } from "@/lib/campaigns";
import { estimateCampaignPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { splitList } from "@/lib/utils";
import { createCampaignSchema } from "@/lib/validation";

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
    selectedCountries: splitList(String(formData.get("selectedCountries") ?? "")),
    crowdTesterCount: formData.get("crowdTesterCount"),
    developerTesterCount: formData.get("developerTesterCount"),
    tasks: splitList(String(formData.get("tasks") ?? "")),
    softwareFilePath: undefined,
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
    developerTesterCount: parsed.data.developerTesterCount,
    countries: parsed.data.selectedCountries,
    platforms: parsed.data.selectedPlatforms,
    browsers: parsed.data.selectedBrowsers,
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
      stage: CampaignStage.ACTIVE,
      crowdTesterCount: parsed.data.crowdTesterCount,
      developerTesterCount: parsed.data.developerTesterCount,
      selectedCountries: parsed.data.selectedCountries,
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

  await assignCampaignStaff(
    campaign.id,
    parsed.data.crowdTesterCount + parsed.data.developerTesterCount,
  );
  await inviteMatchingTesters(campaign.id);

  revalidatePath("/client/dashboard");
  revalidatePath("/tester/campaigns");
  revalidatePath("/manager/dashboard");
  revalidatePath("/moderator/review-queue");
  redirect("/client/dashboard");
}

export async function acceptInvitationAction(formData: FormData) {
  const session = await requireSession([Role.TESTER]);
  const invitationId = String(formData.get("invitationId") ?? "");

  const invitation = await prisma.campaignInvitation.findUnique({
    where: { id: invitationId },
    include: {
      campaign: true,
    },
  });

  if (!invitation || invitation.testerId !== session.id) {
    return;
  }

  await prisma.campaignInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  await prisma.campaignAssignment.upsert({
    where: {
      campaignId_userId_assignmentRole: {
        campaignId: invitation.campaignId,
        userId: session.id,
        assignmentRole:
          session.testerKind === "DEVELOPER"
            ? "DEVELOPER_TESTER"
            : "CROWD_TESTER",
      },
    },
    update: {
      acceptedAt: new Date(),
    },
    create: {
      campaignId: invitation.campaignId,
      userId: session.id,
      assignmentRole:
        session.testerKind === "DEVELOPER"
          ? "DEVELOPER_TESTER"
          : "CROWD_TESTER",
      acceptedAt: new Date(),
    },
  });

  revalidatePath("/tester/campaigns");
  revalidatePath(`/tester/workspace/${invitation.campaignId}`);
}
