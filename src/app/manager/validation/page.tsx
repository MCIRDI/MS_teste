import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { validateBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
import { makeGroupKey, severityRank } from "@/lib/moderation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/sections/section-heading";

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

export default async function ManagerValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const session = await requireSession(["TEST_MANAGER"]);
  const { tab, type } = await searchParams;
  const data = await getManagerDashboardData(session.id);

  const allowedStatuses = new Set<BugStatus>([BugStatus.APPROVED, BugStatus.VALIDATED]);
  const bugReports = data.bugReports.filter((bug) => allowedStatuses.has(bug.status));

  const grouped = new Map<string, typeof bugReports>();
  for (const bug of bugReports) {
    const key = `${bug.campaignId}:${bug.groupKey || makeGroupKey(bug)}`;
    const list = grouped.get(key) ?? [];
    list.push(bug);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.entries()).map(([compositeKey, items]) => {
    const [campaignId, ...rest] = compositeKey.split(":");
    const groupKey = rest.join(":");
    const representative = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const latestAt = items.reduce((latest, bug) => (bug.createdAt > latest ? bug.createdAt : latest), representative.createdAt);
    const statusOrder = (status: BugStatus) => (status === BugStatus.APPROVED ? 0 : 1);
    const groupStatus = [...items].sort((a, b) => statusOrder(a.status) - statusOrder(b.status))[0]?.status ?? representative.status;

    return {
      campaignId,
      groupKey,
      status: groupStatus,
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
    const statusOrder = (status: BugStatus) => (status === BugStatus.APPROVED ? 0 : 1);
    const diff = statusOrder(a.status) - statusOrder(b.status);
    if (diff !== 0) return diff;
    if (severityRank(b.severity) !== severityRank(a.severity)) return severityRank(b.severity) - severityRank(a.severity);
    return b.latestAt.getTime() - a.latestAt.getTime();
  });

  const tabKey = (tab ?? "to-validate").toLowerCase();
  const tabLabel = tabKey === "validated" ? "Validated" : "To Validate";
  const isTabStatus = (status: BugStatus) => (tabKey === "validated" ? status === BugStatus.VALIDATED : status === BugStatus.APPROVED);
  const visibleGroups = groups.filter((group) => isTabStatus(group.status));
  const filteredGroups =
    type && type !== "all" ? visibleGroups.filter((group) => group.bugType === type) : visibleGroups;

  const counts = {
    toValidate: groups.filter((group) => group.status === BugStatus.APPROVED).length,
    validated: groups.filter((group) => group.status === BugStatus.VALIDATED).length,
  };

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
        eyebrow="Validation"
        title="Manager inbox"
        description="Approved reports arrive here from moderators. Validate them to publish to the client dashboard."
        action={
          <Link href="/manager/reports">
            <Button variant="secondary">Final reports</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
        <Tabs
          active={tabLabel}
          items={[
            { href: "/manager/validation?tab=to-validate", label: "To Validate", count: counts.toValidate },
            { href: "/manager/validation?tab=validated", label: "Validated", count: counts.validated },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-stone-700">Type</span>
          <div className="flex flex-wrap gap-2">
            <Link href={`/manager/validation?tab=${encodeURIComponent(tabKey)}&type=all`}>
              <Badge className={type === "all" || !type ? "bg-stone-900 text-white" : ""}>All</Badge>
            </Link>
            {bugTypes.map((label) => (
              <Link key={label} href={`/manager/validation?tab=${encodeURIComponent(tabKey)}&type=${encodeURIComponent(label)}`}>
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
          {filteredGroups.map((group) => (
            <Card key={`${group.campaignId}:${group.groupKey}`} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={severityBadgeClass(group.severity)}>{group.severity}</Badge>
                  {group.bugType ? <Badge>{group.bugType}</Badge> : null}
                  {group.count > 1 ? <Badge>Grouped {group.count}</Badge> : null}
                  {group.attachmentCount ? <Badge>Files {group.attachmentCount}</Badge> : null}
                </div>
                <p className="text-lg font-semibold text-stone-900">{group.title}</p>
                {group.pageUrl ? <p className="text-sm text-stone-600">URL: {group.pageUrl}</p> : null}
                <p className="text-sm text-stone-600">Updated {group.latestAt.toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/manager/bugs/${group.representative.id}`}>
                  <Button variant="secondary" className="w-full">
                    Open details
                  </Button>
                </Link>
                {group.status === BugStatus.APPROVED ? (
                  <form action={validateBugReportAction} className="space-y-2">
                    <input type="hidden" name="bugReportId" value={group.representative.id} />
                    <textarea
                      name="validationNotes"
                      className="min-h-20 w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm"
                      placeholder="Validation notes"
                    />
                    <button className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm text-white" type="submit">
                      Validate
                    </button>
                  </form>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
