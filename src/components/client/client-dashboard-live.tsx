"use client";

import { useEffect, useRef, useState } from "react";

import { useClientRealtime } from "@/components/client/client-realtime-provider";
import { payCampaignAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { formatCurrency } from "@/lib/utils";
import type { ApprovedBugPayload } from "@/lib/realtime/events";

type DashboardCampaign = {
  id: string;
  name: string;
  stage: string;
  isPremium: boolean;
  isPaid: boolean;
  testers: number;
  bugs: number;
  countries: string;
  devices: string;
  price: number;
};

type DashboardData = {
  stats: { label: string; value: string | number }[];
  campaigns: DashboardCampaign[];
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

function applyApprovedBug(data: DashboardData, bug: ApprovedBugPayload): DashboardData {
  const stats = data.stats.map((stat) =>
    stat.label === "Approved bugs" ? { ...stat, value: Number(stat.value) + 1 } : stat,
  );

  const severity = { ...data.severity };

  switch (bug.severity) {
    case "CRITICAL":
      severity.critical += 1;
      break;
    case "HIGH":
      severity.high += 1;
      break;
    case "MEDIUM":
      severity.medium += 1;
      break;
    case "LOW":
      severity.low += 1;
      break;
    default:
      break;
  }

  return {
    stats,
    campaigns: data.campaigns,
    severity,
  };
}

export function ClientDashboardLive({ initialData }: { initialData: DashboardData }) {
  const { recentApprovedBugs } = useClientRealtime();
  const [data, setData] = useState(initialData);
  const [highlightedCampaignIds, setHighlightedCampaignIds] = useState<string[]>([]);
  const processedBugIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setData(initialData);
    processedBugIdsRef.current.clear();
  }, [initialData]);

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

    setData((current) => freshBugs.reduce((next, bug) => applyApprovedBug(next, bug), current));
    setHighlightedCampaignIds((current) => [
      ...new Set([...freshBugs.map((bug) => bug.campaignId), ...current]),
    ]);

    const timeoutId = window.setTimeout(() => {
      setHighlightedCampaignIds((current) =>
        current.filter((campaignId) => !freshBugs.some((bug) => bug.campaignId === campaignId)),
      );
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentApprovedBugs]);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Campaign portfolio"
            title="Campaign overview"
            description="Campaigns, tester allocation, validated bugs, and estimates currently on record."
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100 px-0 pb-0 pt-0">
          <div className="overflow-x-auto px-5 pb-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Testers</th>
                    <th>Bugs</th>
                    <th>Countries</th>
                    <th>Estimated cost</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className={
                        highlightedCampaignIds.includes(campaign.id)
                          ? "bg-emerald-50/80 transition-colors duration-700"
                          : undefined
                      }
                    >
                      <td className="font-medium text-slate-900">
                        {campaign.name}
                        {campaign.isPremium ? (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                            Premium
                          </span>
                        ) : null}
                      </td>
                      <td>{campaign.stage.replace(/_/g, " ")}</td>
                      <td>{campaign.testers}</td>
                      <td>{campaign.bugs}</td>
                      <td>{campaign.countries || "None"}</td>
                      <td>{formatCurrency(campaign.price)}</td>
                      <td>
                        {campaign.isPaid ? (
                          <span className="text-sm text-emerald-700">Paid</span>
                        ) : (
                          <form action={payCampaignAction}>
                            <input type="hidden" name="campaignId" value={campaign.id} />
                            <Button type="submit" className="h-8 text-xs">
                              Pay & launch
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardSection>
      </Card>
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Severity"
            title="Validated bug mix"
            description="See where risk concentrates without opening individual reports."
          />
        </CardHeader>
        <CardSection>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-red-100 bg-red-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Critical</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.critical}</p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-orange-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">High</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.high}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Medium</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.medium}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Low</p>
              <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">{data.severity.low}</p>
            </div>
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
