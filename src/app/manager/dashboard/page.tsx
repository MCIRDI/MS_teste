import Link from "next/link";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
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
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Invitations"
          title="Available manager campaigns"
          description="The first test manager to accept a campaign becomes the assigned owner for delivery and final validation."
        />
        {data.pendingInvitations.length === 0 ? (
          <p className="text-sm text-stone-600">No pending manager invitations right now.</p>
        ) : (
          <div className="grid gap-4">
            {data.pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="grid gap-4 rounded-3xl bg-stone-100 p-4 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl text-stone-900">{invitation.campaign.projectName}</h2>
                  <p className="text-sm text-stone-600">{invitation.campaign.description}</p>
                  <p className="text-sm text-stone-600">
                    Moderators needed: {invitation.campaign.moderatorSlots} · Testers needed:{" "}
                    {invitation.campaign.crowdTesterCount + invitation.campaign.developerTesterCount}
                  </p>
                </div>
                <form action={acceptInvitationAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit">Accept campaign</Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Oversight"
          title="Assigned campaign progress"
          description="These figures are live from accepted assignments, pending invitations, and the current bug pipeline."
        />
        <div className="space-y-3">
          {data.campaigns.length === 0 ? (
            <p className="text-sm text-stone-600">No campaigns are assigned to you yet.</p>
          ) : (
            data.campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/manager/campaigns/${campaign.id}`}>
                <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-700 hover:bg-stone-200 cursor-pointer transition-colors">
                  <p className="font-medium text-stone-900">{campaign.projectName}</p>
                  <p className="mt-2">
                    Moderators: {campaign.assignments.filter((item) => item.assignmentRole === "MODERATOR").length}/
                    {campaign.moderatorSlots}
                  </p>
                  <p>
                    Crowd testers: {campaign.assignments.filter((item) => item.assignmentRole === "CROWD_TESTER").length}/
                    {campaign.crowdTesterCount}
                  </p>
                  <p>
                    Developer testers: {campaign.assignments.filter((item) => item.assignmentRole === "DEVELOPER_TESTER").length}/
                    {campaign.developerTesterCount}
                  </p>
                  <p>
                    Pending invitations: {campaign.invitations.filter((item) => item.status === "PENDING").length}
                  </p>
                  <p>
                    Approved bugs: {campaign.bugReports.filter((bug) => bug.status === "APPROVED").length} · Validated bugs:{" "}
                    {campaign.bugReports.filter((bug) => bug.status === "VALIDATED").length}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
