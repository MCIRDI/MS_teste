import { requireSession } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/dashboard-data";
import { ClientDashboardLive } from "@/components/client/client-dashboard-live";

export default async function ClientDashboardPage() {
  const session = await requireSession(["CLIENT"]);
  const data = await getClientDashboardData(session.id);

  return <ClientDashboardLive initialData={data} />;
}
