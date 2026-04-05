import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { campaignId } = await context.params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      tasks: true,
      assignments: true,
      bugReports: {
        include: {
          attachments: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}
