import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { clearSession, isAwaitingAdminAfterVetting, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export default async function TesterLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  if (session.role === "TESTER") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { role: true, accountStatus: true, vetingScore: true },
    });

    if (isAwaitingAdminAfterVetting(user)) {
      await clearSession();
      return await redirectTo("/login?status=pending-approval");
    }
  }

  const t = await getTranslations("workspace.tester");

  return (
    <AppShell session={session} title={t("title")} description={t("description")}>
      {children}
    </AppShell>
  );
}
