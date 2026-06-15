import { requireSession } from "@/lib/auth";
import { getClientReportsWithDisputes } from "@/lib/dashboard-data";
import { ClientReportsLive } from "@/components/client/client-reports-live";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ClientReportsPage() {
  const session = await requireSession(["CLIENT"]);
  const reports = await getClientReportsWithDisputes(session.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Reports"
        title="Campaign reporting"
        description="Validated bugs, final reports, and dispute management for your campaigns."
      />
      <ClientReportsLive initialReports={reports} />
    </div>
  );
}
