import { getAdminDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function AdminCampaignsPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Campaigns"
        title="Campaign monitoring"
        description="Admins track live campaigns, assignment balance, fraud signals, and moderation capacity across the platform."
      />
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => (
          <Card key={campaign.id} className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">{campaign.projectName}</h2>
            <p className="text-sm text-stone-600">{campaign.client.name} · {campaign.stage}</p>
            <p className="text-sm text-stone-600">{campaign.assignments.length} assignments</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
