import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { isAwaitingAdminAfterVetting, requireSession } from "@/lib/auth";
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

    // On laisse la page vetting s'afficher pour montrer le message avant déconnexion
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? headersList.get("referer") ?? "";
    const isVettingPage = pathname.includes("/tester/vetting");

    if (isAwaitingAdminAfterVetting(user) && !isVettingPage) {
      return await redirectTo("/api/auth/pending-logout");
    }
  }

  const t = await getTranslations("workspace.tester");

  return (
    <AppShell session={session} title={t("title")} description={t("description")}>
      {children}
    </AppShell>
  );
}
