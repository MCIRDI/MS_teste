import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { getClientReportsData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ClientReportsPage() {
  const session = await requireSession(["CLIENT"]);
  const reports = await getClientReportsData(session.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Reports"
        title="Campaign reporting"
        description="Final reports combine severity, device coverage, country coverage, and tester participation into a client-ready summary."
      />
      <div className="grid gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h2 className="font-serif text-3xl text-stone-900">{report.name}</h2>
              {report.finalReport ? (
                <Link href={`/api/final-reports/${report.finalReport.id}`}>
                  <Button>Download final report (PDF)</Button>
                </Link>
              ) : (
                <Button disabled variant="secondary">
                  Final report not uploaded yet
                </Button>
              )}
            </div>
            <p className="text-sm text-stone-600">
              {report.testers} testers · {report.bugs.length} validated bugs
            </p>
            <p className="text-sm leading-7 text-stone-600">
              Countries: {report.countries.join(", ") || "None"}
            </p>
            <p className="text-sm leading-7 text-stone-600">
              Devices: {report.devices.join(", ") || "None"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

