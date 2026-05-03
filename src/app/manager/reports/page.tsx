import Link from "next/link";

import { uploadFinalReportAction } from "@/app/actions/final-reports";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardSection,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/sections/section-heading";
import { BugAnalytics } from "@/components/charts/bug-analytics";

export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const session = await requireSession(["TEST_MANAGER"]);
  const { campaignId } = await searchParams;

  const campaigns = await prisma.campaign.findMany({
    where: { testManagerId: session.id },
    include: {
      finalReports: { orderBy: { createdAt: "desc" } },
      bugReports: {
        where: { status: "APPROVED" },
        include: {
          tester: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Delivery"
          title="Final reports"
          description="You are not assigned to any campaigns yet."
          action={
            <Link href="/manager/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selected = campaigns.find((c) => c.id === campaignId) ?? campaigns[0];
  const nextValidatedCount = selected.bugReports.length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery"
        title="Final reports"
        description="Upload a PDF for the client. They download it from Campaign reports."
        action={
          <Link href="/manager/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        }
      />

      {campaigns.length > 1 ? (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Campaign</CardTitle>
            <CardDescription>Select which project this delivery belongs to.</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <div className="flex flex-wrap gap-2">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/manager/reports?campaignId=${campaign.id}`}>
                  <Button variant={campaign.id === selected.id ? "primary" : "secondary"}>{campaign.projectName}</Button>
                </Link>
              ))}
            </div>
          </CardSection>
        </Card>
      ) : null}

      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Upload"
            title={`PDF for ${selected.projectName}`}
            description={`Approved bugs in this campaign: ${nextValidatedCount}.`}
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <form action={uploadFinalReportAction} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <input type="hidden" name="campaignId" value={selected.id} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="pdf">
                PDF file
              </label>
              <Input id="pdf" name="pdf" type="file" accept="application/pdf" required />
            </div>
            <Button type="submit">Upload final report</Button>
          </form>
        </CardSection>
      </Card>

      <BugAnalytics bugReports={selected.bugReports} campaignName={selected.projectName} />

      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="History"
            title="Uploaded reports"
            description="Each PDF remains available for download."
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          {selected.finalReports.length === 0 ? (
            <p className="text-sm text-slate-600">No final reports uploaded yet.</p>
          ) : (
            <div className="grid gap-2">
              {selected.finalReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/api/final-reports/${report.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {report.originalName} · {report.createdAt.toLocaleString()}
                </Link>
              ))}
            </div>
          )}
        </CardSection>
      </Card>
    </div>
  );
}
