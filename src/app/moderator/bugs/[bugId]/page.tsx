import Link from "next/link";

import { BugStatus } from "@/generated/prisma/client";
import { moderateBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { diceCoefficient, normalizeText } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        return "bg-stone-100 text-stone-700";
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

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={severityBadgeClass(bug.severity)}>{bug.severity}</Badge>
          <Badge>{bug.status}</Badge>
          {bug.feature ? <Badge>Feature: {bug.feature}</Badge> : null}
          {bug.errorType ? <Badge>Error: {bug.errorType}</Badge> : null}
          {bug.pageUrl ? <Badge>Page: {bug.pageUrl}</Badge> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">Reporter</p>
            <p className="text-sm text-stone-700">{bug.tester.name}</p>
            <p className="text-sm text-stone-600">{bug.tester.email}</p>
            <p className="text-sm text-stone-600">Submitted: {bug.createdAt.toLocaleString()}</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700">Environment</p>
            <p className="text-sm text-stone-700">Device: {String(env?.device ?? "—")}</p>
            <p className="text-sm text-stone-700">OS: {String(env?.osVersion ?? "—")}</p>
            <p className="text-sm text-stone-700">Browser: {String(env?.browser ?? "—")}</p>
            <p className="text-sm text-stone-700">Resolution: {String(env?.screenResolution ?? "—")}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading eyebrow="Details" title="Reproduction" description="Full report content as submitted by the tester." />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-stone-700">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.description}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Steps</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.reproductionSteps}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-stone-700">Expected</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.expectedResult}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Actual</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.actualResult}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading eyebrow="Attachments" title="Files" description="Screenshots, recordings, logs, and additional evidence." />
        {bug.attachments.length === 0 ? (
          <p className="text-sm text-stone-600">No attachments were uploaded.</p>
        ) : (
          <div className="grid gap-2">
            {bug.attachments.map((attachment) => (
              <Link
                key={attachment.id}
                href={`/api/attachments/${attachment.id}`}
                className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-800 hover:bg-stone-200"
              >
                {attachment.originalName}
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Actions"
          title="Quick moderation"
          description="No page switching: approve, reject, request more info, or link duplicates."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <form action={moderateBugReportAction} className="space-y-3 rounded-3xl bg-stone-100 p-4">
            <input type="hidden" name="bugReportId" value={bug.id} />
            <p className="text-sm font-medium text-stone-700">Set status</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white" type="submit" name="decision" value="APPROVED">
                Send to manager
              </button>
              <button className="rounded-full bg-stone-200 px-4 py-2 text-sm text-stone-900" type="submit" name="decision" value="NEEDS_INFO">
                Needs info
              </button>
              <button className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-900" type="submit" name="decision" value="REJECTED">
                Reject
              </button>
            </div>
          </form>

          <form action={moderateBugReportAction} className="space-y-3 rounded-3xl bg-stone-100 p-4">
            <input type="hidden" name="bugReportId" value={bug.id} />
            <input type="hidden" name="decision" value="DUPLICATE" />
            <p className="text-sm font-medium text-stone-700">Mark as duplicate of</p>
            <select name="duplicateOfId" className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm">
              <option value="">Select a bug…</option>
              {suggestions.map((row) => (
                <option key={row.other.id} value={row.other.id}>
                  {percent(row.score)} · {row.other.severity} · {row.other.title}
                </option>
              ))}
            </select>
            <button className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm text-white" type="submit">
              Mark duplicate
            </button>
          </form>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Duplicates"
          title="Possible duplicates"
          description="Suggested matches based on title similarity and matching feature/error/page."
        />
        {suggestions.length === 0 ? (
          <p className="text-sm text-stone-600">No strong duplicates found in this campaign yet.</p>
        ) : (
          <div className="grid gap-3">
            {suggestions.map((row) => (
              <div key={row.other.id} className="rounded-3xl bg-stone-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{percent(row.score)} match</Badge>
                    <Badge className={severityBadgeClass(row.other.severity)}>{row.other.severity}</Badge>
                    <Badge>{row.other.status}</Badge>
                  </div>
                  <Link href={`/moderator/bugs/${row.other.id}`} className="text-sm text-stone-700 hover:underline">
                    Open
                  </Link>
                </div>
                <p className="mt-2 font-medium text-stone-900">{row.other.title}</p>
                <p className="mt-1 text-sm text-stone-600">Tester: {row.other.tester.name} · {row.other.createdAt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
