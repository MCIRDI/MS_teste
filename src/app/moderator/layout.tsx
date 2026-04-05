import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function ModeratorLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["MODERATOR"]);

  return (
    <AppShell
      session={session}
      title="Moderator desk"
      description="Review incoming defects, detect duplicates, coach testers, and keep each campaign queue clean."
    >
      {children}
    </AppShell>
  );
}
