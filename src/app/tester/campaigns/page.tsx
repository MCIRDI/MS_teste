import Link from "next/link";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { requireSession } from "@/lib/auth";
import { getTesterDashboardData } from "@/lib/dashboard-data";
import { getTesterSetupState } from "@/lib/tester-setup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function TesterCampaignsPage() {
  const session = await requireSession(["TESTER"]);
  const setup = await getTesterSetupState(session.id);
  if (setup.needsSetup) {
    const next = encodeURIComponent("/tester/campaigns");
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Setup"
          title="Add your testing info first"
          description="Before you can participate in campaigns, we need your country and device details."
        />
        <Card className="space-y-3">
          <p className="text-sm text-stone-600">{setup.reason ?? "Tester info is incomplete."}</p>
          <Link href={`/tester/setup?next=${next}`}>
            <Button>Complete setup</Button>
          </Link>
        </Card>
      </div>
    );
  }
  const data = await getTesterDashboardData(session.id);
  const testerAssignmentRole =
    session.testerKind === "DEVELOPER" ? "DEVELOPER_TESTER" : "CROWD_TESTER";

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <StatGrid items={data.stats} />
      <SectionHeading
        eyebrow="Invitations"
        title="Available campaigns"
        description="Matching invitations stay visible until the required tester slots are accepted by the first eligible people."
      />
      <div className="grid gap-5">
        {data.pendingInvitations.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-600">No pending tester invitations right now.</p>
          </Card>
        ) : (
          data.pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-2">
                <h2 className="font-serif text-3xl text-stone-900">{invitation.campaign.projectName}</h2>
                <p className="text-sm text-stone-600">
                  {session.testerKind === "DEVELOPER" ? "Developer tester" : "Crowd tester"} slot
                </p>
                <p className="text-sm leading-7 text-stone-600">{invitation.campaign.description}</p>
                <p className="text-sm text-stone-600">
                  Filled slots: {invitation.campaign.assignments.filter((item) => item.assignmentRole === testerAssignmentRole).length}/
                  {testerAssignmentRole === "DEVELOPER_TESTER"
                    ? invitation.campaign.developerTesterCount
                    : invitation.campaign.crowdTesterCount}
                </p>
              </div>
              <form action={acceptInvitationAction}>
                <input type="hidden" name="invitationId" value={invitation.id} />
                <Button type="submit">Accept invitation</Button>
              </form>
            </Card>
          ))
        )}
      </div>
      <SectionHeading
        eyebrow="Workspace"
        title="Accepted campaigns"
        description="Accepted campaigns move into your personal workspace for tasks, instructions, and bug submission."
      />
      <div className="grid gap-5">
        {data.assignments.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-600">You have not accepted any campaigns yet.</p>
          </Card>
        ) : (
          data.assignments.map((assignment) => (
            <Card key={assignment.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-2">
                <h2 className="font-serif text-3xl text-stone-900">{assignment.campaign.projectName}</h2>
                <p className="text-sm leading-7 text-stone-600">{assignment.campaign.description}</p>
                <p className="text-sm text-stone-600">
                  Tasks: {assignment.campaign.tasks.length} · Pending campaign invites:{" "}
                  {assignment.campaign.invitations.filter((item) => item.status === "PENDING").length}
                </p>
              </div>
              <Link href={`/tester/workspace/${assignment.campaignId}`}>
                <Button>Open workspace</Button>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
