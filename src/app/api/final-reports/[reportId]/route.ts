import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { reportId } = await params;

  const report = await prisma.finalReport.findUnique({
    where: { id: reportId },
    include: {
      campaign: true,
    },
  });

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  const campaign = report.campaign;
  const role = session.role;
  let allowed = false;

  if (role === "ADMIN") {
    allowed = true;
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

  const absolutePath = path.join(/* turbopackIgnore: true */ process.cwd(), report.relativePath);
  try {
    await fs.access(absolutePath);
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": report.mimeType || "application/pdf",
      "Content-Disposition": `attachment; filename="${report.originalName.replace(/"/g, "")}"`,
    },
  });
}

