"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationsReadAction() {
  const session = await requireSession();

  await prisma.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/", "layout");
}
