import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function ManagerDashboardPage() {
  const session = await requireSession(["TEST_MANAGER"]);
  const data = await getManagerDashboardData(session.id);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Oversight"
          title="Campaign progress"
          description="Managers coordinate moderators, prioritize scope, and keep device and country coverage aligned with the client brief."
        />
        <div className="space-y-3">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-700">
              {campaign.projectName} · {campaign.bugReports.length} bugs · {campaign.assignments.length} assignments
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
