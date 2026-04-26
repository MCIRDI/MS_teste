"use server";

import { InvitationStatus, Role } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDashboardPath, requireSession, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getPromotionTarget(role: Role) {
  switch (role) {
    case Role.TESTER:
      return Role.MODERATOR;
    case Role.MODERATOR:
      return Role.TEST_MANAGER;
    default:
      return null;
  }
}

export async function sendRoleUpgradeInvitationAction(formData: FormData) {
  const admin = await requireSession([Role.ADMIN]);
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return;
  }

  const targetRole = getPromotionTarget(user.role);
  if (!targetRole || user.accountStatus !== "ACTIVE") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleUpgradeInvitation.updateMany({
      where: {
        recipientId: user.id,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.EXPIRED,
        respondedAt: new Date(),
        expiresAt: new Date(),
      },
    });

    await tx.roleUpgradeInvitation.create({
      data: {
        recipientId: user.id,
        invitedById: admin.id,
        currentRole: user.role,
        targetRole,
      },
    });
  });

  revalidatePath("/admin/users");
  revalidatePath("/tester/campaigns");
  revalidatePath("/tester/profile");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/manager/dashboard");
  revalidatePath("/admin/campaigns");
}

export async function acceptRoleUpgradeInvitationAction(formData: FormData) {
  const session = await requireSession([Role.TESTER, Role.MODERATOR]);
  const invitationId = String(formData.get("invitationId") ?? "");

  if (!invitationId) {
    return;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const invitation = await tx.roleUpgradeInvitation.findUnique({
      where: { id: invitationId },
    });

    if (
      !invitation ||
      invitation.recipientId !== session.id ||
      invitation.status !== InvitationStatus.PENDING ||
      invitation.currentRole !== session.role
    ) {
      return null;
    }

    const user = await tx.user.update({
      where: { id: session.id },
      data: {
        role: invitation.targetRole,
      },
    });

    await tx.roleUpgradeInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    await tx.roleUpgradeInvitation.updateMany({
      where: {
        recipientId: session.id,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.EXPIRED,
        respondedAt: new Date(),
        expiresAt: new Date(),
      },
    });

    await tx.campaignInvitation.updateMany({
      where: {
        recipientId: session.id,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.EXPIRED,
        expiresAt: new Date(),
      },
    });

    return user;
  });

  if (!updatedUser) {
    return;
  }

  await setSession({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    testerKind: updatedUser.testerKind,
  });

  revalidatePath("/admin/users");
  revalidatePath("/tester/campaigns");
  revalidatePath("/tester/profile");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/manager/dashboard");
  revalidatePath("/admin/campaigns");
  redirect(getDashboardPath(updatedUser.role));
}
