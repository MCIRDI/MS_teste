/**
 * Server-side PDF report generator for completed test campaigns.
 * Uses @react-pdf/renderer — no headless browser required.
 */

import { codeToCountryName } from "@/lib/constants";
import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BugReportData {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  errorType: string | null;
  feature: string | null;
  pageUrl: string | null;
  description: string;
  reproductionSteps: string;
  moderationNotes: string | null;
  environment: {
    country?: string;
    device?: string;
    osVersion?: string;
    browser?: string;
    screenResolution?: string;
  };
  tester: {
    name: string;
    country: string | null;
    isCertified: boolean;
  };
  createdAt: Date;
}

export interface CampaignReportData {
  id: string;
  projectName: string;
  description: string;
  softwareType: string;
  websiteUrl: string | null;
  targetCountries: string[];
  selectedPlatforms: string[];
  selectedBrowsers: string[];
  stage: string;
  startDate: Date | null;
  endDate: Date | null;
  estimatedCost: number;
  currency: string;
  crowdTesterCount: number;
  certTesterCount: number;
  client: { name: string; email: string };
  testManager: { name: string; email: string } | null;
  bugReports: BugReportData[];
  testerCount: number;
  generatedAt: Date;
}

// ─── Colour palette ──────────────────────────────────────────────────────────

const COLOURS = {
  primary: "#1e40af",       // blue-800
  primaryLight: "#dbeafe",  // blue-100
  critical: "#dc2626",      // red-600
  high: "#ea580c",          // orange-600
  medium: "#ca8a04",        // yellow-600
  low: "#16a34a",           // green-600
  text: "#111827",          // gray-900
  muted: "#6b7280",         // gray-500
  border: "#e5e7eb",        // gray-200
  bg: "#f9fafb",            // gray-50
  white: "#ffffff",
};

function severityColour(sev: string) {
  switch (sev) {
    case "CRITICAL": return COLOURS.critical;
    case "HIGH":     return COLOURS.high;
    case "MEDIUM":   return COLOURS.medium;
    default:         return COLOURS.low;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOURS.text,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  // Header
  header: {
    backgroundColor: COLOURS.primary,
    marginHorizontal: -48,
    marginTop: -48,
    paddingHorizontal: 48,
    paddingVertical: 28,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.white,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: COLOURS.primaryLight,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: COLOURS.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: COLOURS.muted,
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLOURS.primary,
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 22,
  },
  // Info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  infoCell: {
    width: "47%",
    backgroundColor: COLOURS.bg,
    borderWidth: 1,
    borderColor: COLOURS.border,
    borderRadius: 4,
    padding: 8,
  },
  infoCellLabel: {
    fontSize: 7,
    color: COLOURS.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoCellValue: {
    fontSize: 9,
    color: COLOURS.text,
  },
  // Summary bar
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.white,
  },
  summaryLabel: {
    fontSize: 7,
    color: COLOURS.white,
    marginTop: 2,
    textAlign: "center",
  },
  // Stats table
  statsTable: {
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  statsRowHeader: {
    backgroundColor: COLOURS.primaryLight,
  },
  statsCell: {
    fontSize: 8,
  },
  // Bug card
  bugCard: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    overflow: "hidden",
  },
  bugCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 6,
  },
  severityBadge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  severityText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.white,
  },
  bugTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    color: COLOURS.text,
  },
  bugBody: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  bugField: {
    marginBottom: 4,
  },
  bugFieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.muted,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  bugFieldValue: {
    fontSize: 8,
    color: COLOURS.text,
  },
  bugEnvRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
    backgroundColor: COLOURS.bg,
    borderRadius: 3,
    padding: 6,
  },
  bugEnvItem: {
    fontSize: 7,
    color: COLOURS.muted,
  },
  // Tester table
  testerTable: {
    marginBottom: 10,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tHeader: {
    backgroundColor: COLOURS.primaryLight,
  },
  tCell: { fontSize: 8 },
});

// ─── Small helper components ─────────────────────────────────────────────────

function PageFooter({ campaignName, generatedAt }: { campaignName: string; generatedAt: Date }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{campaignName} — Test Report</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
      />
      <Text style={s.footerText}>Generated {generatedAt.toLocaleDateString()}</Text>
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoCellLabel}>{label}</Text>
      <Text style={s.infoCellValue}>{value || "—"}</Text>
    </View>
  );
}

// ─── Statistics helpers ───────────────────────────────────────────────────────

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const k = key(item) || "Unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

function topEntries(map: Record<string, number>, max = 10): [string, number][] {
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max);
}

// ─── PDF Document ────────────────────────────────────────────────────────────

function ReportDocument({ data }: { data: CampaignReportData }) {
  const approved = data.bugReports;
  const severityCounts = countBy(approved, (b) => b.severity);
  const countryCounts  = countBy(approved, (b) => {
    const code = b.environment?.country ?? b.tester.country ?? "Unknown";
    return code !== "Unknown" ? codeToCountryName(code) : "Unknown";
  });
  const deviceCounts   = countBy(approved, (b) => b.environment?.device ?? "Unknown");
  const errorCounts    = countBy(approved, (b) =>
    (b.errorType ?? "Other").replace(/optional/gi, "").replace(/\([^)]*\)/g, "").trim() || "Other",
  );

  const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

  // Unique testers who reported at least one approved bug
  const testerMap = new Map<string, { name: string; isCertified: boolean; bugCount: number }>();
  for (const bug of approved) {
    const prev = testerMap.get(bug.tester.name) ?? { name: bug.tester.name, isCertified: bug.tester.isCertified, bugCount: 0 };
    testerMap.set(bug.tester.name, { ...prev, bugCount: prev.bugCount + 1 });
  }
  const testerRows = Array.from(testerMap.values()).sort((a, b) => b.bugCount - a.bugCount);

  return (
    <Document
      title={`Test Report — ${data.projectName}`}
      author="DzTesters Platform"
      subject="Campaign Final Report"
      creator="DzTesters"
    >
      {/* ─── Page 1: Cover + Overview ───────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />

        {/* Header banner */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{data.projectName}</Text>
          <Text style={s.headerMeta}>
            Campaign Test Report  ·  Generated {data.generatedAt.toLocaleDateString()}
          </Text>
        </View>

        {/* Summary boxes */}
        <View style={s.summaryRow}>
          <View style={[s.summaryBox, { backgroundColor: COLOURS.critical }]}>
            <Text style={s.summaryNumber}>{severityCounts["CRITICAL"] ?? 0}</Text>
            <Text style={s.summaryLabel}>Critical Bugs</Text>
          </View>
          <View style={[s.summaryBox, { backgroundColor: COLOURS.high }]}>
            <Text style={s.summaryNumber}>{severityCounts["HIGH"] ?? 0}</Text>
            <Text style={s.summaryLabel}>High Bugs</Text>
          </View>
          <View style={[s.summaryBox, { backgroundColor: COLOURS.medium }]}>
            <Text style={s.summaryNumber}>{severityCounts["MEDIUM"] ?? 0}</Text>
            <Text style={s.summaryLabel}>Medium Bugs</Text>
          </View>
          <View style={[s.summaryBox, { backgroundColor: COLOURS.low }]}>
            <Text style={s.summaryNumber}>{severityCounts["LOW"] ?? 0}</Text>
            <Text style={s.summaryLabel}>Low Bugs</Text>
          </View>
          <View style={[s.summaryBox, { backgroundColor: COLOURS.primary }]}>
            <Text style={s.summaryNumber}>{approved.length}</Text>
            <Text style={s.summaryLabel}>Total Validated</Text>
          </View>
          <View style={[s.summaryBox, { backgroundColor: "#374151" }]}>
            <Text style={s.summaryNumber}>{data.testerCount}</Text>
            <Text style={s.summaryLabel}>Testers</Text>
          </View>
        </View>

        {/* Campaign info */}
        <Text style={s.sectionTitle}>Campaign Information</Text>
        <View style={s.infoGrid}>
          <InfoCell label="Project" value={data.projectName} />
          <InfoCell label="Software Type" value={data.softwareType} />
          <InfoCell label="Status" value={data.stage} />
          <InfoCell label="Website / URL" value={data.websiteUrl ?? "—"} />
          <InfoCell label="Platforms" value={data.selectedPlatforms.join(", ") || "—"} />
          <InfoCell label="Browsers" value={data.selectedBrowsers.join(", ") || "—"} />
          <InfoCell label="Target Countries" value={data.targetCountries.map(codeToCountryName).join(", ") || "—"} />
          <InfoCell label="Campaign Cost" value={`${data.estimatedCost} ${data.currency}`} />
          <InfoCell
            label="Start Date"
            value={data.startDate ? data.startDate.toLocaleDateString() : "—"}
          />
          <InfoCell
            label="End Date"
            value={data.endDate ? data.endDate.toLocaleDateString() : "—"}
          />
          <InfoCell label="Client" value={`${data.client.name} (${data.client.email})`} />
          <InfoCell
            label="Test Manager"
            value={
              data.testManager
                ? `${data.testManager.name} (${data.testManager.email})`
                : "Not assigned"
            }
          />
        </View>

        {/* Description */}
        {data.description ? (
          <View style={{ marginTop: 10 }}>
            <Text style={s.sectionTitle}>Project Description</Text>
            <Text style={{ fontSize: 9, color: COLOURS.text, lineHeight: 1.6 }}>
              {data.description}
            </Text>
          </View>
        ) : null}
      </Page>

      {/* ─── Page 2: Statistics ──────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />
        <View style={s.header}>
          <Text style={s.headerTitle}>Bug Statistics</Text>
          <Text style={s.headerMeta}>{data.projectName}</Text>
        </View>

        {/* Severity breakdown */}
        <Text style={s.sectionTitle}>Severity Breakdown</Text>
        <View style={s.statsTable}>
          <View style={[s.statsRow, s.statsRowHeader]}>
            <Text style={[s.statsCell, { width: "40%", fontFamily: "Helvetica-Bold" }]}>Severity</Text>
            <Text style={[s.statsCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>Count</Text>
            <Text style={[s.statsCell, { width: "40%", fontFamily: "Helvetica-Bold" }]}>Share</Text>
          </View>
          {SEVERITY_ORDER.map((sev) => {
            const count = severityCounts[sev] ?? 0;
            const pct = approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0";
            return (
              <View key={sev} style={s.statsRow}>
                <View style={[s.statsCell, { width: "40%", flexDirection: "row", alignItems: "center", gap: 4 }]}>
                  <View style={[s.severityBadge, { backgroundColor: severityColour(sev) }]}>
                    <Text style={s.severityText}>{sev}</Text>
                  </View>
                </View>
                <Text style={[s.statsCell, { width: "20%" }]}>{count}</Text>
                <Text style={[s.statsCell, { width: "40%", color: COLOURS.muted }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Country breakdown */}
        <Text style={s.sectionTitle}>Country Distribution (Top 10)</Text>
        <View style={s.statsTable}>
          <View style={[s.statsRow, s.statsRowHeader]}>
            <Text style={[s.statsCell, { width: "50%", fontFamily: "Helvetica-Bold" }]}>Country</Text>
            <Text style={[s.statsCell, { width: "25%", fontFamily: "Helvetica-Bold" }]}>Bugs</Text>
            <Text style={[s.statsCell, { width: "25%", fontFamily: "Helvetica-Bold" }]}>%</Text>
          </View>
          {topEntries(countryCounts).map(([country, count]) => (
            <View key={country} style={s.statsRow}>
              <Text style={[s.statsCell, { width: "50%" }]}>{country}</Text>
              <Text style={[s.statsCell, { width: "25%" }]}>{count}</Text>
              <Text style={[s.statsCell, { width: "25%", color: COLOURS.muted }]}>
                {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
              </Text>
            </View>
          ))}
        </View>

        {/* Device breakdown */}
        <Text style={s.sectionTitle}>Device Distribution (Top 10)</Text>
        <View style={s.statsTable}>
          <View style={[s.statsRow, s.statsRowHeader]}>
            <Text style={[s.statsCell, { width: "50%", fontFamily: "Helvetica-Bold" }]}>Device</Text>
            <Text style={[s.statsCell, { width: "25%", fontFamily: "Helvetica-Bold" }]}>Bugs</Text>
            <Text style={[s.statsCell, { width: "25%", fontFamily: "Helvetica-Bold" }]}>%</Text>
          </View>
          {topEntries(deviceCounts).map(([device, count]) => (
            <View key={device} style={s.statsRow}>
              <Text style={[s.statsCell, { width: "50%" }]}>{device}</Text>
              <Text style={[s.statsCell, { width: "25%" }]}>{count}</Text>
              <Text style={[s.statsCell, { width: "25%", color: COLOURS.muted }]}>
                {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
              </Text>
            </View>
          ))}
        </View>

        {/* Error type breakdown */}
        <Text style={s.sectionTitle}>Error Type Distribution (Top 10)</Text>
        <View style={s.statsTable}>
          <View style={[s.statsRow, s.statsRowHeader]}>
            <Text style={[s.statsCell, { width: "55%", fontFamily: "Helvetica-Bold" }]}>Error Type</Text>
            <Text style={[s.statsCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>Count</Text>
            <Text style={[s.statsCell, { width: "25%", fontFamily: "Helvetica-Bold" }]}>%</Text>
          </View>
          {topEntries(errorCounts).map(([errorType, count]) => (
            <View key={errorType} style={s.statsRow}>
              <Text style={[s.statsCell, { width: "55%" }]}>{errorType}</Text>
              <Text style={[s.statsCell, { width: "20%" }]}>{count}</Text>
              <Text style={[s.statsCell, { width: "25%", color: COLOURS.muted }]}>
                {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
              </Text>
            </View>
          ))}
        </View>

        {/* Tester participation */}
        <Text style={s.sectionTitle}>Tester Participation</Text>
        <View style={s.testerTable}>
          <View style={[s.tRow, s.tHeader]}>
            <Text style={[s.tCell, { width: "50%", fontFamily: "Helvetica-Bold" }]}>Tester</Text>
            <Text style={[s.tCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>Certified</Text>
            <Text style={[s.tCell, { width: "30%", fontFamily: "Helvetica-Bold" }]}>Approved Bugs</Text>
          </View>
          {testerRows.map((row) => (
            <View key={row.name} style={s.tRow}>
              <Text style={[s.tCell, { width: "50%" }]}>{row.name}</Text>
              <Text style={[s.tCell, { width: "20%" }]}>{row.isCertified ? "✓ Yes" : "No"}</Text>
              <Text style={[s.tCell, { width: "30%" }]}>{row.bugCount}</Text>
            </View>
          ))}
          {testerRows.length === 0 ? (
            <View style={s.tRow}>
              <Text style={[s.tCell, { color: COLOURS.muted }]}>No testers contributed approved bugs yet.</Text>
            </View>
          ) : null}
        </View>
      </Page>

      {/* ─── Pages 3+: Bug Detail Catalogue ─────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />
        <View style={s.header}>
          <Text style={s.headerTitle}>Validated Bug Catalogue</Text>
          <Text style={s.headerMeta}>
            {data.projectName}  ·  {approved.length} approved bug{approved.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {approved.length === 0 ? (
          <Text style={{ color: COLOURS.muted, fontSize: 9 }}>
            No approved bugs have been recorded for this campaign yet.
          </Text>
        ) : null}

        {approved.map((bug, idx) => (
          <View
            key={bug.id}
            style={[s.bugCard, { borderColor: severityColour(bug.severity) }]}
            wrap={false}
          >
            {/* Card header */}
            <View style={[s.bugCardHeader, { backgroundColor: `${severityColour(bug.severity)}18` }]}>
              <Text style={{ fontSize: 8, color: COLOURS.muted, minWidth: 22 }}>#{idx + 1}</Text>
              <View style={[s.severityBadge, { backgroundColor: severityColour(bug.severity) }]}>
                <Text style={s.severityText}>{bug.severity}</Text>
              </View>
              <Text style={s.bugTitle}>{bug.title}</Text>
              <Text style={{ fontSize: 7, color: COLOURS.muted }}>
                {bug.createdAt.toLocaleDateString()}
              </Text>
            </View>

            {/* Card body */}
            <View style={s.bugBody}>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  {bug.pageUrl ? (
                    <View style={s.bugField}>
                      <Text style={s.bugFieldLabel}>Page / URL</Text>
                      <Text style={s.bugFieldValue}>{bug.pageUrl}</Text>
                    </View>
                  ) : null}
                  {bug.errorType ? (
                    <View style={s.bugField}>
                      <Text style={s.bugFieldLabel}>Error Type</Text>
                      <Text style={s.bugFieldValue}>{bug.errorType}</Text>
                    </View>
                  ) : null}
                  <View style={s.bugField}>
                    <Text style={s.bugFieldLabel}>Description</Text>
                    <Text style={s.bugFieldValue}>{bug.description}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.bugField}>
                    <Text style={s.bugFieldLabel}>Steps to Reproduce</Text>
                    <Text style={s.bugFieldValue}>{bug.reproductionSteps}</Text>
                  </View>
                  {bug.moderationNotes ? (
                    <View style={s.bugField}>
                      <Text style={s.bugFieldLabel}>Moderator Notes</Text>
                      <Text style={[s.bugFieldValue, { color: COLOURS.muted }]}>
                        {bug.moderationNotes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Environment row */}
              <View style={s.bugEnvRow}>
                {bug.environment?.device ? (
                  <Text style={s.bugEnvItem}>📱 {bug.environment.device}</Text>
                ) : null}
                {bug.environment?.osVersion ? (
                  <Text style={s.bugEnvItem}>🖥 {bug.environment.osVersion}</Text>
                ) : null}
                {bug.environment?.browser ? (
                  <Text style={s.bugEnvItem}>🌐 {bug.environment.browser}</Text>
                ) : null}
                {bug.environment?.country ? (
                  <Text style={s.bugEnvItem}>📍 {codeToCountryName(bug.environment.country)}</Text>
                ) : null}
                {bug.environment?.screenResolution ? (
                  <Text style={s.bugEnvItem}>🔲 {bug.environment.screenResolution}</Text>
                ) : null}
                <Text style={s.bugEnvItem}>👤 {bug.tester.name}</Text>
              </View>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders the campaign report as a PDF buffer.
 * Call this from an API route or server action.
 */
export async function generateCampaignReportPdf(data: CampaignReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}
