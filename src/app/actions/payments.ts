"use server";

import { CampaignStage, PaymentStatus, PaymentType, Role } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { inviteCampaignParticipants } from "@/lib/campaigns";
import { createNotification } from "@/lib/notifications";
import { getTesterWithdrawableBalance } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function payCampaignAction(formData: FormData) {
  const session = await requireSession([Role.CLIENT]);
  const campaignId = String(formData.get("campaignId") ?? "");

  if (!campaignId) {
    return;
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, clientId: session.id },
    include: {
      payments: {
        where: { type: PaymentType.CAMPAIGN_PAYMENT, status: PaymentStatus.COMPLETED },
        take: 1,
      },
    },
  });

  if (!campaign || campaign.payments.length > 0) {
    return;
  }

  if (campaign.stage !== CampaignStage.PENDING_APPROVAL) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        userId: session.id,
        campaignId: campaign.id,
        type: PaymentType.CAMPAIGN_PAYMENT,
        amount: campaign.estimatedCost,
        currency: campaign.currency,
        status: PaymentStatus.COMPLETED,
        reference: `CMP-${campaign.id.slice(-8).toUpperCase()}`,
        notes: `Campaign payment for ${campaign.projectName}`,
      },
    });

    await tx.campaign.update({
      where: { id: campaign.id },
      data: { stage: CampaignStage.ACTIVE },
    });
  });

  await inviteCampaignParticipants(campaign.id);

  await createNotification({
    userId: session.id,
    message: `Payment confirmed for "${campaign.projectName}". Invitations are being sent to testers.`,
    type: "campaign_payment",
    metadata: { campaignId: campaign.id, amount: campaign.estimatedCost },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/tester/campaigns");
  revalidatePath("/manager/dashboard");
  revalidatePath("/moderator/review-queue");
  revalidatePath("/admin/campaigns");
}

export async function requestWithdrawalAction(formData: FormData) {
  const session = await requireSession([Role.TESTER, Role.CERT_TESTER]);
  const amount = Number(formData.get("amount") ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const available = await getTesterWithdrawableBalance(session.id);
  if (amount > available) {
    return;
  }

  const tester = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { currency: true, languages: true },
  });

  await prisma.payment.create({
    data: {
      userId: session.id,
      type: PaymentType.TESTER_WITHDRAWAL,
      amount,
      currency: tester.currency,
      status: PaymentStatus.PENDING,
      notes: "Withdrawal request submitted by tester",
    },
  });

  await createNotification({
    userId: session.id,
    message: `Withdrawal request for ${amount} ${tester.currency} submitted. Processing may take a few business days.`,
    type: "withdrawal_requested",
    language: (tester.languages[0] as "fr" | "ar" | "en" | undefined) ?? "fr",
    metadata: { amount },
  });

  revalidatePath("/tester/profile");
}
