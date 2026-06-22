import { Link } from "@/i18n/routing";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BugStatus } from "@/generated/prisma";
import { submitModeratorReportAction } from "@/app/actions/moderator-reports";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ModeratorReportForm } from "@/components/moderator/moderator-report-form";

export default async function ModeratorReportPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      assignments: {
        where: { userId: session.id, assignmentRole: "MODERATOR" },
      },
    },
  });

  if (campaign.assignments.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Report"
          title="Access required"
          description="You are not assigned as moderator for this campaign."
          action={
            <Link href="/moderator/campaigns">
              <Button>My campaigns</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Live moderation stats for this moderator on this campaign
  const stats = await prisma.bugReport.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { campaignId, moderatorId: session.id },
  });

  const getCount = (status: BugStatus) =>
    stats.find((s) => s.status === status)?._count._all ?? 0;

  const liveStats = {
    totalReviewed:
      getCount(BugStatus.APPROVED) +
      getCount(BugStatus.REJECTED) +
      getCount(BugStatus.DUPLICATE) +
      getCount(BugStatus.NEEDS_INFO),
    approved:   getCount(BugStatus.APPROVED),
    rejected:   getCount(BugStatus.REJECTED),
    duplicates: getCount(BugStatus.DUPLICATE),
    needsInfo:  getCount(BugStatus.NEEDS_INFO),
  };

  // Existing submitted report (if any)
  const existing = await prisma.moderatorReport.findUnique({
    where: { campaignId_moderatorId: { campaignId, moderatorId: session.id } },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Moderator report"
        title={campaign.projectName}
        description={
          existing
            ? "Your report has been submitted. The test manager can read it on the campaign page. You can update it anytime."
            : "Write your moderation summary for the test manager. They will use it as reference when composing the final client report."
        }
        action={
          <Link href={`/moderator/campaigns/${campaignId}`}>
            <Button variant="secondary">Back to campaign</Button>
          </Link>
        }
      />

      {/* Live stats */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Your moderation activity</CardTitle>
          <CardDescription>
            Computed automatically from your actions on this campaign.
          </CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <CardMeta className="sm:grid-cols-5">
            <CardMetaItem label="Total reviewed">{liveStats.totalReviewed}</CardMetaItem>
            <CardMetaItem label="Approved">{liveStats.approved}</CardMetaItem>
            <CardMetaItem label="Rejected">{liveStats.rejected}</CardMetaItem>
            <CardMetaItem label="Duplicates">{liveStats.duplicates}</CardMetaItem>
            <CardMetaItem label="Needs info">{liveStats.needsInfo}</CardMetaItem>
          </CardMeta>
        </CardSection>
      </Card>

      {/* Read-only view of the current submitted report */}
      {existing ? (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Submitted report</CardTitle>
            <CardDescription>
              Last updated {existing.updatedAt.toLocaleString()}. Visible to the test manager.
            </CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90 space-y-5">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Summary
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{existing.summary}</p>
            </div>
            {existing.observations ? (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Key observations
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {existing.observations}
                </p>
              </div>
            ) : null}
            {existing.recommendations ? (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Recommendations
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {existing.recommendations}
                </p>
              </div>
            ) : null}
          </CardSection>
        </Card>
      ) : null}

      {/* Edit / submit form */}
      <ModeratorReportForm
        campaignId={campaignId}
        existing={
          existing
            ? {
                summary:         existing.summary,
                observations:    existing.observations,
                recommendations: existing.recommendations,
              }
            : null
        }
        action={submitModeratorReportAction}
      />
    </div>
  );
}
