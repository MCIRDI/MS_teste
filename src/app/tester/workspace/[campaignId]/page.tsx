import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        description="Each workspace centralizes instructions, software access, testing tasks, and the bug submission flow."
        action={
          <Link href={`/tester/bugs/new?campaignId=${campaignId}`}>
            <Button>Submit bug</Button>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Campaign instructions</h2>
          <p className="text-sm leading-7 text-stone-600">
            {campaign.description}
          </p>
          <p className="text-sm leading-7 text-stone-600">
            Shared access URL: {campaign.websiteUrl ?? "Uploaded build only"}
          </p>
          <p className="text-sm leading-7 text-stone-600">
            Target countries: {toStringArray(campaign.selectedCountries).join(", ") || "None"}
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Testing tasks</h2>
          <ul className="space-y-3 text-sm leading-7 text-stone-600">
            {campaign.tasks.map((task) => (
              <li key={task.id} className="rounded-2xl bg-stone-100 px-4 py-3">
                {task.description}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Your submitted bugs</h2>
        {campaign.bugReports.length === 0 ? (
          <p className="text-sm text-stone-600">No bug reports submitted for this campaign yet.</p>
        ) : (
          campaign.bugReports.map((bug) => (
            <div key={bug.id} className="rounded-2xl bg-stone-100 p-4">
              <p className="font-medium text-stone-900">{bug.title}</p>
              <p className="text-sm text-stone-600">{bug.status} · {bug.severity}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
