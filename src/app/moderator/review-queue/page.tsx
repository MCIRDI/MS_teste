import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { acceptInvitationAction } from "@/app/actions/campaigns";
import { markBugGroupDuplicatesAction, moderateBugGroupAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { getModeratorDashboardData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        return "bg-stone-100 text-stone-700";
    }
  };

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <StatGrid items={data.stats} />

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Invitations"
          title="Available moderation campaigns"
          description="The first moderators to accept fill the required slots. Once the campaign is full, the invitation disappears for everyone else."
        />
        {data.pendingInvitations.length === 0 ? (
          <p className="text-sm text-stone-600">No pending moderator invitations right now.</p>
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
                    Filled moderator slots:{" "}
                    {invitation.campaign.assignments.filter((item) => item.assignmentRole === "MODERATOR").length}/
                    {invitation.campaign.moderatorSlots}
                  </p>
                </div>
                <form action={acceptInvitationAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit">Accept moderation</Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Inbox"
          title="Bug review inbox"
          description="Grouped reports with quick actions. Pending review stays on top."
          action={
            <Link href="/moderator/campaigns">
              <Button variant="secondary">Campaigns</Button>
            </Link>
          }
        />
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
          <span className="text-sm font-medium text-stone-700">Type</span>
          <div className="flex flex-wrap gap-2">
            <Link href={`/moderator/review-queue?tab=${encodeURIComponent(tabKey)}&type=all`}>
              <Badge className={type === "all" || !type ? "bg-stone-900 text-white" : ""}>All</Badge>
            </Link>
            {bugTypes.map((label) => (
              <Link key={label} href={`/moderator/review-queue?tab=${encodeURIComponent(tabKey)}&type=${encodeURIComponent(label)}`}>
                <Badge className={type === label ? "bg-stone-900 text-white" : ""}>{label}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {filteredGroups.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-600">Nothing in this tab right now.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => {
            const campaignName = campaignNameById.get(group.campaignId) ?? "Campaign";
            return (
              <Card key={`${group.campaignId}:${group.groupKey}`} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={severityBadgeClass(group.severity)}>{group.severity}</Badge>
                    {group.errorType ? <Badge>{group.errorType}</Badge> : null}
                    <Badge>{group.deviceLabel}</Badge>
                    <Badge>Priority {group.priorityScore}</Badge>
                    {group.duplicateCount > 0 ? <Badge>Duplicates {group.duplicateCount}</Badge> : null}
                    <Link href={`/moderator/campaigns/${group.campaignId}`} className="text-sm text-stone-700 hover:underline">
                      {campaignName}
                    </Link>
                  </div>
                  <div className="space-y-1">
                    <Link
                      href={`/moderator/bugs/${group.representative.id}`}
                      className="text-lg font-semibold text-stone-900 hover:underline"
                    >
                      {group.title}
                    </Link>
                    <p className="text-sm text-stone-600">
                      Tester: {group.representative.tester.name} · Rating: {group.testerRating.toFixed(1)} · Updated{" "}
                      {group.latestAt.toLocaleString()}
                    </p>
                    <p className="text-sm text-stone-600">
                      {group.feature ? `Feature: ${group.feature}` : "Feature: —"} ·{" "}
                      {group.errorType ? `Error: ${group.errorType}` : "Error: —"} ·{" "}
                      {group.pageUrl ? `Page: ${group.pageUrl}` : "Page: —"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <form action={moderateBugGroupAction} className="grid gap-2">
                    <input type="hidden" name="campaignId" value={group.campaignId} />
                    <input type="hidden" name="groupKey" value={group.groupKey} />
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                        type="submit"
                        name="decision"
                        value="APPROVED"
                      >
                        Send to manager
                      </button>
                      <button
                        className="rounded-full bg-stone-200 px-4 py-2 text-sm text-stone-900"
                        type="submit"
                        name="decision"
                        value="NEEDS_INFO"
                      >
                        Needs info
                      </button>
                      <button
                        className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-900"
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
                      <button className="w-full rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-900" type="submit">
                        Mark duplicates
                      </button>
                    </form>
                  ) : null}
                  <Link href={`/moderator/bugs/${group.representative.id}`}>
                    <Button variant="secondary" className="w-full">
                      Open details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
