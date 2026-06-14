import { createDisputeAction } from "@/app/actions/disputes";
import { Link } from "@/i18n/routing";

import { requireSession } from "@/lib/auth";
import { getClientReportsWithDisputes } from "@/lib/dashboard-data";
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
import { Textarea } from "@/components/ui/textarea";

export default async function ClientReportsPage() {
  const session = await requireSession(["CLIENT"]);
  const reports = await getClientReportsWithDisputes(session.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Reports"
        title="Campaign reporting"
        description="Validated bugs, final reports, and dispute management for your campaigns."
      />
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} padding="none">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">{report.name}</CardTitle>
                <CardDescription className="mt-1">
                  {report.testers} testers · {report.bugs.length} validated bugs
                </CardDescription>
              </div>
              {report.finalReport ? (
                <Link href={`/api/final-reports/${report.finalReport.id}`}>
                  <Button>Download PDF</Button>
                </Link>
              ) : (
                <Button disabled variant="secondary">
                  Final report pending
                </Button>
              )}
            </CardHeader>
            <CardSection className="space-y-4 border-t border-slate-100/90">
              <CardMeta className="sm:grid-cols-2">
                <CardMetaItem label="Countries">{report.countries.join(", ") || "None"}</CardMetaItem>
                <CardMetaItem label="Devices">{report.devices.join(", ") || "None"}</CardMetaItem>
              </CardMeta>

              {report.bugs.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900">Validated bugs</p>
                  {report.bugs.map((bug) => (
                    <div
                      key={bug.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <p className="font-medium text-slate-900">{bug.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Severity: {bug.severity}</p>
                      {bug.dispute ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Dispute {bug.dispute.status.toLowerCase()}
                        </p>
                      ) : (
                        <form action={createDisputeAction} className="mt-3 space-y-2">
                          <input type="hidden" name="bugReportId" value={bug.id} />
                          <Textarea
                            name="reason"
                            placeholder="Why is this bug disputed?"
                            required
                            className="min-h-16 text-sm"
                          />
                          <Button type="submit" variant="secondary" className="h-8 text-xs">
                            Open dispute
                          </Button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardSection>
          </Card>
        ))}
      </div>
    </div>
  );
}
