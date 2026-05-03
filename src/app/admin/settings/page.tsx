import { env } from "@/lib/env";
import { getAdminSettingsData } from "@/lib/dashboard-data";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
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
        description="Rate limits, pricing defaults, upload limits, and environment-specific configuration."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>Security controls</CardTitle>
            <CardDescription>RBAC, agreements, file validation, and audit retention</CardDescription>
          </CardHeader>
          <CardSection>
            <p className="text-sm leading-relaxed text-slate-600">
              Policy-oriented controls are surfaced here for admins to review and adjust over time.
            </p>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Pricing configuration</CardTitle>
            <CardDescription>Base rates used in campaign estimates</CardDescription>
          </CardHeader>
          <CardSection className="space-y-2 text-sm text-slate-600">
            <p>Crowd tester base price: <span className="font-medium text-slate-900">{env.CROWD_TESTER_BASE_PRICE}</span></p>
            <p>Developer tester base price: <span className="font-medium text-slate-900">{env.DEVELOPER_TESTER_BASE_PRICE}</span></p>
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
