import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { getClientReportsData } from "@/lib/dashboard-data";
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

export default async function ClientReportsPage() {
  const session = await requireSession(["CLIENT"]);
  const reports = await getClientReportsData(session.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Reports"
        title="Campaign reporting"
        description="Final reports combine severity, coverage, and participation into a client-ready summary."
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
            <CardSection className="border-t border-slate-100/90">
              <CardMeta className="sm:grid-cols-2">
                <CardMetaItem label="Countries">{report.countries.join(", ") || "None"}</CardMetaItem>
                <CardMetaItem label="Devices">{report.devices.join(", ") || "None"}</CardMetaItem>
              </CardMeta>
            </CardSection>
          </Card>
        ))}
      </div>
    </div>
  );
}
