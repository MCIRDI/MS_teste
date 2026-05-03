import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { acceptInvitationAction } from "@/app/actions/campaigns";
import { markBugGroupDuplicatesAction, moderateBugGroupAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { getModeratorDashboardData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

const bugTypes = [
  "Functional Bugs",
  "UI / Visual Issues",
  "Performance Issues",
  "Crash / Critical Errors",
  "Compatibility Issues",
  "Usability Problems",
  "Security Issues",
  "Data Issues",
  "Network / API Issues",
  "Localization / Language Issues",
  "Installation / Setup Issues",
  "Edge Case Bugs",
  "Other",
] as const;

export default async function ModeratorReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { tab, type } = await searchParams;
  const data = await getModeratorDashboardData(session.id);

  const campaignNameById = new Map<string, string>();
  for (const assignment of data.assignments) {
    campaignNameById.set(assignment.campaignId, assignment.campaign.projectName);
  }

  const tabKey = (tab ?? "pending").toLowerCase();
  const tabLabel =
    tabKey === "needs-info"
      ? "Needs Info"
      : tabKey === "duplicates"
        ? "Duplicates"
        : tabKey === "approved"
          ? "Approved"
          : tabKey === "rejected"
            ? "Rejected"
            : "Pending Review";

  const isTabStatus = (status: BugStatus) => {
    switch (tabKey) {
      case "pending":
        return status === BugStatus.SUBMITTED;
      case "needs-info":
        return status === BugStatus.NEEDS_INFO;
      case "duplicates":
        return status === BugStatus.DUPLICATE;
      case "approved":
        return status === BugStatus.APPROVED;
      case "rejected":
        return status === BugStatus.REJECTED;
      default:
        return status === BugStatus.SUBMITTED;
    }
  };

  const counts = {
    pending: data.groups.filter((group) => group.status === BugStatus.SUBMITTED).length,
    needsInfo: data.groups.filter((group) => group.status === BugStatus.NEEDS_INFO).length,
    duplicates: data.groups.filter((group) => group.status === BugStatus.DUPLICATE).length,
    approved: data.groups.filter((group) => group.status === BugStatus.APPROVED).length,
    rejected: data.groups.filter((group) => group.status === BugStatus.REJECTED).length,
  };

  const visibleGroups = data.groups.filter((group) => isTabStatus(group.status));
  const filteredGroups =
    type && type !== "all" ? visibleGroups.filter((group) => group.errorType === type) : visibleGroups;

  const severityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-amber-100 text-amber-900";
      case "LOW":
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <StatGrid items={data.stats} />

      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Invitations"
            title="Available moderation campaigns"
            description="The first moderators to accept fill the required slots. When full, the invitation disappears for everyone else."
          />
        </CardHeader>
        <CardSection className="space-y-4 border-t border-slate-100/90">
          {data.pendingInvitations.length === 0 ? (
            <p className="text-sm text-slate-600">No pending moderator invitations right now.</p>
          ) : (
            <div className="grid gap-4">
              {data.pendingInvitations.map((invitation) => (
                <Card key={invitation.id} variant="muted" padding="none">
                  <CardSection>
                    <CardTitle className="text-lg">{invitation.campaign.projectName}</CardTitle>
                    <CardDescription className="mt-2">{invitation.campaign.description}</CardDescription>
                    <CardMeta className="mt-4 sm:grid-cols-2">
                      <CardMetaItem label="Moderator slots">
                        {invitation.campaign.assignments.filter((item) => item.assignmentRole === "MODERATOR").length}/
                        {invitation.campaign.moderatorSlots}
                      </CardMetaItem>
                    </CardMeta>
                  </CardSection>
                  <CardFooter className="flex justify-end">
                    <form action={acceptInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit">Accept moderation</Button>
                    </form>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            density="panel"
            eyebrow="Inbox"
            title="Bug review inbox"
            description="Grouped reports with quick actions. Pending review stays on top."
          />
          <Link href="/moderator/campaigns">
            <Button variant="secondary">Campaigns</Button>
          </Link>
        </CardHeader>
        <CardSection className="space-y-4 border-t border-slate-100/90">
          <Tabs
            active={tabLabel}
            items={[
              { href: "/moderator/review-queue?tab=pending", label: "Pending Review", count: counts.pending },
              { href: "/moderator/review-queue?tab=needs-info", label: "Needs Info", count: counts.needsInfo },
              { href: "/moderator/review-queue?tab=duplicates", label: "Duplicates", count: counts.duplicates },
              { href: "/moderator/review-queue?tab=approved", label: "Approved", count: counts.approved },
              { href: "/moderator/review-queue?tab=rejected", label: "Rejected", count: counts.rejected },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <div className="flex flex-wrap gap-2">
              <Link href={`/moderator/review-queue?tab=${encodeURIComponent(tabKey)}&type=all`}>
                <Badge className={type === "all" || !type ? "border-transparent bg-blue-600 text-white" : ""}>All</Badge>
              </Link>
              {bugTypes.map((label) => (
                <Link key={label} href={`/moderator/review-queue?tab=${encodeURIComponent(tabKey)}&type=${encodeURIComponent(label)}`}>
                  <Badge className={type === label ? "border-transparent bg-blue-600 text-white" : ""}>{label}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </CardSection>
      </Card>

      {filteredGroups.length === 0 ? (
        <Card variant="muted">
          <p className="text-sm text-slate-600">Nothing in this tab right now.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => {
            const campaignName = campaignNameById.get(group.campaignId) ?? "Campaign";
            return (
              <Card key={`${group.campaignId}:${group.groupKey}`} padding="none">
                <CardSection>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={severityBadgeClass(group.severity)}>{group.severity}</Badge>
                    {group.errorType ? <Badge>{group.errorType}</Badge> : null}
                    <Badge>{group.deviceLabel}</Badge>
                    <Badge>Priority {group.priorityScore}</Badge>
                    {group.duplicateCount > 0 ? <Badge>Duplicates {group.duplicateCount}</Badge> : null}
                  </div>
                  <Link
                    href={`/moderator/bugs/${group.representative.id}`}
                    className="mt-3 block text-lg font-semibold text-slate-900 hover:text-blue-700 hover:underline"
                  >
                    {group.title}
                  </Link>
                  <CardMeta className="mt-4">
                    <CardMetaItem label="Campaign">
                      <Link href={`/moderator/campaigns/${group.campaignId}`} className="font-medium text-blue-700 hover:text-blue-800">
                        {campaignName}
                      </Link>
                    </CardMetaItem>
                    <CardMetaItem label="Tester">{group.representative.tester.name}</CardMetaItem>
                    <CardMetaItem label="Rating">{group.testerRating.toFixed(1)}</CardMetaItem>
                    <CardMetaItem label="Updated">{group.latestAt.toLocaleString()}</CardMetaItem>
                    <CardMetaItem label="Feature">{group.feature ?? "—"}</CardMetaItem>
                    <CardMetaItem label="Error type">{group.errorType ?? "—"}</CardMetaItem>
                    <CardMetaItem label="Page">{group.pageUrl ?? "—"}</CardMetaItem>
                  </CardMeta>
                </CardSection>
                <CardFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <form action={moderateBugGroupAction} className="grid gap-2">
                    <input type="hidden" name="campaignId" value={group.campaignId} />
                    <input type="hidden" name="groupKey" value={group.groupKey} />
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
                        type="submit"
                        name="decision"
                        value="APPROVED"
                      >
                        Send to manager
                      </button>
                      <button
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-900 hover:bg-slate-300"
                        type="submit"
                        name="decision"
                        value="NEEDS_INFO"
                      >
                        Needs info
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
                        type="submit"
                        name="decision"
                        value="REJECTED"
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                  {group.count > 1 ? (
                    <form action={markBugGroupDuplicatesAction}>
                      <input type="hidden" name="campaignId" value={group.campaignId} />
                      <input type="hidden" name="groupKey" value={group.groupKey} />
                      <button className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 hover:bg-slate-100 sm:w-auto" type="submit">
                        Mark duplicates
                      </button>
                    </form>
                  ) : null}
                  <Link href={`/moderator/bugs/${group.representative.id}`}>
                    <Button variant="secondary" className="w-full sm:w-auto">
                      Open details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
