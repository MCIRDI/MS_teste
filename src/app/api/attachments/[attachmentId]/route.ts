import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { attachmentId } = await params;

  const attachment = await prisma.bugAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      bugReport: {
        include: {
          campaign: true,
        },
      },
    },
  });

  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  const campaign = attachment.bugReport.campaign;
  const bug = attachment.bugReport;

  const role = session.role;
  let allowed = false;

  if (role === "ADMIN") {
    allowed = true;
  } else if (role === "TESTER") {
    allowed = bug.testerId === session.id;
  } else if (role === "CLIENT") {
    allowed = campaign.clientId === session.id;
  } else if (role === "TEST_MANAGER") {
    allowed = campaign.testManagerId === session.id;
  } else if (role === "MODERATOR") {
    const assignment = await prisma.campaignAssignment.findFirst({
      where: {
        campaignId: campaign.id,
        userId: session.id,
        assignmentRole: "MODERATOR",
      },
      select: { id: true },
    });
    allowed = Boolean(assignment);
  }

  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const absolutePath = path.join(/* turbopackIgnore: true */ process.cwd(), attachment.relativePath);
  try {
    await fs.access(absolutePath);
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return new Response(webStream, {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${attachment.originalName.replace(/"/g, "")}"`,
    },
  });
}
