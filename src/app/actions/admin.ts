"use server";

import { AccountStatus, CountrySource, InvitationStatus, Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";
import { z } from "zod";

import { getDashboardPath, hashPassword, requireSession, setSession, verifyPassword } from "@/lib/auth";
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

const adminUserCreateSchema = z.object({
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
  password: z.string().min(8),
});

export async function createUserByAdminAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  await requireSession([Role.ADMIN]);

  const parsed = adminUserCreateSchema.safeParse({
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
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid user data." };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return { success: false, message: "An account with this email already exists." };
  }

  const languages = data.languages
    ? data.languages.split(",").map((entry) => entry.trim()).filter(Boolean)
    : [];

  const passwordHash = await hashPassword(data.password);

  const nextCountry = data.country?.trim() || null;

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        accountStatus: data.accountStatus,
        country: nextCountry,
        countrySource: nextCountry ? CountrySource.ADMIN : null,
        languages,
        isCertified: data.isCertified,
        testingExperience: data.testingExperience?.trim() || null,
        vetingScore: data.vetingScore,
        score: data.score ?? 0,
        totalEarned: data.totalEarned ?? 0,
        isEmailVerified: true,
        auditLogs: {
          create: {
            action: "ACCOUNT_CREATED_BY_ADMIN",
            entityType: "User",
            entityId: "self",
            metadata: { role: data.role },
          },
        },
      },
    });

    revalidatePath("/admin/users");

    await notifyDataChanged({
      roles: [Role.ADMIN],
      userIds: [user.id],
      scope: "user_created",
    });

    return { success: true, message: "User created successfully." };
  } catch {
    return { success: false, message: "Could not create user. Check email uniqueness." };
  }
}

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

// ── Profile update (any role) ───────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2),
  currentPassword: z.string().optional(),
  newPassword: z.union([z.string().min(8), z.literal("")]).optional(),
});

export async function updateProfileAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || "",
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid input." };
  }

  const { name, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return { success: false, message: "User not found." };
  }

  const updateData: Parameters<typeof prisma.user.update>[0]["data"] = { name };

  if (newPassword) {
    if (!currentPassword) {
      return { success: false, message: "Current password is required to set a new password." };
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, message: "Current password is incorrect." };
    }

    updateData.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({ where: { id: session.id }, data: updateData });

  // Refresh session name if changed
  if (name !== user.name) {
    await setSession({ id: user.id, name, email: user.email, role: user.role, isCertified: user.isCertified });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/profile");
  revalidatePath("/client/profile");
  revalidatePath("/moderator/profile");
  revalidatePath("/manager/profile");
  revalidatePath("/tester/profile");

  return { success: true, message: "Profile updated successfully." };
}

// ── Tester: add device ──────────────────────────────────────────────────────

const addDeviceSchema = z.object({
  deviceName: z.string().min(1),
  osVersion: z.string().min(1),
  browser: z.string().min(1),
  screenResolution: z.string().min(1),
  operator: z.string().optional(),
  connectionType: z.string().optional(),
});

export async function addTesterDeviceAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  const parsed = addDeviceSchema.safeParse({
    deviceName: formData.get("deviceName"),
    osVersion: formData.get("osVersion"),
    browser: formData.get("browser"),
    screenResolution: formData.get("screenResolution"),
    operator: formData.get("operator") || undefined,
    connectionType: formData.get("connectionType") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Please fill in all required device fields." };
  }

  await prisma.device.create({
    data: {
      userId: session.id,
      deviceName: parsed.data.deviceName,
      osVersion: parsed.data.osVersion,
      browsers: [parsed.data.browser],
      screenResolution: parsed.data.screenResolution,
      operator: parsed.data.operator ?? null,
      connectionType: parsed.data.connectionType ?? null,
    },
  });

  revalidatePath("/tester/profile");
  revalidatePath("/tester/bugs/new");
  revalidatePath("/admin/users");

  return { success: true, message: "Device added." };
}

export async function deleteTesterDeviceAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  const deviceId = String(formData.get("deviceId") ?? "").trim();
  if (!deviceId) {
    return { success: false, message: "Missing device ID." };
  }

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || device.userId !== session.id) {
    return { success: false, message: "Device not found." };
  }

  await prisma.device.delete({ where: { id: deviceId } });

  revalidatePath("/tester/profile");
  revalidatePath("/tester/bugs/new");
  revalidatePath("/admin/users");

  return { success: true, message: "Device removed." };
}
