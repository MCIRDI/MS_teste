import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTesterSetupState } from "@/lib/tester-setup";
import { BugReportForm } from "@/components/forms/bug-report-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterBugNewPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const session = await requireSession(["TESTER"]);
  const { campaignId: requestedCampaignId } = await searchParams;

  const setup = await getTesterSetupState(session.id);
  if (setup.needsSetup) {
    const next = encodeURIComponent(`/tester/bugs/new${requestedCampaignId ? `?campaignId=${requestedCampaignId}` : ""}`);
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Setup"
          title="Complete your testing info"
          description="Bug reports automatically include your device environment. Add it once and we reuse it."
        />
        <Card className="space-y-3">
          <p className="text-sm text-stone-600">{setup.reason ?? "Tester info is incomplete."}</p>
          <Link href={`/tester/setup?next=${next}`}>
            <Button>Complete setup</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const assignments = await prisma.campaignAssignment.findMany({
    where: {
      userId: session.id,
      assignmentRole: {
        in: ["CROWD_TESTER", "DEVELOPER_TESTER"],
      },
    },
    include: {
      campaign: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (assignments.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Bug reporting"
          title="No active campaign"
          description="Accept a campaign invitation before submitting a bug report."
          action={
            <Link href="/tester/campaigns">
              <Button>Back to campaigns</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedAssignment =
    assignments.find((assignment) => assignment.campaignId === requestedCampaignId) ??
    assignments[0];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Bug reporting"
        title={`Submit a bug report for ${selectedAssignment.campaign.projectName}`}
        description="Keep it simple: type, title, URL (optional), description, steps, severity, and optional attachments."
      />
      {assignments.length > 1 ? (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-stone-900">Other accepted campaigns</p>
          <div className="flex flex-wrap gap-2">
            {assignments.map((assignment) => (
              <Link key={assignment.id} href={`/tester/bugs/new?campaignId=${assignment.campaignId}`}>
                <Button
                  variant={
                    assignment.campaignId === selectedAssignment.campaignId ? "primary" : "secondary"
                  }
                >
                  {assignment.campaign.projectName}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
      <BugReportForm campaignId={selectedAssignment.campaignId} />
    </div>
  );
}
