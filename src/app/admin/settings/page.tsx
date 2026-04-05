import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
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
          <p className="text-sm leading-7 text-stone-600">Base tester rates and campaign multiplier settings are driven by environment variables and can later be moved into persisted admin controls.</p>
        </Card>
      </div>
    </div>
  );
}
