import {
  getTesterOnboardingPath,
  isAwaitingAdminAfterVetting,
  needsTesterOnboarding,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

export default async function TesterSetupPage() {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  if (session.role === "TESTER") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { role: true, accountStatus: true, country: true, vetingScore: true },
    });

    if (isAwaitingAdminAfterVetting(user)) {
      return await redirectTo("/api/auth/pending-logout");
    }

    if (needsTesterOnboarding(user)) {
      return await redirectTo(getTesterOnboardingPath(user));
    }
  }

  return await redirectTo("/tester/campaigns");
}
