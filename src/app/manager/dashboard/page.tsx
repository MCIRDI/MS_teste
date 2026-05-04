import Link from "next/link";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
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
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { Button } from "@/components/ui/button";

export default async function ManagerDashboardPage() {
  const session = await requireSession(["TEST_MANAGER"]);
  const data = await getManagerDashboardData(session.id);

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <StatGrid items={data.stats} />
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Invitations"
            title="Available manager campaigns"
            description="The first test manager to accept a campaign becomes the assigned owner for delivery and final validation."
          />
        </CardHeader>
        <CardSection className="space-y-4 border-t border-slate-100/90">
          {data.pendingInvitations.length === 0 ? (
            <p className="text-sm text-slate-600">No pending manager invitations right now.</p>
          ) : (
            data.pendingInvitations.map((invitation) => (
              <Card key={invitation.id} variant="muted" padding="none">
                <CardSection>
                  <CardTitle className="text-lg">{invitation.campaign.projectName}</CardTitle>
                  <CardDescription className="mt-2">{invitation.campaign.description}</CardDescription>
                  <CardMeta className="mt-4 sm:grid-cols-2">
                    <CardMetaItem label="Moderator slots">{invitation.campaign.moderatorSlots}</CardMetaItem>
                    <CardMetaItem label="Testers needed">
                      {invitation.campaign.crowdTesterCount + invitation.campaign.developerTesterCount}
                    </CardMetaItem>
                  </CardMeta>
                </CardSection>
                <CardFooter className="flex justify-end">
                  <form action={acceptInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <Button type="submit">Accept campaign</Button>
                  </form>
                </CardFooter>
              </Card>
            ))
          )}
        </CardSection>
      </Card>
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Oversight"
            title="Assigned campaign progress"
            description="Live staffing and bug pipeline for campaigns you own."
          />
        </CardHeader>
        <CardSection className="space-y-3 border-t border-slate-100/90">
          {data.campaigns.length === 0 ? (
            <p className="text-sm text-slate-600">No campaigns are assigned to you yet.</p>
          ) : (
            data.campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/manager/campaigns/${campaign.id}`} className="block">
                <Card variant="muted" className="transition hover:ring-blue-200">
                  <CardTitle className="text-base">{campaign.projectName}</CardTitle>
                  <CardMeta className="mt-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    <CardMetaItem label="Moderators">
                      {campaign.assignments.filter((item) => item.assignmentRole === "MODERATOR").length}/
                      {campaign.moderatorSlots}
                    </CardMetaItem>
                    <CardMetaItem label="Crowd testers">
                      {campaign.assignments.filter((item) => item.assignmentRole === "CROWD_TESTER").length}/
                      {campaign.crowdTesterCount}
                    </CardMetaItem>
                    <CardMetaItem label="Developer testers">
                      {campaign.assignments.filter((item) => item.assignmentRole === "DEVELOPER_TESTER").length}/
                      {campaign.developerTesterCount}
                    </CardMetaItem>
                    <CardMetaItem label="Pending invites">
                      {campaign.invitations.filter((item) => item.status === "PENDING").length}
                    </CardMetaItem>
                    <CardMetaItem label="Approved bugs">
                      {campaign.bugReports.filter((bug) => bug.status === "APPROVED").length}
                    </CardMetaItem>
                  </CardMeta>
                </Card>
              </Link>
            ))
          )}
        </CardSection>
      </Card>
    </div>
  );
}
