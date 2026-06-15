"use client";

import { useEffect, useRef, useState } from "react";

import { createDisputeAction } from "@/app/actions/disputes";
import { useClientRealtime } from "@/components/client/client-realtime-provider";
import { Link } from "@/i18n/routing";
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
import { Textarea } from "@/components/ui/textarea";
import type { ApprovedBugPayload } from "@/lib/realtime/events";
import { cn } from "@/lib/utils";

type ReportBug = {
  id: string;
  title: string;
  severity: string;
  dispute: { status: string } | null;
};

type ClientReport = {
  id: string;
  name: string;
  countries: string[];
  devices: string[];
  bugs: ReportBug[];
  finalReport: { id: string } | null;
  testers: number;
};

export function ClientReportsLive({ initialReports }: { initialReports: ClientReport[] }) {
  const { recentApprovedBugs } = useClientRealtime();
  const [reports, setReports] = useState(initialReports);
  const [highlightedBugIds, setHighlightedBugIds] = useState<string[]>([]);
  const processedBugIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setReports(initialReports);
    processedBugIdsRef.current.clear();
  }, [initialReports]);

  useEffect(() => {
    if (recentApprovedBugs.length === 0) {
      return;
    }

    const freshBugs = recentApprovedBugs.filter((bug) => !processedBugIdsRef.current.has(bug.id));

    if (freshBugs.length === 0) {
      return;
    }

    for (const bug of freshBugs) {
      processedBugIdsRef.current.add(bug.id);
    }

    setReports((current) => mergeApprovedBugs(current, freshBugs));
    setHighlightedBugIds((current) => [...new Set([...freshBugs.map((bug) => bug.id), ...current])]);

    const timeoutId = window.setTimeout(() => {
      setHighlightedBugIds((current) =>
        current.filter((bugId) => !freshBugs.some((bug) => bug.id === bugId)),
      );
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentApprovedBugs]);

  return (
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
                    className={cn(
                      "rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors duration-700",
                      highlightedBugIds.includes(bug.id) && "border-emerald-300 bg-emerald-50/80",
                    )}
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
            ) : (
              <p className="text-sm text-slate-500">No validated bugs yet. New approvals will appear here instantly.</p>
            )}
          </CardSection>
        </Card>
      ))}
    </div>
  );
}

function mergeApprovedBugs(reports: ClientReport[], freshBugs: ApprovedBugPayload[]) {
  return reports.map((report) => {
    const incoming = freshBugs.filter((bug) => bug.campaignId === report.id);

    if (incoming.length === 0) {
      return report;
    }

    const existingIds = new Set(report.bugs.map((bug) => bug.id));
    const newBugs = incoming
      .filter((bug) => !existingIds.has(bug.id))
      .map((bug) => ({
        id: bug.id,
        title: bug.title,
        severity: bug.severity,
        dispute: null,
      }));

    if (newBugs.length === 0) {
      return report;
    }

    return {
      ...report,
      bugs: [...newBugs, ...report.bugs],
    };
  });
}
