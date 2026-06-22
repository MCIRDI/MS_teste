import { Link } from "@/i18n/routing";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BugStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import {
  Card, CardDescription, CardHeader,
  CardMeta, CardMetaItem, CardSection, CardTitle,
} from "@/components/ui/card";
import { ComposeReportForm } from "@/components/manager/compose-report-form";
import { generateFinalReportFromFormAction } from "@/app/actions/final-reports";

export default async function ComposeReportPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await requireSession(["TEST_MANAGER"]);
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      client:      { select: { name: true, email: true } },
      testManager: { select: { name: true, email: true } },
      assignments: { select: { assignmentRole: true } },
      bugReports: {
        where: { status: BugStatus.APPROVED },
        select: { severity: true },
      },
      moderatorReports: {
        include: { moderator: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (campaign.testManagerId !== session.id) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Compose" title="Access denied"
          description="You are not the test manager for this campaign."
          action={<Link href="/manager/reports"><Button>Back to reports</Button></Link>}
        />
      </div>
    );
  }

  const severityCounts = campaign.bugReports.reduce((acc, b) => {
    acc[b.severity] = (acc[b.severity] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const testerCount = campaign.assignments.filter(
    (a) => a.assignmentRole === "CROWD_TESTER" || a.assignmentRole === "CERT_TESTER",
  ).length;

  // Build default values for the editable fields
  const defaultTitle = `Test Report — ${campaign.projectName}`;
  const bugSummary = [
    severityCounts["CRITICAL"] ? `${severityCounts["CRITICAL"]} critical` : "",
    severityCounts["HIGH"]     ? `${severityCounts["HIGH"]} high` : "",
    severityCounts["MEDIUM"]   ? `${severityCounts["MEDIUM"]} medium` : "",
    severityCounts["LOW"]      ? `${severityCounts["LOW"]} low` : "",
  ].filter(Boolean).join(", ");

  const defaultSummary =
    `This report covers the test campaign for ${campaign.projectName} conducted on the ` +
    `${campaign.softwareType.replace("_", " ").toLowerCase()} platform. ` +
    `A total of ${campaign.bugReports.length} bugs were validated across ${testerCount} tester${testerCount !== 1 ? "s" : ""}` +
    (bugSummary ? ` (${bugSummary}).` : ".");

  const defaultScope =
    `Target countries: ${campaign.targetCountries.join(", ") || "All"}. ` +
    `Platforms: ${campaign.selectedPlatforms.join(", ") || "All"}. ` +
    `Browsers: ${campaign.selectedBrowsers.join(", ") || "All"}.`;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Compose report"
        title={campaign.projectName}
        description="Review and edit the pre-filled fields below, then generate the final PDF."
        action={<Link href="/manager/reports"><Button variant="secondary">Cancel</Button></Link>}
      />

      {/* Bug snapshot */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Campaign snapshot</CardTitle>
          <CardDescription>Data that will be included automatically in the PDF.</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <CardMeta className="sm:grid-cols-6">
            <CardMetaItem label="Total bugs">{campaign.bugReports.length}</CardMetaItem>
            <CardMetaItem label="Critical">
              <span className="text-red-600 font-semibold">{severityCounts["CRITICAL"] ?? 0}</span>
            </CardMetaItem>
            <CardMetaItem label="High">
              <span className="text-orange-600 font-semibold">{severityCounts["HIGH"] ?? 0}</span>
            </CardMetaItem>
            <CardMetaItem label="Medium">
              <span className="text-yellow-600 font-semibold">{severityCounts["MEDIUM"] ?? 0}</span>
            </CardMetaItem>
            <CardMetaItem label="Low">
              <span className="text-green-600 font-semibold">{severityCounts["LOW"] ?? 0}</span>
            </CardMetaItem>
            <CardMetaItem label="Testers">{testerCount}</CardMetaItem>
          </CardMeta>
        </CardSection>
      </Card>

      {/* Moderator reports received */}
      <Card padding="none">
        <CardHeader>
          <CardTitle>Moderator reports</CardTitle>
          <CardDescription>
            {campaign.moderatorReports.length === 0
              ? "No moderator reports submitted yet. You can still generate the PDF without them."
              : `${campaign.moderatorReports.length} report${campaign.moderatorReports.length > 1 ? "s" : ""} received. Use them as reference when writing your summary and conclusions below.`}
          </CardDescription>
        </CardHeader>
        {campaign.moderatorReports.length > 0 ? (
          <CardSection className="border-t border-slate-100/90">
            <div className="space-y-3">
              {campaign.moderatorReports.map((mr) => (
                <div key={mr.id} className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {mr.moderator.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{mr.moderator.name}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span className="text-green-600 font-medium">{mr.approved} approved</span>
                      <span className="text-red-500 font-medium">{mr.rejected} rejected</span>
                      <span>{mr.duplicates} duplicates</span>
                    </div>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-3">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Summary</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.summary}</p>
                    </div>
                    {mr.observations ? (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Observations</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.observations}</p>
                      </div>
                    ) : null}
                    {mr.recommendations ? (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recommendations</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{mr.recommendations}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardSection>
        ) : null}
      </Card>

      {/* Compose form */}
      <ComposeReportForm
        campaignId={campaignId}
        defaults={{
          reportTitle:      defaultTitle,
          executiveSummary: defaultSummary,
          scope:            defaultScope,
          conclusions:      "",
          recommendations:  "",
        }}
        action={generateFinalReportFromFormAction}
      />
    </div>
  );
}
