import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { ClientLiveIndicator } from "@/components/client/client-live-indicator";
import { ClientRealtimeProvider } from "@/components/client/client-realtime-provider";
import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(["CLIENT"]);
  const t = await getTranslations("workspace.client");

  return (
    <ClientRealtimeProvider>
      <AppShell session={session} title={t("title")} description={t("description")}>
        <div className="mb-4 flex justify-end">
          <ClientLiveIndicator />
        </div>
        {children}
      </AppShell>
    </ClientRealtimeProvider>
  );
}
