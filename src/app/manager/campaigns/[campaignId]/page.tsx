import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeGroupKey, severityRank } from "@/lib/moderation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardSection,
} from "@/components/ui/card";
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

export default async function ManagerCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireSession(["TEST_MANAGER"]);
  const { campaignId } = await params;
  const { type } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      assignments: true,
      invitations: true,
      bugReports: {
        include: {
          tester: true,
          attachments: true,
        },
      },
    },
  });

  if (!campaign || campaign.testManagerId !== session.id) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Campaign details"
          title="Access required"
          description="You don't have access to this campaign."
          action={
            <Link href="/manager/dashboard">
              <Button>Back to dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const allowedStatuses = new Set<BugStatus>([BugStatus.APPROVED]);
  const bugReports = campaign.bugReports.filter((bug) => allowedStatuses.has(bug.status));

  const grouped = new Map<string, typeof bugReports>();
  for (const bug of bugReports) {
    const key = bug.groupKey || makeGroupKey(bug);
    const list = grouped.get(key) ?? [];
    list.push(bug);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.entries()).map(([groupKey, items]) => {
    const representative = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const latestAt = items.reduce((latest, bug) => (bug.createdAt > latest ? bug.createdAt : latest), representative.createdAt);

    return {
      groupKey,
      status: BugStatus.APPROVED,
      severity: representative.severity,
      title: representative.title,
      pageUrl: representative.pageUrl,
      bugType: representative.errorType,
      representative,
      count: items.length,
      latestAt,
      attachmentCount: representative.attachments?.length ?? 0,
    };
  });

  groups.sort((a, b) => {
    if (severityRank(b.severity) !== severityRank(a.severity)) return severityRank(b.severity) - severityRank(a.severity);
    return b.latestAt.getTime() - a.latestAt.getTime();
  });

  const filteredGroups =
    type && type !== "all" ? groups.filter((group) => group.bugType === type) : groups;

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
      <SectionHeading
        eyebrow="Campaign details"
        title={campaign.projectName}
        description="View statistics and bug reports for this campaign."
        action={
          <Link href="/manager/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
      />

      <BugAnalytics bugReports={campaign.bugReports} campaignName={campaign.projectName} />

      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Bug reports"
            title="Campaign bugs"
            description="Approved bug reports grouped for this campaign."
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <div className="flex flex-wrap gap-2">
              <Link href={`/manager/campaigns/${campaignId}?type=all`}>
                <Badge className={type === "all" || !type ? "border-transparent bg-blue-600 text-white" : ""}>All</Badge>
              </Link>
              {bugTypes.map((label) => (
                <Link key={label} href={`/manager/campaigns/${campaignId}?type=${encodeURIComponent(label)}`}>
                  <Badge className={type === label ? "border-transparent bg-blue-600 text-white" : ""}>{label}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </CardSection>
      </Card>

      {filteredGroups.length === 0 ? (
        <Card variant="muted">
          <p className="text-sm text-slate-600">No approved bugs match this filter.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <Card key={group.groupKey} padding="none">
              <CardSection>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={severityBadgeClass(group.severity)}>{group.severity}</Badge>
                  {group.bugType ? <Badge>{group.bugType}</Badge> : null}
                  {group.count > 1 ? <Badge>Grouped {group.count}</Badge> : null}
                  {group.attachmentCount ? <Badge>Files {group.attachmentCount}</Badge> : null}
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">{group.title}</p>
                <CardMeta className="mt-4">
                  <CardMetaItem label="URL">{group.pageUrl ?? "—"}</CardMetaItem>
                  <CardMetaItem label="Updated">{group.latestAt.toLocaleString()}</CardMetaItem>
                </CardMeta>
              </CardSection>
              <CardFooter className="flex justify-end">
                <Link href={`/manager/bugs/${group.representative.id}`}>
                  <Button variant="secondary">Open details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
