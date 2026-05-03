import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/utils";
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

export default async function TesterWorkspacePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await requireSession(["TESTER"]);
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      tasks: {
        orderBy: { orderIndex: "asc" },
      },
      assignments: {
        where: { userId: session.id },
      },
      bugReports: {
        where: { testerId: session.id },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (campaign.assignments.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Workspace"
          title="Access required"
          description="Accept the invitation from your campaign list before opening the testing workspace."
          action={
            <Link href="/tester/campaigns">
              <Button>Back to campaigns</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Workspace"
        title={campaign.projectName}
        description="Instructions, tasks, access details, and your submissions for this campaign."
        action={
          <Link href={`/tester/bugs/new?campaignId=${campaignId}`}>
            <Button>Submit bug</Button>
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>Campaign instructions</CardTitle>
            <CardDescription>Scope, access, and targeting</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <p className="text-sm leading-relaxed text-slate-600">{campaign.description}</p>
            <CardMeta className="mt-5">
              <CardMetaItem label="Access URL">{campaign.websiteUrl ?? "Uploaded build only"}</CardMetaItem>
              <CardMetaItem label="Countries">{toStringArray(campaign.selectedCountries).join(", ") || "None"}</CardMetaItem>
            </CardMeta>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Testing tasks</CardTitle>
            <CardDescription>Work through these in order unless instructed otherwise</CardDescription>
          </CardHeader>
          <CardSection className="space-y-2 border-t border-slate-100/90">
            <ol className="list-none space-y-2">
              {campaign.tasks.map((task, index) => (
                <li
                  key={task.id}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{task.description}</span>
                </li>
              ))}
            </ol>
          </CardSection>
        </Card>
      </div>
      <Card padding="none">
        <CardHeader>
          <CardTitle>Your submitted bugs</CardTitle>
          <CardDescription>Latest activity first</CardDescription>
        </CardHeader>
        <CardSection className="space-y-3 border-t border-slate-100/90">
          {campaign.bugReports.length === 0 ? (
            <p className="text-sm text-slate-600">No bug reports submitted for this campaign yet.</p>
          ) : (
            campaign.bugReports.map((bug) => (
              <Card key={bug.id} variant="muted">
                <p className="font-semibold text-slate-900">{bug.title}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {bug.status} · {bug.severity}
                </p>
              </Card>
            ))
          )}
        </CardSection>
      </Card>
    </div>
  );
}
