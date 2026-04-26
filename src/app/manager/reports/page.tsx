import Link from "next/link";

import { uploadFinalReportAction } from "@/app/actions/final-reports";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        description="Upload a PDF final report for the client. The client can download it from their Campaign reports page."
        action={
          <Link href="/manager/dashboard">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        }
      />

      {campaigns.length > 1 ? (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-stone-900">Campaign</p>
          <div className="flex flex-wrap gap-2">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/manager/reports?campaignId=${campaign.id}`}>
                <Button variant={campaign.id === selected.id ? "primary" : "secondary"}>{campaign.projectName}</Button>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Upload"
          title={`Upload PDF for ${selected.projectName}`}
          description={`Approved bugs in this campaign: ${nextValidatedCount}.`}
        />
        <form action={uploadFinalReportAction} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <input type="hidden" name="campaignId" value={selected.id} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="pdf">
              PDF file
            </label>
            <Input id="pdf" name="pdf" type="file" accept="application/pdf" required />
          </div>
          <Button type="submit">Upload final report</Button>
        </form>
      </Card>

      <BugAnalytics bugReports={selected.bugReports} campaignName={selected.projectName} />

      <Card className="space-y-4">
        <SectionHeading
          eyebrow="History"
          title="Uploaded reports"
          description="Each uploaded PDF stays available for download."
        />
        {selected.finalReports.length === 0 ? (
          <p className="text-sm text-stone-600">No final reports uploaded yet.</p>
        ) : (
          <div className="grid gap-2">
            {selected.finalReports.map((report) => (
              <Link
                key={report.id}
                href={`/api/final-reports/${report.id}`}
                className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-800 hover:bg-stone-200"
              >
                {report.originalName} · {report.createdAt.toLocaleString()}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

