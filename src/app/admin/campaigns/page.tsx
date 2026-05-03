import { getAdminDashboardData } from "@/lib/dashboard-data";
import { assignmentRoleLabels } from "@/lib/constants";
import {
  Card,
  CardDescription,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
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
        description="Live campaigns, staffing progress, pending invitations, and coverage across the platform."
      />
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => (
          <Card key={campaign.id} padding="none">
            <CardHeader>
              <CardTitle className="text-lg">{campaign.projectName}</CardTitle>
              <CardDescription>
                {campaign.client.name} · {campaign.stage}
              </CardDescription>
            </CardHeader>
            <CardSection className="border-t border-slate-100/90">
              <CardMeta className="sm:grid-cols-2 lg:grid-cols-3">
                <CardMetaItem label="Pending invitations">
                  {campaign.invitations.filter((item) => item.status === "PENDING").length}
                </CardMetaItem>
                <CardMetaItem label={assignmentRoleLabels.TEST_MANAGER}>
                  {countByRole(campaign.assignments, "TEST_MANAGER")}/1
                </CardMetaItem>
                <CardMetaItem label={assignmentRoleLabels.MODERATOR}>
                  {countByRole(campaign.assignments, "MODERATOR")}/{campaign.moderatorSlots}
                </CardMetaItem>
                <CardMetaItem label={assignmentRoleLabels.CROWD_TESTER}>
                  {countByRole(campaign.assignments, "CROWD_TESTER")}/{campaign.crowdTesterCount}
                </CardMetaItem>
                <CardMetaItem label={assignmentRoleLabels.DEVELOPER_TESTER}>
                  {countByRole(campaign.assignments, "DEVELOPER_TESTER")}/{campaign.developerTesterCount}
                </CardMetaItem>
              </CardMeta>
            </CardSection>
          </Card>
        ))}
      </div>
    </div>
  );
}
