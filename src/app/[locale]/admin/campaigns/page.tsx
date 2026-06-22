import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getLocalizedLabels } from "@/lib/i18n-server";
import { updateCampaignStageAction } from "@/app/actions/campaigns";
import { prisma } from "@/lib/prisma";
import { AccountStatus, InvitationStatus, Role } from "@/generated/prisma";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignStageBadge } from "@/components/ui/campaign-stage-badge";
import { CampaignStageEditor } from "@/components/campaigns/campaign-stage-editor";
import { CampaignStaffingPanel } from "@/components/campaigns/campaign-staffing-panel";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { SectionHeading } from "@/components/sections/section-heading";

function countByRole(items: Array<{ assignmentRole: string }>, role: string) {
  return items.filter((item) => item.assignmentRole === role).length;
}

const COMPLETABLE_STAGES = new Set(["ACTIVE", "TESTING", "BUG_REVIEW"]);

export default async function AdminCampaignsPage() {
  const { assignmentRoleLabels } = await getLocalizedLabels();

  // Fetch campaigns + shared user pools in parallel
  const [data, moderators, testers] = await Promise.all([
    getAdminDashboardData(),
    prisma.user.findMany({
      where: { role: Role.MODERATOR, accountStatus: AccountStatus.ACTIVE },
      select: { id: true, name: true, email: true, country: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: [Role.TESTER, Role.CERT_TESTER] },
        accountStatus: AccountStatus.ACTIVE,
        devices: { some: {} },
      },
      select: { id: true, name: true, email: true, country: true, isCertified: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <RealtimeRefresh />
      <SectionHeading
        eyebrow="Campaigns"
        title="Campaign monitoring"
        description="Live campaigns, staffing progress, pending invitations, and coverage across the platform."
      />
      <div className="grid gap-4">
        {data.campaigns.map((campaign) => {
          // Build staffing-panel-compatible campaign object
          const staffingCampaign = {
            id: campaign.id,
            projectName: campaign.projectName,
            moderatorSlots: campaign.moderatorSlots,
            crowdTesterCount: campaign.crowdTesterCount,
            certTesterCount: campaign.certTesterCount,
            assignments: campaign.assignments.map((a) => ({
              userId: a.userId,
              assignmentRole: a.assignmentRole,
            })),
            invitations: campaign.invitations
              .filter(
                (i) =>
                  i.status === InvitationStatus.PENDING ||
                  i.status === InvitationStatus.ACCEPTED,
              )
              .map((i) => ({
                recipientId: i.recipientId,
                assignmentRole: i.assignmentRole,
              })),
          };

          return (
            <Card key={campaign.id} padding="none">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{campaign.projectName}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      {campaign.client.name}
                      <span className="inline-flex items-center gap-0.5">
                        <CampaignStageBadge stage={campaign.stage} />
                        <CampaignStageEditor campaignId={campaign.id} currentStage={campaign.stage} />
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {COMPLETABLE_STAGES.has(campaign.stage) && (
                      <form action={updateCampaignStageAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="stage" value="COMPLETED" />
                        <Button type="submit" variant="secondary" className="h-8 text-xs">
                          Mark completed
                        </Button>
                      </form>
                    )}
                    <CampaignStaffingPanel
                      campaign={staffingCampaign}
                      moderators={moderators}
                      testers={testers}
                    />
                  </div>
                </div>
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
                  <CardMetaItem label={assignmentRoleLabels.CERT_TESTER}>
                    {countByRole(campaign.assignments, "CERT_TESTER")}/{campaign.certTesterCount}
                  </CardMetaItem>
                </CardMeta>
              </CardSection>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
