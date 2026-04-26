import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { markBugGroupDuplicatesAction, moderateBugGroupAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { computePriorityScore, makeGroupKey, severityRank } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/sections/section-heading";
import { BugAnalytics } from "@/components/charts/bug-analytics";

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

type BugEnvironment = {
  device?: string;
  osVersion?: string;
  browser?: string;
  screenResolution?: string;
};

export default async function ModeratorCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { campaignId } = await params;
  const { tab, type } = await searchParams;

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      assignments: {
        where: {
          userId: session.id,
          assignmentRole: "MODERATOR",
        },
      },
      bugReports: {
        where: {
          status: {
            in: [
              BugStatus.SUBMITTED,
              BugStatus.NEEDS_INFO,
              BugStatus.DUPLICATE,
              BugStatus.APPROVED,
              BugStatus.REJECTED,
            ],
          },
        },
        include: {
          tester: true,
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (campaign.assignments.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Campaign moderation"
          title="Access required"
          description="Accept the moderator invitation before opening this campaign."
          action={
            <Link href="/moderator/review-queue">
              <Button>Back to inbox</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const testerStats = await prisma.bugReport.groupBy({
    by: ["testerId", "status"],
    _count: { _all: true },
    where: {
      campaignId,
    },
  });
  const testerRatingById = new Map<string, number>();
  for (const row of testerStats) {
    const current = testerRatingById.get(row.testerId) ?? 3;
    const count = row._count._all;
    if (row.status === BugStatus.VALIDATED) {
      testerRatingById.set(row.testerId, Math.min(5, current + count * 0.1));
    } else if (row.status === BugStatus.REJECTED) {
      testerRatingById.set(row.testerId, Math.max(0, current - count * 0.05));
    } else {
      testerRatingById.set(row.testerId, current);
    }
  }

  const statusOrder = (status: BugStatus) => {
    switch (status) {
      case BugStatus.SUBMITTED:
        return 0;
      case BugStatus.NEEDS_INFO:
        return 1;
      case BugStatus.DUPLICATE:
        return 2;
      case BugStatus.APPROVED:
        return 3;
      case BugStatus.REJECTED:
        return 4;
      default:
        return 5;
    }
  };

  const grouped = new Map<string, typeof campaign.bugReports>();
  for (const bug of campaign.bugReports) {
    const key = bug.groupKey || makeGroupKey(bug);
    const list = grouped.get(key) ?? [];
    list.push(bug);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.entries()).map(([groupKey, items]) => {
    const representative = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const duplicateCount = Math.max(0, items.length - 1);
    const groupStatus =
      [...items].sort((a, b) => statusOrder(a.status) - statusOrder(b.status))[0]?.status ?? representative.status;
    const env = representative.environment as unknown as BugEnvironment;
    const device = String(env.device ?? "Unknown device");
    const osVersion = String(env.osVersion ?? "");
    const browser = String(env.browser ?? "");
    const testerRating = testerRatingById.get(representative.testerId) ?? 3;
    const priorityScore = computePriorityScore({
      severity: representative.severity,
      status: groupStatus,
      duplicateCount,
      testerRating,
      device,
      osVersion,
    });

    return {
      groupKey,
      status: groupStatus,
      severity: representative.severity,
      title: representative.title,
      feature: representative.feature,
      errorType: representative.errorType,
      pageUrl: representative.pageUrl,
      representative,
      count: items.length,
      duplicateCount,
      latestAt: items.reduce(
        (latest, bug) => (bug.createdAt > latest ? bug.createdAt : latest),
        representative.createdAt,
      ),
      priorityScore,
      deviceLabel: `${device}${browser ? ` / ${browser}` : ""}`,
      testerName: representative.tester.name,
      testerRating,
    };
  });

  groups.sort((a, b) => {
    const diff = statusOrder(a.status) - statusOrder(b.status);
    if (diff !== 0) return diff;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (severityRank(b.severity) !== severityRank(a.severity)) return severityRank(b.severity) - severityRank(a.severity);
    return b.latestAt.getTime() - a.latestAt.getTime();
  });

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
    pending: groups.filter((group) => group.status === BugStatus.SUBMITTED).length,
    needsInfo: groups.filter((group) => group.status === BugStatus.NEEDS_INFO).length,
    duplicates: groups.filter((group) => group.status === BugStatus.DUPLICATE).length,
    approved: groups.filter((group) => group.status === BugStatus.APPROVED).length,
    rejected: groups.filter((group) => group.status === BugStatus.REJECTED).length,
  };

  const visibleGroups = groups.filter((group) => isTabStatus(group.status));
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
      <SectionHeading
        eyebrow="Campaign moderation"
        title={campaign.projectName}
        description="Inbox-style triage: handle pending items first, group similar reports, and use quick actions to keep the queue clean."
        action={
          <Link href="/moderator/campaigns">
            <Button variant="secondary">All campaigns</Button>
          </Link>
        }
      />
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Inbox"
          title="Bug triage"
          description="Grouped reports with quick actions. Open a bug when you need full steps, attachments, and duplicate suggestions."
        />
        <Tabs
          active={tabLabel}
          items={[
            { href: `/moderator/campaigns/${campaignId}?tab=pending`, label: "Pending Review", count: counts.pending },
            { href: `/moderator/campaigns/${campaignId}?tab=needs-info`, label: "Needs Info", count: counts.needsInfo },
            { href: `/moderator/campaigns/${campaignId}?tab=duplicates`, label: "Duplicates", count: counts.duplicates },
            { href: `/moderator/campaigns/${campaignId}?tab=approved`, label: "Approved", count: counts.approved },
            { href: `/moderator/campaigns/${campaignId}?tab=rejected`, label: "Rejected", count: counts.rejected },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-stone-700">Type</span>
          <div className="flex flex-wrap gap-2">
            <Link href={`/moderator/campaigns/${campaignId}?tab=${encodeURIComponent(tabKey)}&type=all`}>
              <Badge className={type === "all" || !type ? "bg-stone-900 text-white" : ""}>All</Badge>
            </Link>
            {bugTypes.map((label) => (
              <Link
                key={label}
                href={`/moderator/campaigns/${campaignId}?tab=${encodeURIComponent(tabKey)}&type=${encodeURIComponent(label)}`}
              >
                <Badge className={type === label ? "bg-stone-900 text-white" : ""}>{label}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <BugAnalytics bugReports={campaign.bugReports} campaignName={campaign.projectName} />

      {filteredGroups.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-600">Nothing in this tab right now.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <Card key={group.groupKey} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={severityBadgeClass(group.severity)}>{group.severity}</Badge>
                  {group.errorType ? <Badge>{group.errorType}</Badge> : null}
                  <Badge>{group.deviceLabel}</Badge>
                  <Badge>Priority {group.priorityScore}</Badge>
                  {group.duplicateCount > 0 ? <Badge>Duplicates {group.duplicateCount}</Badge> : null}
                </div>
                <div className="space-y-1">
                  <Link
                    href={`/moderator/bugs/${group.representative.id}`}
                    className="text-lg font-semibold text-stone-900 hover:underline"
                  >
                    {group.title}
                  </Link>
                  <p className="text-sm text-stone-600">
                    Tester: {group.testerName} · Rating: {group.testerRating.toFixed(1)} · Updated{" "}
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
                  <input type="hidden" name="campaignId" value={campaignId} />
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
                    <input type="hidden" name="campaignId" value={campaignId} />
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
          ))}
        </div>
      )}
    </div>
  );
}
