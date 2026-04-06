"use server";

import { AttachmentKind, BugSeverity, BugStatus, Role } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/app/actions/auth";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { bugReportSchema } from "@/lib/validation";

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
    title: formData.get("title"),
    description: formData.get("description"),
    reproductionSteps: formData.get("reproductionSteps"),
    expectedResult: formData.get("expectedResult"),
    actualResult: formData.get("actualResult"),
    severity: formData.get("severity"),
    device: formData.get("device"),
    osVersion: formData.get("osVersion"),
    browser: formData.get("browser"),
    screenResolution: formData.get("screenResolution"),
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
      description: parsed.data.description,
      reproductionSteps: parsed.data.reproductionSteps,
      expectedResult: parsed.data.expectedResult,
      actualResult: parsed.data.actualResult,
      severity: parsed.data.severity as BugSeverity,
      environment: {
        device: parsed.data.device,
        osVersion: parsed.data.osVersion,
        browser: parsed.data.browser,
        screenResolution: parsed.data.screenResolution,
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

  if (!["APPROVED", "REJECTED", "DUPLICATE"].includes(decision)) {
    return;
  }

  const nextStatus = decision as BugStatus;

  const bugReport = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
  });

  if (!bugReport) {
    return;
  }

  await prisma.bugReport.update({
    where: { id: bugReportId },
    data: {
      status: nextStatus,
      moderatorId: session.id,
      moderationNotes: moderationNotes || null,
    },
  });

  revalidatePath("/moderator/review-queue");
  revalidatePath(`/moderator/campaigns/${bugReport.campaignId}`);
  revalidatePath("/manager/validation");
}

export async function validateBugReportAction(formData: FormData) {
  const session = await requireSession([Role.TEST_MANAGER]);
  const bugReportId = String(formData.get("bugReportId") ?? "");
  const validationNotes = String(formData.get("validationNotes") ?? "");

  const bugReport = await prisma.bugReport.findUnique({
    where: { id: bugReportId },
  });

  if (!bugReport) {
    return;
  }

  await prisma.bugReport.update({
    where: { id: bugReportId },
    data: {
      status: "VALIDATED",
      validatedById: session.id,
      validationNotes: validationNotes || null,
    },
  });

  revalidatePath("/manager/validation");
  revalidatePath("/manager/reports");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/reports");
}
