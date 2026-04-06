import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function TesterLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["TESTER"]);

  return (
    <AppShell
      session={session}
      title="Tester workspace"
      description="Accept invitations, follow campaign instructions, and submit strong bug reports with the full testing context."
    >
      {children}
    </AppShell>
  );
}
