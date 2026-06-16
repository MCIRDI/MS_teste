"use server";

import { AccountStatus, CountrySource, InvitationStatus, Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";
import { z } from "zod";

import { getDashboardPath, hashPassword, requireSession, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { notifyDataChanged } from "@/lib/realtime/publish";

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
  await notifyDataChanged({ roles: [Role.ADMIN], userIds: [user.id], scope: "role_upgrade" });
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
  await notifyDataChanged({ roles: [Role.ADMIN], userIds: [user.id], scope: "account_approved" });
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
  await notifyDataChanged({ roles: [Role.ADMIN], userIds: [user.id], scope: "account_rejected" });
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
  await notifyDataChanged({ roles: [Role.ADMIN], userIds: [user.id], scope: "certified" });
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

const adminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  accountStatus: z.nativeEnum(AccountStatus),
  country: z.string().optional(),
  languages: z.string().optional(),
  isCertified: z.coerce.boolean(),
  vetingScore: z.coerce.number().min(0).max(100).optional(),
  score: z.coerce.number().min(0).optional(),
  totalEarned: z.coerce.number().min(0).optional(),
  testingExperience: z.string().optional(),
  password: z.union([z.string().min(8), z.literal("")]).optional(),
});

export async function updateUserByAdminAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  await requireSession([Role.ADMIN]);

  const parsed = adminUserUpdateSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    accountStatus: formData.get("accountStatus"),
    country: formData.get("country") || undefined,
    languages: formData.get("languages") || undefined,
    isCertified: formData.get("isCertified") === "on" || formData.get("isCertified") === "true",
    vetingScore: formData.get("vetingScore") || undefined,
    score: formData.get("score") || undefined,
    totalEarned: formData.get("totalEarned") || undefined,
    testingExperience: formData.get("testingExperience") || undefined,
    password: formData.get("password") || "",
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid user data." };
  }

  const data = parsed.data;
  const languages = data.languages
    ? data.languages.split(",").map((entry) => entry.trim()).filter(Boolean)
    : undefined;

  const existing = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { country: true },
  });

  if (!existing) {
    return { success: false, message: "User not found." };
  }

  const nextCountry = data.country?.trim() || null;

  const updateData: Parameters<typeof prisma.user.update>[0]["data"] = {
    name: data.name,
    email: data.email,
    role: data.role,
    accountStatus: data.accountStatus,
    country: nextCountry,
    isCertified: data.isCertified,
    testingExperience: data.testingExperience?.trim() || null,
  };

  if (nextCountry !== existing.country) {
    updateData.countrySource = nextCountry ? CountrySource.ADMIN : null;
  }

  if (languages) {
    updateData.languages = languages;
  }

  if (data.vetingScore !== undefined) {
    updateData.vetingScore = data.vetingScore;
  }

  if (data.score !== undefined) {
    updateData.score = data.score;
  }

  if (data.totalEarned !== undefined) {
    updateData.totalEarned = data.totalEarned;
  }

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  try {
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: updateData,
    });

    revalidatePath("/admin/users");
    revalidatePath("/tester/profile");
    revalidatePath("/tester/campaigns");
    revalidatePath("/moderator/review-queue");
    revalidatePath("/manager/dashboard");
    revalidatePath("/client/dashboard");

    await notifyDataChanged({
      roles: [Role.ADMIN],
      userIds: [user.id],
      scope: "user_updated",
    });

    return { success: true, message: "User updated successfully." };
  } catch {
    return { success: false, message: "Could not update user. Check email uniqueness." };
  }
}
