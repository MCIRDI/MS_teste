import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["ADMIN"]);
  const t = await getTranslations("workspace.admin");

  return (
    <AppShell session={session} title={t("title")} description={t("description")}>
      {children}
    </AppShell>
  );
}
