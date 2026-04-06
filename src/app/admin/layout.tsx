import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["ADMIN"]);

  return (
    <AppShell
      session={session}
      title="Admin control"
      description="Oversee accounts, assign campaign leadership, monitor platform health, and manage system-wide configuration."
    >
      {children}
    </AppShell>
  );
}
