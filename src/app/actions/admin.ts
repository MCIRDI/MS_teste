"use server";

import { AccountStatus, InvitationStatus, Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import { getDashboardPath, requireSession, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

function getPromotionTarget(role: Role) {
  switch (role) {
    case Role.TESTER:
    case Role.CERT_TESTER:
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

export async function approvePendingAccountAction(formData: FormData) {
  await requireSession([Role.ADMIN]);
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || existing.accountStatus !== AccountStatus.PENDING_APPROVAL) {
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  await createNotification({
    userId: user.id,
    message: "Your account has been activated. You can now access the platform.",
    type: "account_activated",
    language: (user.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
  });

  revalidatePath("/admin/users");
  revalidatePath("/tester/campaigns");
  revalidatePath("/tester/vetting");
}

export async function approveTesterAccountAction(formData: FormData) {
  return approvePendingAccountAction(formData);
}

export async function rejectPendingAccountAction(formData: FormData) {
  await requireSession([Role.ADMIN]);
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || existing.accountStatus !== AccountStatus.PENDING_APPROVAL) {
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: AccountStatus.BANNED,
    },
  });

  await createNotification({
    userId: user.id,
    message: "Your account application was rejected.",
    type: "account_rejected",
    language: (user.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
  });

  revalidatePath("/admin/users");
}

export async function rejectTesterAccountAction(formData: FormData) {
  return rejectPendingAccountAction(formData);
}

export async function certifyTesterAction(formData: FormData) {
  await requireSession([Role.ADMIN]);
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || existing.role !== Role.TESTER) {
    return;
  }

  const badges = existing.badges.includes("cert_platform")
    ? existing.badges
    : [...existing.badges, "cert_platform"];

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: Role.CERT_TESTER,
      isCertified: true,
      badges,
    },
  });

  await createNotification({
    userId: user.id,
    message: "Congratulations! You are now a certified tester on DzTesters.",
    type: "certified_promoted",
    language: (user.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
  });

  revalidatePath("/admin/users");
  revalidatePath("/tester/profile");
}

export async function acceptRoleUpgradeInvitationAction(formData: FormData) {
  const session = await requireSession([Role.TESTER, Role.CERT_TESTER, Role.MODERATOR]);
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
    isCertified: updatedUser.isCertified,
  });

  revalidatePath("/admin/users");
  revalidatePath("/tester/campaigns");
  revalidatePath("/tester/profile");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/manager/dashboard");
  revalidatePath("/admin/campaigns");
  return await redirectTo(getDashboardPath(updatedUser.role));
}
