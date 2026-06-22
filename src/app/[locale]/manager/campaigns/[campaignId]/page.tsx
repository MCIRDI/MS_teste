import { Link } from "@/i18n/routing";

import { BugStatus } from "@/generated/prisma";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeGroupKey, severityRank } from "@/lib/moderation";
import { updateCampaignStageAction } from "@/app/actions/campaigns";
import { getCampaignStaffingData } from "@/lib/dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignStageBadge } from "@/components/ui/campaign-stage-badge";
import { CampaignStageEditor } from "@/components/campaigns/campaign-stage-editor";
import { CampaignStaffingPanel } from "@/components/campaigns/campaign-staffing-panel";
import {
  Card,
  CardFooter,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardSection,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { BugAnalytics } from "@/components/charts/bug-analytics";

const COMPLETABLE_STAGES = new Set(["ACTIVE", "TESTING", "BUG_REVIEW"]);

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
  "Cultural Issues",
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

  // Load campaign details + staffing user pools in parallel
  const [campaign, staffing] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        assignments: true,
        invitations: true,
        bugReports: {
          include: { tester: true, attachments: true },
        },
        moderatorReports: {
          include: { moderator: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCampaignStaffingData(campaignId),
  ]);

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

  // Build staffing-panel-compatible campaign object
  const staffingCampaign = campaign
    ? {
        id: campaign.id,
        projectName: campaign.projectName,
        moderatorSlots: campaign.moderatorSlots,
        crowdTesterCount: campaign.crowdTesterCount,
        certTesterCount: campaign.certTesterCount,
        assignments: campaign.assignments.map((a) => ({
          userId: a.userId,
          assignmentRole: a.assignmentRole,
        })),
        invitations: campaign.invitations
          .filter((i) => i.status === "PENDING" || i.status === "ACCEPTED")
          .map((i) => ({
            recipientId: i.recipientId,
            assignmentRole: i.assignmentRole,
          })),
      }
    : null;

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
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-0.5">
              <CampaignStageBadge stage={campaign.stage} />
              <CampaignStageEditor campaignId={campaign.id} currentStage={campaign.stage} />
            </span>
            {COMPLETABLE_STAGES.has(campaign.stage) && (
              <form action={updateCampaignStageAction}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="stage" value="COMPLETED" />
                <Button type="submit" className="h-8 text-xs">
                  Mark completed
                </Button>
              </form>
            )}
            <CampaignStaffingPanel
              campaign={staffingCampaign}
              moderators={staffing.moderators}
              testers={staffing.testers}
            />
            <Link href="/manager/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          </div>
        }
      />

      <BugAnalytics bugReports={campaign.bugReports} campaignName={campaign.projectName} />

      {/* ── Staffing summary ───────────────────────────────────────────── */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Staffing</CardTitle>
          <CardDescription>Current assignments and pending invitations for this campaign.</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <CardMeta className="sm:grid-cols-2 lg:grid-cols-4">
            <CardMetaItem label="Moderators">
              {campaign.assignments.filter((a) => a.assignmentRole === "MODERATOR").length}/
              {campaign.moderatorSlots}
              {campaign.invitations.filter((i) => i.assignmentRole === "MODERATOR" && i.status === "PENDING").length > 0 && (
                <span className="ml-2 text-xs text-amber-600">
                  +{campaign.invitations.filter((i) => i.assignmentRole === "MODERATOR" && i.status === "PENDING").length} pending
                </span>
              )}
            </CardMetaItem>
            <CardMetaItem label="Crowd testers">
              {campaign.assignments.filter((a) => a.assignmentRole === "CROWD_TESTER").length}/
              {campaign.crowdTesterCount}
              {campaign.invitations.filter((i) => i.assignmentRole === "CROWD_TESTER" && i.status === "PENDING").length > 0 && (
                <span className="ml-2 text-xs text-amber-600">
                  +{campaign.invitations.filter((i) => i.assignmentRole === "CROWD_TESTER" && i.status === "PENDING").length} pending
                </span>
              )}
            </CardMetaItem>
            <CardMetaItem label="Cert. testers">
              {campaign.assignments.filter((a) => a.assignmentRole === "CERT_TESTER").length}/
              {campaign.certTesterCount}
              {campaign.invitations.filter((i) => i.assignmentRole === "CERT_TESTER" && i.status === "PENDING").length > 0 && (
                <span className="ml-2 text-xs text-amber-600">
                  +{campaign.invitations.filter((i) => i.assignmentRole === "CERT_TESTER" && i.status === "PENDING").length} pending
                </span>
              )}
            </CardMetaItem>
            <CardMetaItem label="Total pending invitations">
              {campaign.invitations.filter((i) => i.status === "PENDING").length}
            </CardMetaItem>
          </CardMeta>
        </CardSection>
      </Card>

      {/* ── Moderator reports ──────────────────────────────────────────── */}
      <Card padding="none">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Moderator reports</CardTitle>
            <CardDescription>
              {campaign.moderatorReports.length === 0
                ? "No moderator has submitted a report yet."
                : `${campaign.moderatorReports.length} report${campaign.moderatorReports.length > 1 ? "s" : ""} received — use them to compose the final PDF.`}
            </CardDescription>
          </div>
          <Link href={`/manager/reports/compose/${campaignId}`} className="shrink-0">
            <Button>Compose final report</Button>
          </Link>
        </CardHeader>

        {campaign.moderatorReports.length > 0 ? (
          <CardSection className="border-t border-slate-100/90 space-y-4">
            {campaign.moderatorReports.map((mr) => (
              <div
                key={mr.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
              >
                {/* Report header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {mr.moderator.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{mr.moderator.name}</p>
                      <p className="text-xs text-slate-500">{mr.moderator.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{mr.createdAt.toLocaleString()}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200">
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{mr.totalReviewed}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Reviewed</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-green-600">{mr.approved}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Approved</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-red-600">{mr.rejected}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Rejected</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold text-slate-500">{mr.duplicates}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Duplicates</p>
                  </div>
                </div>

                {/* Text content */}
                <div className="grid gap-4 p-4 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.summary}</p>
                  </div>
                  {mr.observations ? (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Key observations</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.observations}</p>
                    </div>
                  ) : null}
                  {mr.recommendations ? (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.recommendations}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </CardSection>
        ) : null}
      </Card>

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
