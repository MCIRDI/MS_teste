"use server";

import { AttachmentKind, BugSeverity, BugStatus, Role } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/app/actions/auth";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { bugReportSchema } from "@/lib/validation";
import { makeGroupKey } from "@/lib/moderation";

function getAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) {
    return AttachmentKind.SCREENSHOT;
  }

  if (file.type.startsWith("video/")) {
    return AttachmentKind.VIDEO;
  }

  if (file.type.startsWith("text/") || file.type === "application/json") {
    return AttachmentKind.LOG;
  }

  return AttachmentKind.ATTACHMENT;
}

function getUploadCategory(kind: AttachmentKind) {
  switch (kind) {
    case AttachmentKind.SCREENSHOT:
      return "screenshots" as const;
    case AttachmentKind.VIDEO:
      return "videos" as const;
    case AttachmentKind.LOG:
      return "logs" as const;
    case AttachmentKind.ATTACHMENT:
    default:
      return "attachments" as const;
  }
}

export async function submitBugReportAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession([Role.TESTER]);

  const parsed = bugReportSchema.safeParse({
    campaignId: formData.get("campaignId"),
    bugType: formData.get("bugType"),
    title: formData.get("title"),
    pageUrl: formData.get("pageUrl"),
    description: formData.get("description"),
    reproductionSteps: formData.get("reproductionSteps"),
    severity: formData.get("severity"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Bug report details are incomplete.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId: parsed.data.campaignId,
      userId: session.id,
      assignmentRole: {
        in: ["CROWD_TESTER", "DEVELOPER_TESTER"],
      },
    },
  });

  if (!assignment) {
    return {
      success: false,
      message: "You need to accept the invitation before submitting bugs.",
    };
  }

  const tester = await prisma.user.findUnique({
    where: { id: session.id },
    include: { devices: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const device = tester?.devices[0] ?? null;
  const browser = Array.isArray(device?.browsers) ? String(device?.browsers[0] ?? "") : "";

  const setupMissing =
    !tester?.country ||
    !device ||
    !device.deviceName ||
    !device.osVersion ||
    device.osVersion === "Not provided" ||
    !device.screenResolution ||
    device.screenResolution === "Not provided" ||
    !browser;

  if (setupMissing) {
    return {
      success: false,
      message: "Please complete your tester info (country + device details) before submitting bugs.",
    };
  }

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const uploadedAttachments = await Promise.all(
    files.map(async (file) => {
      const kind = getAttachmentKind(file);
      const uploaded = await saveUpload(file, getUploadCategory(kind));

      return {
        kind,
        originalName: uploaded.originalName,
        storedName: uploaded.storedName,
        relativePath: uploaded.relativePath,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
      };
    }),
  );

  await prisma.bugReport.create({
    data: {
      campaignId: parsed.data.campaignId,
      testerId: session.id,
      title: parsed.data.title,
      pageUrl: parsed.data.pageUrl || null,
      feature: null,
      // We store the user-selected bug type in `errorType` to avoid a schema migration.
      errorType: parsed.data.bugType,
      groupKey: makeGroupKey({
        title: parsed.data.title,
        pageUrl: parsed.data.pageUrl || null,
        feature: null,
        errorType: parsed.data.bugType,
      }),
      description: parsed.data.description,
      reproductionSteps: parsed.data.reproductionSteps,
      expectedResult: "Not provided",
      actualResult: "Not provided",
      severity: parsed.data.severity as BugSeverity,
      environment: {
        country: tester.country,
        device: device.deviceName,
        osVersion: device.osVersion,
        browser,
        screenResolution: device.screenResolution,
      },
      attachments: {
        create: uploadedAttachments,
      },
    },
  });

  revalidatePath("/tester/campaigns");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/client/dashboard");
  redirect(`/tester/workspace/${parsed.data.campaignId}`);
}

export async function moderateBugReportAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR]);
  const bugReportId = String(formData.get("bugReportId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const moderationNotes = String(formData.get("moderationNotes") ?? "");
  const duplicateOfId = String(formData.get("duplicateOfId") ?? "");

  if (!["APPROVED", "REJECTED", "DUPLICATE", "NEEDS_INFO"].includes(decision)) {
    return;
  }

  const nextStatus = decision as BugStatus;

  const bugReport = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
  });

  if (!bugReport) {
    return;
  }

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId: bugReport.campaignId,
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
  });

  if (!assignment) {
    return;
  }

  await prisma.bugReport.update({
    where: { id: bugReportId },
    data: {
      status: nextStatus,
      moderatorId: session.id,
      moderationNotes: moderationNotes || null,
      duplicateOfId: nextStatus === BugStatus.DUPLICATE && duplicateOfId ? duplicateOfId : null,
      moderatedAt: new Date(),
    },
  });

  revalidatePath("/moderator/review-queue");
  revalidatePath(`/moderator/campaigns/${bugReport.campaignId}`);
}

export async function moderateBugGroupAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR]);
  const campaignId = String(formData.get("campaignId") ?? "");
  const groupKey = String(formData.get("groupKey") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const moderationNotes = String(formData.get("moderationNotes") ?? "");

  if (!campaignId || !groupKey) return;
  if (!["APPROVED", "REJECTED", "NEEDS_INFO"].includes(decision)) return;

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId,
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
  });

  if (!assignment) {
    return;
  }

  const nextStatus = decision as BugStatus;
  await prisma.bugReport.updateMany({
    where: {
      campaignId,
      status: {
        in: [BugStatus.SUBMITTED, BugStatus.NEEDS_INFO],
      },
      groupKey,
    },
    data: {
      status: nextStatus,
      moderatorId: session.id,
      moderationNotes: moderationNotes || null,
      moderatedAt: new Date(),
    },
  });

  revalidatePath("/moderator/review-queue");
  revalidatePath(`/moderator/campaigns/${campaignId}`);
}

export async function markBugGroupDuplicatesAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR]);
  const campaignId = String(formData.get("campaignId") ?? "");
  const groupKey = String(formData.get("groupKey") ?? "");

  if (!campaignId || !groupKey) return;

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId,
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
  });

  if (!assignment) return;

  const bugs = await prisma.bugReport.findMany({
    where: {
      campaignId,
      groupKey,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true },
  });

  if (bugs.length < 2) return;

  const primaryId = bugs[0].id;

  await prisma.bugReport.updateMany({
    where: {
      campaignId,
      groupKey,
      id: { not: primaryId },
      status: {
        in: [BugStatus.SUBMITTED, BugStatus.NEEDS_INFO],
      },
    },
    data: {
      status: BugStatus.DUPLICATE,
      duplicateOfId: primaryId,
      moderatorId: session.id,
      moderatedAt: new Date(),
    },
  });

  revalidatePath("/moderator/review-queue");
  revalidatePath(`/moderator/campaigns/${campaignId}`);
  revalidatePath(`/moderator/bugs/${primaryId}`);
}

export async function submitModeratorBugReportAction(formData: FormData) {
  const session = await requireSession([Role.MODERATOR]);

  const campaignId = String(formData.get("campaignId") ?? "");
  const bugType = String(formData.get("bugType") ?? "");
  const title = String(formData.get("title") ?? "");
  const pageUrl = String(formData.get("pageUrl") ?? "");
  const description = String(formData.get("description") ?? "");
  const reproductionSteps = String(formData.get("reproductionSteps") ?? "");
  const severity = String(formData.get("severity") ?? "");
  const commonOccurrence = String(formData.get("commonOccurrence") ?? "");

  if (!campaignId || !bugType || !title || !description || !reproductionSteps || !severity) return;

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId,
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
  });

  if (!assignment) return;

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const uploadedAttachments = await Promise.all(
    files.map(async (file) => {
      const kind = getAttachmentKind(file);
      const uploaded = await saveUpload(file, getUploadCategory(kind));

      return {
        kind,
        originalName: uploaded.originalName,
        storedName: uploaded.storedName,
        relativePath: uploaded.relativePath,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
      };
    }),
  );

  await prisma.bugReport.create({
    data: {
      campaignId,
      testerId: session.id,
      moderatorId: session.id,
      title,
      pageUrl: pageUrl || null,
      feature: null,
      errorType: bugType,
      groupKey: makeGroupKey({
        title,
        pageUrl: pageUrl || null,
        feature: null,
        errorType: bugType,
      }),
      description,
      reproductionSteps,
      expectedResult: "Not provided",
      actualResult: "Not provided",
      severity: severity as BugSeverity,
      status: BugStatus.APPROVED,
      moderationNotes: commonOccurrence ? `Common occurrence: ${commonOccurrence}` : null,
      environment: {},
      attachments: {
        create: uploadedAttachments,
      },
    },
  });

  revalidatePath("/moderator/review-queue");
  revalidatePath(`/moderator/campaigns/${campaignId}`);
  redirect(`/moderator/campaigns/${campaignId}`);
}
