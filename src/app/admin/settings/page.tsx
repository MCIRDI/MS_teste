import { env } from "@/lib/env";
import { getAdminSettingsData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function AdminSettingsPage() {
  const data = await getAdminSettingsData();

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <SectionHeading
        eyebrow="Settings"
        title="System settings"
        description="Rate limits, pricing defaults, upload size limits, and environment-specific configuration belong in this admin surface."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Security controls</h2>
          <p className="text-sm leading-7 text-stone-600">RBAC, confidentiality agreement flows, file validation rules, and audit retention policies are all surfaced here.</p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Pricing configuration</h2>
          <p className="text-sm leading-7 text-stone-600">Crowd tester base price: {env.CROWD_TESTER_BASE_PRICE}</p>
          <p className="text-sm leading-7 text-stone-600">Developer tester base price: {env.DEVELOPER_TESTER_BASE_PRICE}</p>
        </Card>
      </div>
    </div>
  );
}
