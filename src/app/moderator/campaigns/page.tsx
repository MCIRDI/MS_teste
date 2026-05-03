import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        <Card variant="muted">
          <p className="text-sm text-slate-600">You are not assigned to any campaigns yet.</p>
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
              <Card key={assignment.id} padding="none">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{assignment.campaign.projectName}</CardTitle>
                    <CardDescription>Inbox counts across active moderation states</CardDescription>
                  </div>
                  <Link href={`/moderator/campaigns/${assignment.campaignId}`} className="shrink-0">
                    <Button>Open campaign</Button>
                  </Link>
                </CardHeader>
                <CardSection className="border-t border-slate-100/90 bg-white/40">
                  <CardMeta className="sm:grid-cols-5">
                    <CardMetaItem label="Pending">{pending}</CardMetaItem>
                    <CardMetaItem label="Needs info">{needsInfo}</CardMetaItem>
                    <CardMetaItem label="Duplicates">{duplicates}</CardMetaItem>
                    <CardMetaItem label="Approved">{approved}</CardMetaItem>
                    <CardMetaItem label="Rejected">{rejected}</CardMetaItem>
                  </CardMeta>
                </CardSection>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
