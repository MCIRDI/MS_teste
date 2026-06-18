"use server";

import { AccountStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import {
  canRetryVetting,
  scoreVettingAnswers,
  vettingQuestions,
  VETTING_RETRY_DAYS,
} from "@/lib/vetting";

export async function submitVettingAction(formData: FormData) {
  const session = await requireSession(["TESTER"]);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
  });

  if (user.accountStatus === AccountStatus.ACTIVE) {
    return await redirectTo("/tester/campaigns");
  }

  if (!canRetryVetting(user.vetingRetryDate)) {
    return;
  }

  const answers: Record<string, string> = {};
  for (const question of vettingQuestions) {
    answers[question.id] = String(formData.get(question.id) ?? "");
  }

  const { score, passed } = scoreVettingAnswers(answers);

  if (passed) {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        vetingScore: score,
        vetingRetryDate: null,
      },
    });

    await notifyAdmins(
      `${user.name} passed the vetting quiz (${score}%). Account approval required.`,
      "tester_vetting_passed",
      { userId: user.id, score },
    );

    await createNotification({
      userId: user.id,
      message: "Vetting passed. An administrator will review and activate your account soon.",
      type: "vetting_passed",
      language: (user.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
      metadata: { score },
    });

    revalidatePath("/tester/vetting");
    revalidatePath("/admin/users");
    return await redirectTo(`/tester/vetting?result=passed&score=${score}`);
  }

  const retryDate = new Date();
  retryDate.setDate(retryDate.getDate() + VETTING_RETRY_DAYS);

  await prisma.user.update({
    where: { id: session.id },
    data: {
      vetingScore: score,
      vetingRetryDate: retryDate,
    },
  });

  await createNotification({
    userId: user.id,
    message: `Vetting failed (${score}%). You can retry after ${retryDate.toLocaleDateString()}.`,
    type: "vetting_failed",
    language: (user.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
    metadata: { score, retryDate: retryDate.toISOString() },
  });

  revalidatePath("/tester/vetting");
  return await redirectTo(`/tester/vetting?result=failed&score=${score}`);
}
