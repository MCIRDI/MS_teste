import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BugReportForm } from "@/components/forms/bug-report-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterBugNewPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const session = await requireSession(["TESTER"]);
  const { campaignId: requestedCampaignId } = await searchParams;

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
        description="Type, title, optional URL, description, steps, severity, and attachments."
      />
      {assignments.length > 1 ? (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Campaign</CardTitle>
            <CardDescription>Switch context if you are testing multiple projects.</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
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
          </CardSection>
        </Card>
      ) : null}
      <BugReportForm campaignId={selectedAssignment.campaignId} />
    </div>
  );
}
