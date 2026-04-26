import { getAdminDashboardData } from "@/lib/dashboard-data";
import { assignmentRoleLabels } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";

function countByRole(
  items: Array<{ assignmentRole: string }>,
  role: string,
) {
  return items.filter((item) => item.assignmentRole === role).length;
}

export default async function AdminCampaignsPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <SectionHeading
        eyebrow="Campaigns"
        title="Campaign monitoring"
        description="Admins track live campaigns, staffing progress, pending invitations, and coverage across the platform."
      />
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => (
          <Card key={campaign.id} className="space-y-3">
            <h2 className="font-serif text-2xl text-stone-900">{campaign.projectName}</h2>
            <p className="text-sm text-stone-600">{campaign.client.name} · {campaign.stage}</p>
            <p className="text-sm text-stone-600">
              Pending invitations: {campaign.invitations.filter((item) => item.status === "PENDING").length}
            </p>
            <div className="grid gap-2 pt-2 text-sm text-stone-600 md:grid-cols-2">
              <p>
                {assignmentRoleLabels.TEST_MANAGER}: {countByRole(campaign.assignments, "TEST_MANAGER")}/1
              </p>
              <p>
                {assignmentRoleLabels.MODERATOR}: {countByRole(campaign.assignments, "MODERATOR")}/{campaign.moderatorSlots}
              </p>
              <p>
                {assignmentRoleLabels.CROWD_TESTER}: {countByRole(campaign.assignments, "CROWD_TESTER")}/{campaign.crowdTesterCount}
              </p>
              <p>
                {assignmentRoleLabels.DEVELOPER_TESTER}: {countByRole(campaign.assignments, "DEVELOPER_TESTER")}/{campaign.developerTesterCount}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
