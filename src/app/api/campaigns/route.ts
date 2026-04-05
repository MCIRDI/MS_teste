import { CampaignStage, Role, SoftwareType } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { estimateCampaignPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { createCampaignSchema } from "@/lib/validation";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where:
      session.role === Role.CLIENT
        ? { clientId: session.id }
        : undefined,
    include: {
      tasks: true,
      bugReports: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const price = estimateCampaignPrice({
    crowdTesterCount: parsed.data.crowdTesterCount,
    developerTesterCount: parsed.data.developerTesterCount,
    countries: parsed.data.selectedCountries,
    platforms: parsed.data.selectedPlatforms,
  });

  const campaign = await prisma.campaign.create({
    data: {
      clientId: session.id,
      projectName: parsed.data.projectName,
      description: parsed.data.description,
      softwareType: parsed.data.softwareType as SoftwareType,
      websiteUrl: parsed.data.websiteUrl || null,
      downloadPath: parsed.data.softwareFilePath || null,
      testerCredentials: parsed.data.testerLoginCredentials
        ? { value: parsed.data.testerLoginCredentials }
        : undefined,
      stage: CampaignStage.PENDING_APPROVAL,
      crowdTesterCount: parsed.data.crowdTesterCount,
      developerTesterCount: parsed.data.developerTesterCount,
      selectedCountries: parsed.data.selectedCountries,
      selectedPlatforms: parsed.data.selectedPlatforms,
      selectedBrowsers: parsed.data.selectedBrowsers,
      estimatedCost: price.estimatedCost,
      moderatorSlots: price.moderatorSlots,
      tasks: {
        create: parsed.data.tasks.map((task, index) => ({
          title: `Task ${index + 1}`,
          description: task,
          orderIndex: index + 1,
        })),
      },
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
