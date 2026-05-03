import Link from "next/link";

import { requireSession } from "@/lib/auth";
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
import { SectionHeading } from "@/components/sections/section-heading";

type BugEnvironment = {
  country?: string;
  device?: string;
  osVersion?: string;
  browser?: string;
  screenResolution?: string;
};

export default async function ManagerBugDetailPage({
  params,
}: {
  params: Promise<{ bugId: string }>;
}) {
  const session = await requireSession(["TEST_MANAGER"]);
  const { bugId } = await params;

  const bug = await prisma.bugReport.findUniqueOrThrow({
    where: { id: bugId },
    include: {
      tester: true,
      attachments: true,
      campaign: true,
    },
  });

  if (bug.campaign.testManagerId !== session.id) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Bug"
          title="Access required"
          description="You are not assigned as the test manager for this campaign."
          action={
            <Link href={`/manager/campaigns/${bug.campaignId}`}>
              <Button>Back to campaign</Button>
            </Link>
          }
        />
      </div>
    );
  }

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
        eyebrow="Bug"
        title={bug.title}
        description={bug.campaign.projectName}
        action={
          <Link href={`/manager/campaigns/${bug.campaignId}`}>
            <Button variant="secondary">Back to campaign</Button>
          </Link>
        }
      />

      <Card padding="none">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={severityBadgeClass(bug.severity)}>{bug.severity}</Badge>
            {bug.errorType ? <Badge>{bug.errorType}</Badge> : null}
            <Badge>{bug.status}</Badge>
            {bug.pageUrl ? <Badge className="max-w-full truncate">URL: {bug.pageUrl}</Badge> : null}
          </div>
          <CardTitle className="mt-3">Summary</CardTitle>
          <CardDescription>Reporter and environment captured with this report.</CardDescription>
        </CardHeader>
        <CardSection>
          <CardMeta>
            <CardMetaItem label="Tester">{bug.tester.name}</CardMetaItem>
            <CardMetaItem label="Email">{bug.tester.email}</CardMetaItem>
            <CardMetaItem label="Country">{env.country ?? "—"}</CardMetaItem>
            <CardMetaItem label="Device">{env.device ?? "—"}</CardMetaItem>
            <CardMetaItem label="OS">{env.osVersion ?? "—"}</CardMetaItem>
            <CardMetaItem label="Browser">{env.browser ?? "—"}</CardMetaItem>
            <CardMetaItem label="Resolution">{env.screenResolution ?? "—"}</CardMetaItem>
          </CardMeta>
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Report body</CardTitle>
          <CardDescription>As provided by the moderator and tester.</CardDescription>
        </CardHeader>
        <CardSection className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
            <CardProse className="mt-2 whitespace-pre-wrap">{bug.description}</CardProse>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reproduction steps</p>
            <CardProse className="mt-2 whitespace-pre-wrap">{bug.reproductionSteps}</CardProse>
          </div>
          {bug.moderationNotes ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Moderator notes</p>
              <CardProse className="mt-2 whitespace-pre-wrap">{bug.moderationNotes}</CardProse>
            </div>
          ) : null}
        </CardSection>
      </Card>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Download any files linked to this report.</CardDescription>
        </CardHeader>
        <CardSection>
          {bug.attachments.length === 0 ? (
            <p className="text-sm text-slate-600">No attachments.</p>
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
    </div>
  );
}
