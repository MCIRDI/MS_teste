import { AssignmentRole, InvitationStatus, Role } from "@/generated/prisma/client";
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

  await prisma.campaignInvitation.createMany({
    data: recipientIds.map((recipientId: string) => ({
      campaignId,
      recipientId,
      assignmentRole,
      status: InvitationStatus.PENDING,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true });
}
