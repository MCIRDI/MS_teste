import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["TEST_MANAGER"]);
  const t = await getTranslations("workspace.manager");

  return (
    <AppShell session={session} title={t("title")} description={t("description")}>
      {children}
    </AppShell>
  );
}
