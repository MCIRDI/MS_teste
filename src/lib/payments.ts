import type { BugSeverity } from "@/generated/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export function getBugRewardAmount(severity: BugSeverity, isCertified: boolean) {
  const base = isCertified ? env.CERT_TESTER_BASE_PRICE : env.CROWD_TESTER_BASE_PRICE;

  switch (severity) {
    case "CRITICAL":
      return Math.round(base * 1.5);
    case "HIGH":
      return Math.round(base * 1.2);
    case "MEDIUM":
      return base;
    case "LOW":
    default:
      return Math.round(base * 0.6);
  }
}

export async function getTesterWithdrawableBalance(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totalEarned: true },
  });

  const withdrawn = await prisma.payment.aggregate({
    where: {
      userId,
      type: "TESTER_WITHDRAWAL",
      status: { in: ["COMPLETED", "PENDING"] },
    },
    _sum: { amount: true },
  });

  return Math.max(0, user.totalEarned - (withdrawn._sum.amount ?? 0));
}
