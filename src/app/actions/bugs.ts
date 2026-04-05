"use server";

import { AttachmentKind, BugSeverity, Role } from "@/generated/prisma/client";
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
  redirect(`/tester/workspace/${parsed.data.campaignId}`);
}
