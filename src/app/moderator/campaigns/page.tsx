import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ModeratorCampaignsPage() {
  const session = await requireSession(["MODERATOR"]);

  const assignments = await prisma.campaignAssignment.findMany({
    where: {
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
    include: {
      campaign: {
        include: {
          bugReports: {
            where: {
              status: {
                in: ["SUBMITTED", "NEEDS_INFO", "DUPLICATE", "APPROVED", "REJECTED"],
              },
            },
            select: { id: true, status: true, severity: true },
          },
        },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Campaigns"
        title="Your moderation assignments"
        description="Pick a campaign to open its inbox and start triaging reports."
        action={
          <Link href="/moderator/review-queue">
            <Button variant="secondary">Open inbox</Button>
          </Link>
        }
      />
      {assignments.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-600">You are not assigned to any campaigns yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const reports = assignment.campaign.bugReports;
            const pending = reports.filter((bug) => bug.status === "SUBMITTED").length;
            const needsInfo = reports.filter((bug) => bug.status === "NEEDS_INFO").length;
            const duplicates = reports.filter((bug) => bug.status === "DUPLICATE").length;
            const approved = reports.filter((bug) => bug.status === "APPROVED").length;
            const rejected = reports.filter((bug) => bug.status === "REJECTED").length;

            return (
              <Card key={assignment.id} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-1">
                  <p className="font-serif text-2xl text-stone-900">{assignment.campaign.projectName}</p>
                  <p className="text-sm text-stone-600">
                    Pending: {pending} · Needs info: {needsInfo} · Duplicates: {duplicates} · Approved: {approved} · Rejected: {rejected}
                  </p>
                </div>
                <Link href={`/moderator/campaigns/${assignment.campaignId}`}>
                  <Button>Open campaign</Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

