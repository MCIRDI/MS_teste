import { requireSession } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function ClientDashboardPage() {
  const session = await requireSession(["CLIENT"]);
  const data = await getClientDashboardData(session.id);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Campaign portfolio"
          title="Campaign overview"
          description="This dashboard reflects the campaigns, tester allocation, and validated bug totals currently stored in the platform."
        />
        <div className="overflow-hidden rounded-3xl border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Testers</th>
                <th className="px-4 py-3 font-medium">Bugs</th>
                <th className="px-4 py-3 font-medium">Countries</th>
                <th className="px-4 py-3 font-medium">Estimated cost</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-t border-stone-200">
                  <td className="px-4 py-4 text-stone-900">{campaign.name}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.testers}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.bugs}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.countries || "None"}</td>
                  <td className="px-4 py-4 text-stone-600">{formatCurrency(campaign.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Severity"
          title="Validated bug mix"
          description="Clients can quickly read where the risk concentration is without digging into raw reports."
        />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-stone-100 p-5">
            <p className="text-sm text-stone-500">Critical</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{data.severity.critical}</p>
          </div>
          <div className="rounded-3xl bg-stone-100 p-5">
            <p className="text-sm text-stone-500">High</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{data.severity.high}</p>
          </div>
          <div className="rounded-3xl bg-stone-100 p-5">
            <p className="text-sm text-stone-500">Medium</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{data.severity.medium}</p>
          </div>
          <div className="rounded-3xl bg-stone-100 p-5">
            <p className="text-sm text-stone-500">Low</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{data.severity.low}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
