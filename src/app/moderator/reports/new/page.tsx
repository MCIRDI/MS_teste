import Link from "next/link";

import { submitModeratorBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/sections/section-heading";

const bugTypes = [
  "Functional Bugs",
  "UI / Visual Issues",
  "Performance Issues",
  "Crash / Critical Errors",
  "Compatibility Issues",
  "Usability Problems",
  "Security Issues",
  "Data Issues",
  "Network / API Issues",
  "Localization / Language Issues",
  "Installation / Setup Issues",
  "Edge Case Bugs",
  "Other",
] as const;

export default async function ModeratorNewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { campaignId } = await searchParams;

  const assignments = await prisma.campaignAssignment.findMany({
    where: {
      userId: session.id,
      assignmentRole: "MODERATOR",
    },
    include: { campaign: true },
    orderBy: { acceptedAt: "desc" },
  });

  if (assignments.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Report"
          title="No assigned campaigns"
          description="Accept a moderation invitation before submitting a report to the test manager."
          action={
            <Link href="/moderator/review-queue">
              <Button>Back to inbox</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selected = assignments.find((a) => a.campaignId === campaignId) ?? assignments[0];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Report"
        title="Send a curated report to the test manager"
        description="Use the same core fields as testers, plus a quick note about where it occurs the most. It will arrive as Approved in the manager queue."
        action={
          <Link href={`/moderator/campaigns/${selected.campaignId}`}>
            <Button variant="secondary">Back to campaign</Button>
          </Link>
        }
      />

      {assignments.length > 1 ? (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Campaign</CardTitle>
            <CardDescription>Choose which project this curated report belongs to.</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Link key={assignment.id} href={`/moderator/reports/new?campaignId=${assignment.campaignId}`}>
                  <Button variant={assignment.campaignId === selected.campaignId ? "primary" : "secondary"}>
                    {assignment.campaign.projectName}
                  </Button>
                </Link>
              ))}
            </div>
          </CardSection>
        </Card>
      ) : null}

      <Card padding="none">
        <CardHeader>
          <CardTitle>Report fields</CardTitle>
          <CardDescription>Same core fields as testers; arrives as approved for the manager.</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <form action={submitModeratorBugReportAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="campaignId" value={selected.campaignId} />

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="bugType">
                Type
              </label>
              <Select id="bugType" name="bugType" defaultValue="Functional Bugs">
                {bugTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">
                Title
              </label>
              <Input id="title" name="title" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="pageUrl">
                URL (optional)
              </label>
              <Input id="pageUrl" name="pageUrl" placeholder="https://example.com/checkout" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <Textarea id="description" name="description" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reproductionSteps">
                Reproduction steps
              </label>
              <Textarea id="reproductionSteps" name="reproductionSteps" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="severity">
                Severity
              </label>
              <Select id="severity" name="severity" defaultValue="MEDIUM">
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="attachments">
                Attachments (optional)
              </label>
              <Input id="attachments" name="attachments" type="file" multiple />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="commonOccurrence">
                Where it occurs most (optional)
              </label>
              <Textarea
                id="commonOccurrence"
                name="commonOccurrence"
                placeholder="Example: Mostly on iPhone 13 / iOS 18 / Safari, 1170x2532, United States"
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit">Send to test manager</Button>
            </div>
          </form>
        </CardSection>
      </Card>
    </div>
  );
}

