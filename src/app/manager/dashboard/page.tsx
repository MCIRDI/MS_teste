import { managerSnapshot } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <StatGrid items={managerSnapshot.stats} />
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Oversight"
          title="Campaign progress"
          description="Managers coordinate moderators, prioritize scope, and keep device and country coverage aligned with the client brief."
        />
        <p className="text-sm leading-7 text-stone-600">Coverage analysis, moderator assignment status, and campaign-level risk summaries fit naturally into this page once connected to live data queries.</p>
      </Card>
    </div>
  );
}
