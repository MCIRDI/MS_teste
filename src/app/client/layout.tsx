import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["CLIENT"]);

  return (
    <AppShell
      session={session}
      title="Client workspace"
      description="Create campaigns, track tester participation, and review validated issues from a single dashboard."
    >
      {children}
    </AppShell>
  );
}
