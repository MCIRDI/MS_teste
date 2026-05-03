import { requireSession } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function ClientDashboardPage() {
  const session = await requireSession(["CLIENT"]);
  const data = await getClientDashboardData(session.id);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Campaign portfolio"
            title="Campaign overview"
            description="Campaigns, tester allocation, validated bugs, and estimates currently on record."
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100 px-0 pb-0 pt-0">
          <div className="overflow-x-auto px-5 pb-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Testers</th>
                    <th>Bugs</th>
                    <th>Countries</th>
                    <th>Estimated cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="font-medium text-slate-900">{campaign.name}</td>
                      <td>{campaign.testers}</td>
                      <td>{campaign.bugs}</td>
                      <td>{campaign.countries || "None"}</td>
                      <td>{formatCurrency(campaign.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardSection>
      </Card>
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Severity"
            title="Validated bug mix"
            description="See where risk concentrates without opening individual reports."
          />
        </CardHeader>
        <CardSection>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-red-100 bg-red-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Critical</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.critical}</p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-orange-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">High</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.high}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Medium</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.medium}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Low</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.low}</p>
            </div>
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
