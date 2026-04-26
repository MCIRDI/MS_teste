import { AttachmentKind, BugSeverity, Role } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";
import { bugReportSchema } from "@/lib/validation";
import { makeGroupKey } from "@/lib/moderation";

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
    bugType: formData.get("bugType"),
    title: formData.get("title"),
    pageUrl: formData.get("pageUrl"),
    description: formData.get("description"),
    reproductionSteps: formData.get("reproductionSteps"),
    severity: formData.get("severity"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json(
      { error: "Tester info is incomplete. Add your country and device details before submitting bugs." },
      { status: 400 },
    );
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
      pageUrl: parsed.data.pageUrl || null,
      feature: null,
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
        create: attachments,
      },
    },
    include: {
      attachments: true,
    },
  });

  return NextResponse.json({ bugReport }, { status: 201 });
}
