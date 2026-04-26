import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        return "bg-stone-100 text-stone-700";
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

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={severityBadgeClass(bug.severity)}>{bug.severity}</Badge>
          {bug.errorType ? <Badge>{bug.errorType}</Badge> : null}
          <Badge>{bug.status}</Badge>
          {bug.pageUrl ? <Badge>URL: {bug.pageUrl}</Badge> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Tester</p>
            <p className="text-sm text-stone-700">{bug.tester.name}</p>
            <p className="text-sm text-stone-600">{bug.tester.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Environment</p>
            <p className="text-sm text-stone-700">Country: {env.country ?? "—"}</p>
            <p className="text-sm text-stone-700">Device: {env.device ?? "—"}</p>
            <p className="text-sm text-stone-700">OS: {env.osVersion ?? "—"}</p>
            <p className="text-sm text-stone-700">Browser: {env.browser ?? "—"}</p>
            <p className="text-sm text-stone-700">Resolution: {env.screenResolution ?? "—"}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading eyebrow="Report" title="Details" description="As provided by the moderator/tester." />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-stone-700">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.description}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Reproduction steps</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.reproductionSteps}</p>
          </div>
          {bug.moderationNotes ? (
            <div>
              <p className="text-sm font-medium text-stone-700">Moderator notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-800">{bug.moderationNotes}</p>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading eyebrow="Files" title="Attachments" description="Download any files linked to this report." />
        {bug.attachments.length === 0 ? (
          <p className="text-sm text-stone-600">No attachments.</p>
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
    </div>
  );
}

