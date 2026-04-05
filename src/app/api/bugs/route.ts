import { AttachmentKind, BugSeverity, Role } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { bugReportSchema } from "@/lib/validation";

function toAttachmentKind(file: File): AttachmentKind {
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

function toCategory(kind: AttachmentKind) {
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

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bugReports = await prisma.bugReport.findMany({
    where: session.role === Role.TESTER ? { testerId: session.id } : undefined,
    include: {
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bugReports });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.role !== Role.TESTER) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const attachments = await Promise.all(
    files.map(async (file) => {
      const kind = toAttachmentKind(file);
      const uploaded = await saveUpload(file, toCategory(kind));
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

  const bugReport = await prisma.bugReport.create({
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
        create: attachments,
      },
    },
    include: {
      attachments: true,
    },
  });

  return NextResponse.json({ bugReport }, { status: 201 });
}
