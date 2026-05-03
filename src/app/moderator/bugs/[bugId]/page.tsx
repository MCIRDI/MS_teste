import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { moderateBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { diceCoefficient, normalizeText } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardMeta,
  CardMetaItem,
  CardProse,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SectionHeading } from "@/components/sections/section-heading";

type BugEnvironment = {
  device?: string;
  osVersion?: string;
  browser?: string;
  screenResolution?: string;
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function ModeratorBugDetailPage({
  params,
}: {
  params: Promise<{ bugId: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { bugId } = await params;

  const bug = await prisma.bugReport.findUniqueOrThrow({
    where: { id: bugId },
    include: {
      tester: true,
      attachments: true,
      campaign: true,
    },
  });

  const assignment = await prisma.campaignAssignment.findFirst({
    where: {
      campaignId: bug.campaignId,
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
  });

  if (!assignment) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Bug"
          title="Access required"
          description="You are not assigned to moderate this campaign."
          action={
            <Link href="/moderator/review-queue">
              <Button>Back to inbox</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const candidates = await prisma.bugReport.findMany({
    where: {
      campaignId: bug.campaignId,
      id: { not: bug.id },
      status: {
        in: [BugStatus.SUBMITTED, BugStatus.NEEDS_INFO, BugStatus.DUPLICATE, BugStatus.APPROVED, BugStatus.REJECTED],
      },
    },
    include: {
      tester: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const suggestions = candidates
    .map((other) => {
      const titleSim = diceCoefficient(bug.title, other.title);
      let boost = 0;
      if (bug.feature && other.feature && normalizeText(bug.feature) === normalizeText(other.feature)) boost += 0.1;
      if (bug.errorType && other.errorType && normalizeText(bug.errorType) === normalizeText(other.errorType)) boost += 0.1;
      if (bug.pageUrl && other.pageUrl && normalizeText(bug.pageUrl) === normalizeText(other.pageUrl)) boost += 0.1;
      const score = Math.min(1, titleSim + boost);
      return { other, score };
    })
    .filter((row) => row.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const env = bug.environment as unknown as BugEnvironment;

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
        eyebrow="Bug report"
        title={bug.title}
        description={bug.campaign.projectName}
        action={
          <Link href={`/moderator/campaigns/${bug.campaignId}`}>
            <Button variant="secondary">Back to campaign</Button>
          </Link>
        }
      />

      <Card padding="none">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={severityBadgeClass(bug.severity)}>{bug.severity}</Badge>
            <Badge>{bug.status}</Badge>
            {bug.feature ? <Badge>Feature: {bug.feature}</Badge> : null}
            {bug.errorType ? <Badge>Error: {bug.errorType}</Badge> : null}
            {bug.pageUrl ? <Badge className="max-w-full truncate">Page: {bug.pageUrl}</Badge> : null}
          </div>
          <CardTitle className="mt-3">Reporter &amp; environment</CardTitle>
          <CardDescription>Context captured automatically with the submission.</CardDescription>
        </CardHeader>
        <CardSection>
          <CardMeta>
            <CardMetaItem label="Name">{bug.tester.name}</CardMetaItem>
            <CardMetaItem label="Email">{bug.tester.email}</CardMetaItem>
            <CardMetaItem label="Submitted">{bug.createdAt.toLocaleString()}</CardMetaItem>
            <CardMetaItem label="Device">{String(env?.device ?? "—")}</CardMetaItem>
            <CardMetaItem label="OS">{String(env?.osVersion ?? "—")}</CardMetaItem>
            <CardMetaItem label="Browser">{String(env?.browser ?? "—")}</CardMetaItem>
            <CardMetaItem label="Resolution">{String(env?.screenResolution ?? "—")}</CardMetaItem>
          </CardMeta>
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Reproduction</CardTitle>
          <CardDescription>Full report content as submitted by the tester.</CardDescription>
        </CardHeader>
        <CardSection className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
            <CardProse className="mt-2 whitespace-pre-wrap">{bug.description}</CardProse>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Steps</p>
            <CardProse className="mt-2 whitespace-pre-wrap">{bug.reproductionSteps}</CardProse>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Expected</p>
              <CardProse className="mt-2 whitespace-pre-wrap">{bug.expectedResult}</CardProse>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actual</p>
              <CardProse className="mt-2 whitespace-pre-wrap">{bug.actualResult}</CardProse>
            </div>
          </div>
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Screenshots, recordings, logs, and additional evidence.</CardDescription>
        </CardHeader>
        <CardSection>
          {bug.attachments.length === 0 ? (
            <p className="text-sm text-slate-600">No attachments were uploaded.</p>
          ) : (
            <div className="grid gap-2">
              {bug.attachments.map((attachment) => (
                <Link
                  key={attachment.id}
                  href={`/api/attachments/${attachment.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {attachment.originalName}
                </Link>
              ))}
            </div>
          )}
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>Approve, reject, request more info, or link duplicates.</CardDescription>
        </CardHeader>
        <CardSection className="grid gap-4 md:grid-cols-2">
          <form action={moderateBugReportAction} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
            <input type="hidden" name="bugReportId" value={bug.id} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" type="submit" name="decision" value="APPROVED">
                Send to manager
              </button>
              <button className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-900 hover:bg-slate-300" type="submit" name="decision" value="NEEDS_INFO">
                Needs info
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50" type="submit" name="decision" value="REJECTED">
                Reject
              </button>
            </div>
          </form>

          <form action={moderateBugReportAction} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
            <input type="hidden" name="bugReportId" value={bug.id} />
            <input type="hidden" name="decision" value="DUPLICATE" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Duplicate of</p>
            <Select name="duplicateOfId" className="text-sm">
              <option value="">Select a bug…</option>
              {suggestions.map((row) => (
                <option key={row.other.id} value={row.other.id}>
                  {percent(row.score)} · {row.other.severity} · {row.other.title}
                </option>
              ))}
            </Select>
            <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" type="submit">
              Mark duplicate
            </button>
          </form>
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Possible duplicates</CardTitle>
          <CardDescription>Suggested matches from title similarity and shared fields.</CardDescription>
        </CardHeader>
        <CardSection className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-600">No strong duplicates found in this campaign yet.</p>
          ) : (
            suggestions.map((row) => (
              <Card key={row.other.id} variant="muted" className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{percent(row.score)} match</Badge>
                    <Badge className={severityBadgeClass(row.other.severity)}>{row.other.severity}</Badge>
                    <Badge>{row.other.status}</Badge>
                  </div>
                  <Link href={`/moderator/bugs/${row.other.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-800">
                    Open
                  </Link>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{row.other.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Tester: {row.other.tester.name} · {row.other.createdAt.toLocaleString()}
                </p>
              </Card>
            ))
          )}
        </CardSection>
      </Card>
    </div>
  );
}
