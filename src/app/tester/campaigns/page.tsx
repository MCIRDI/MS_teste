import Link from "next/link";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { requireSession } from "@/lib/auth";
import { getTesterDashboardData } from "@/lib/dashboard-data";
import { getTesterSetupState } from "@/lib/tester-setup";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
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
        <Card padding="none">
          <CardHeader>
            <CardTitle>Profile incomplete</CardTitle>
            <CardDescription>{setup.reason ?? "Tester info is incomplete."}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-start">
            <Link href={`/tester/setup?next=${next}`}>
              <Button>Complete setup</Button>
            </Link>
          </CardFooter>
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
      <div className="grid gap-4">
        {data.pendingInvitations.length === 0 ? (
          <Card variant="muted">
            <p className="text-sm text-slate-600">No pending tester invitations right now.</p>
          </Card>
        ) : (
          data.pendingInvitations.map((invitation) => (
            <Card key={invitation.id} padding="none">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{invitation.campaign.projectName}</CardTitle>
                  <CardDescription>
                    {session.testerKind === "DEVELOPER" ? "Developer tester slot" : "Crowd tester slot"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardSection className="space-y-3 border-t border-slate-100/90 bg-white/50">
                <p className="text-sm leading-relaxed text-slate-600">{invitation.campaign.description}</p>
                <p className="text-xs font-medium text-slate-500">
                  Filled slots:{" "}
                  {invitation.campaign.assignments.filter((item) => item.assignmentRole === testerAssignmentRole).length}
                  /
                  {testerAssignmentRole === "DEVELOPER_TESTER"
                    ? invitation.campaign.developerTesterCount
                    : invitation.campaign.crowdTesterCount}
                </p>
              </CardSection>
              <CardFooter className="flex justify-end">
                <form action={acceptInvitationAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit">Accept invitation</Button>
                </form>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      <SectionHeading
        eyebrow="Workspace"
        title="Accepted campaigns"
        description="Accepted campaigns move into your personal workspace for tasks, instructions, and bug submission."
      />
      <div className="grid gap-4">
        {data.assignments.length === 0 ? (
          <Card variant="muted">
            <p className="text-sm text-slate-600">You have not accepted any campaigns yet.</p>
          </Card>
        ) : (
          data.assignments.map((assignment) => (
            <Card key={assignment.id} padding="none">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{assignment.campaign.projectName}</CardTitle>
                  <CardDescription>Active workspace</CardDescription>
                </div>
              </CardHeader>
              <CardSection className="border-t border-slate-100/90 bg-white/50">
                <p className="text-sm leading-relaxed text-slate-600">{assignment.campaign.description}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Tasks: {assignment.campaign.tasks.length} · Pending invites:{" "}
                  {assignment.campaign.invitations.filter((item) => item.status === "PENDING").length}
                </p>
              </CardSection>
              <CardFooter className="flex justify-end">
                <Link href={`/tester/workspace/${assignment.campaignId}`}>
                  <Button>Open workspace</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
