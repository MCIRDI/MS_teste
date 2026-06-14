import type { NotificationLanguage, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  message: string;
  type: string;
  language?: NotificationLanguage;
  metadata?: Prisma.InputJsonValue;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: input.type,
      language: input.language ?? "fr",
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      message: input.message,
      type: input.type,
      language: input.language ?? "fr",
      metadata: input.metadata ?? undefined,
    })),
  });
}

export async function notifyAdmins(message: string, type: string, metadata?: Prisma.InputJsonValue) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true, languages: true },
  });

  await createNotifications(
    admins.map((admin) => ({
      userId: admin.id,
      message,
      type,
      language: (admin.languages[0] as NotificationLanguage | undefined) ?? "fr",
      metadata,
    })),
  );
}

export async function notifyModerators(message: string, type: string, metadata?: Prisma.InputJsonValue) {
  const moderators = await prisma.user.findMany({
    where: { role: "MODERATOR", accountStatus: "ACTIVE" },
    select: { id: true, languages: true },
  });

  await createNotifications(
    moderators.map((moderator) => ({
      userId: moderator.id,
      message,
      type,
      language: (moderator.languages[0] as NotificationLanguage | undefined) ?? "fr",
      metadata,
    })),
  );
}
