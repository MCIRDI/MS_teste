import { clientSnapshot } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <StatGrid items={clientSnapshot.stats} />
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Campaign portfolio"
          title="Live campaign view"
          description="This surface is intended to become the client’s operational dashboard for progress, validated bugs, and analytics."
        />
        <div className="overflow-hidden rounded-3xl border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Testers</th>
                <th className="px-4 py-3 font-medium">Bugs</th>
                <th className="px-4 py-3 font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {clientSnapshot.campaigns.map((campaign) => (
                <tr key={campaign.name} className="border-t border-stone-200">
                  <td className="px-4 py-4 text-stone-900">{campaign.name}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.stage}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.testers}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.bugs}</td>
                  <td className="px-4 py-4 text-stone-600">{campaign.coverage}</td>
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
          {clientSnapshot.severityBreakdown.map((item) => (
            <div key={item.label} className="rounded-3xl bg-stone-100 p-5">
              <p className="text-sm text-stone-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
