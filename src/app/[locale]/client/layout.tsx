import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["CLIENT"]);
  const t = await getTranslations("workspace.client");

  return (
    <AppShell session={session} title={t("title")} description={t("description")}>
      {children}
    </AppShell>
  );
}
