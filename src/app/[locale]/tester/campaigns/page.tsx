import { getTranslations } from "next-intl/server";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import {
  getTesterOnboardingPath,
  isAwaitingAdminAfterVetting,
  needsTesterOnboarding,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";
import { getTesterDashboardData } from "@/lib/dashboard-data";

export default async function TesterCampaignsPage() {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  if (session.role === "TESTER") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { accountStatus: true, role: true, country: true, vetingScore: true },
    });

    if (isAwaitingAdminAfterVetting(user)) {
      return await redirectTo("/api/auth/pending-logout");
    }

    if (needsTesterOnboarding(user)) {
      return await redirectTo(getTesterOnboardingPath(user));
    }
  }

  const t = await getTranslations("tester.home");
  const data = await getTesterDashboardData(session.id);
  const testerAssignmentRole = session.isCertified ? "CERT_TESTER" : "CROWD_TESTER";

  return (
    <div className="space-y-6">
      <RealtimeRefresh />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/tester/bugs/new"
          className="bento-card group flex items-center gap-4 p-5 transition hover:border-blue-200"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-sm shadow-blue-600/30">
            +
          </span>
          <div>
            <p className="font-semibold text-slate-900">{t("quickActions.submitBug")}</p>
            <p className="mt-0.5 text-sm text-blue-600">{t("quickActions.submitBugDesc")}</p>
          </div>
        </Link>
        <Link
          href="/tester/profile"
          className="bento-card flex items-center gap-4 p-5 transition hover:border-blue-200"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xl">
            👤
          </span>
          <div>
            <p className="font-semibold text-slate-900">{t("quickActions.profile")}</p>
            <p className="mt-0.5 text-sm text-slate-500">{t("quickActions.profileDesc")}</p>
          </div>
        </Link>
      </div>

      <StatGrid items={data.stats} />

      <SectionHeading
        eyebrow={t("invitations.eyebrow")}
        title={t("invitations.title")}
        description={t("invitations.description")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.pendingInvitations.length === 0 ? (
          <Card variant="muted" className="col-span-full border-dashed">
            <CardSection className="py-10 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-3 text-sm font-medium text-slate-700">{t("invitations.empty")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("invitations.emptyHint")}</p>
            </CardSection>
          </Card>
        ) : (
          data.pendingInvitations.map((invitation) => (
            <Card key={invitation.id} padding="none" className="bento-card overflow-hidden border-blue-100/80">
              <CardHeader className="border-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{invitation.campaign.projectName}</CardTitle>
                    <CardDescription className="mt-1">
                      {session.isCertified
                        ? t("invitations.certSlot")
                        : t("invitations.crowdSlot")}
                    </CardDescription>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                    {t("invitations.new")}
                  </span>
                </div>
              </CardHeader>
              <CardSection className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-600">{invitation.campaign.description}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (invitation.campaign.assignments.filter(
                            (item) => item.assignmentRole === testerAssignmentRole,
                          ).length /
                            Math.max(
                              1,
                              testerAssignmentRole === "CERT_TESTER"
                                ? invitation.campaign.certTesterCount
                                : invitation.campaign.crowdTesterCount,
                            )) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {invitation.campaign.assignments.filter(
                      (item) => item.assignmentRole === testerAssignmentRole,
                    ).length}
                    /
                    {testerAssignmentRole === "CERT_TESTER"
                      ? invitation.campaign.certTesterCount
                      : invitation.campaign.crowdTesterCount}
                  </span>
                </div>
              </CardSection>
              <CardFooter className="border-t border-slate-100 bg-slate-50/50">
                <form action={acceptInvitationAction} className="w-full">
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit" className="w-full">
                    {t("invitations.accept")}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <SectionHeading
        eyebrow={t("workspace.eyebrow")}
        title={t("workspace.title")}
        description={t("workspace.description")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.assignments.length === 0 ? (
          <Card variant="muted" className="col-span-full border-dashed">
            <CardSection className="py-10 text-center">
              <p className="text-4xl">🚀</p>
              <p className="mt-3 text-sm font-medium text-slate-700">{t("workspace.empty")}</p>
            </CardSection>
          </Card>
        ) : (
          data.assignments.map((assignment) => (
            <Card key={assignment.id} padding="none" className="bento-card">
              <CardHeader>
                <CardTitle className="text-lg">{assignment.campaign.projectName}</CardTitle>
                <CardDescription>{t("workspace.active")}</CardDescription>
              </CardHeader>
              <CardSection>
                <p className="text-sm leading-relaxed text-slate-600">{assignment.campaign.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {t("workspace.tasks")}: {assignment.campaign.tasks.length}
                  </span>
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                    {t("workspace.pendingInvites")}:{" "}
                    {assignment.campaign.invitations.filter((item) => item.status === "PENDING").length}
                  </span>
                </div>
              </CardSection>
              <CardFooter className="border-t border-slate-100">
                <Link href={`/tester/workspace/${assignment.campaignId}`} className="w-full">
                  <Button className="w-full">{t("workspace.open")}</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
