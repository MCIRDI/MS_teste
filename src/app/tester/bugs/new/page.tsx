import { BugReportForm } from "@/components/forms/bug-report-form";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterBugNewPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { campaignId = "seed-campaign" } = await searchParams;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Bug reporting"
        title="Submit a bug report"
        description="Reports must include reproduction steps, expected and actual results, severity, and the captured testing environment."
      />
      <BugReportForm campaignId={campaignId} />
    </div>
  );
}
