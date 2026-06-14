import { AssignmentRole, InvitationStatus, Role } from "@/generated/prisma";
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

  const body = await request.json();
  const recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds : body.testerIds;
  const assignmentRole = body.assignmentRole as AssignmentRole | undefined;
  const { campaignId } = await context.params;

  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return NextResponse.json({ error: "recipientIds must be a non-empty array." }, { status: 400 });
  }

  if (
    !assignmentRole ||
    !Object.values(AssignmentRole).includes(assignmentRole)
  ) {
    return NextResponse.json({ error: "assignmentRole is required." }, { status: 400 });
  }

  const existing = await prisma.campaignInvitation.findMany({
    where: {
      campaignId,
      recipientId: { in: recipientIds },
    },
    select: { recipientId: true },
  });
  const existingIds = new Set(existing.map((item) => item.recipientId));
  const toCreate = recipientIds.filter((recipientId: string) => !existingIds.has(recipientId));

  if (toCreate.length > 0) {
    await prisma.campaignInvitation.createMany({
      data: toCreate.map((recipientId: string) => ({
        campaignId,
        recipientId,
        assignmentRole,
        status: InvitationStatus.PENDING,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
