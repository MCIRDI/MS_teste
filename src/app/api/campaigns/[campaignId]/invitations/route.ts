import { InvitationStatus, Role } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const session = await getCurrentSession();

  if (
    !session ||
    (session.role !== Role.ADMIN && session.role !== Role.TEST_MANAGER)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { testerIds } = await request.json();
  const { campaignId } = await context.params;

  if (!Array.isArray(testerIds) || testerIds.length === 0) {
    return NextResponse.json({ error: "testerIds must be a non-empty array." }, { status: 400 });
  }

  await prisma.campaignInvitation.createMany({
    data: testerIds.map((testerId: string) => ({
      campaignId,
      testerId,
      status: InvitationStatus.PENDING,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true });
}
