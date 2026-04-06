import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["TEST_MANAGER"]);

  return (
    <AppShell
      session={session}
      title="Test manager workspace"
      description="Coordinate moderators, validate approved defects, and deliver final reports back to the client."
    >
      {children}
    </AppShell>
  );
}
