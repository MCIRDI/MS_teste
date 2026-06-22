/**
 * Server-side PDF report generator for completed test campaigns.
 * Uses @react-pdf/renderer — no headless browser required.
 */

import { codeToCountryName } from "@/lib/constants";
import React from "react";
import {
  Document,
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
  tester: { name: string; country: string | null; isCertified: boolean };
  createdAt: Date;
}

export interface ModeratorReportData {
  moderatorName: string;
  summary: string;
  observations: string;
  recommendations: string;
  totalReviewed: number;
  approved: number;
  rejected: number;
  duplicates: number;
}

/** Editable fields the TEST_MANAGER can customise before generating the PDF. */
export interface ReportEditableFields {
  reportTitle: string;
  executiveSummary: string;
  scope: string;
  conclusions: string;
  recommendations: string;
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
  editable: ReportEditableFields;
}

// ─── Colour palette ──────────────────────────────────────────────────────────

const C = {
  primary:      "#1e3a8a", // blue-900
  primaryMid:   "#1e40af", // blue-800
  primaryLight: "#dbeafe", // blue-100
  accent:       "#0ea5e9", // sky-500
  critical:     "#dc2626",
  high:         "#ea580c",
  medium:       "#ca8a04",
  low:          "#16a34a",
  text:         "#111827",
  muted:        "#6b7280",
  border:       "#e5e7eb",
  bg:           "#f9fafb",
  white:        "#ffffff",
  headerBg:     "#0f172a", // slate-900
};

function severityColour(sev: string) {
  switch (sev) {
    case "CRITICAL": return C.critical;
    case "HIGH":     return C.high;
    case "MEDIUM":   return C.medium;
    default:         return C.low;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
    lineHeight: 1.5,
  },
  pageBody: { paddingHorizontal: 48 },
  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 48,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 28,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  headerBrandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.accent,
  },
  headerBrandText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 6,
  },
  headerProjectLabel: {
    fontSize: 8,
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerProjectName: {
    fontSize: 13,
    color: C.primaryLight,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  headerMeta: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 6,
  },
  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.muted },
  // ── Section title ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.primaryMid,
    borderBottomWidth: 2,
    borderBottomColor: C.primaryMid,
    paddingBottom: 3,
    marginBottom: 10,
    marginTop: 20,
  },
  // ── Info grid ────────────────────────────────────────────────────────────
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  infoCell: {
    width: "47%",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
  },
  infoCellLabel: {
    fontSize: 7,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoCellValue: { fontSize: 9, color: C.text },
  // ── Summary boxes ────────────────────────────────────────────────────────
  summaryRow: { flexDirection: "row", gap: 7, marginBottom: 16 },
  summaryBox: {
    flex: 1, borderRadius: 5, padding: 9, alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white,
  },
  summaryLabel: {
    fontSize: 6.5, color: C.white, marginTop: 2, textAlign: "center",
  },
  // ── Stats table ──────────────────────────────────────────────────────────
  statsTable: { marginBottom: 10 },
  statsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  statsRowHeader: { backgroundColor: C.primaryLight },
  statsCell: { fontSize: 8 },
  // ── Bug card ─────────────────────────────────────────────────────────────
  bugCard: { borderWidth: 1, borderRadius: 5, marginBottom: 10, overflow: "hidden" },
  bugCardHeader: { flexDirection: "row", alignItems: "center", padding: 8, gap: 6 },
  severityBadge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  severityText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.white },
  bugTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", flex: 1, color: C.text },
  bugBody: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  bugField: { marginBottom: 4 },
  bugFieldLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", marginBottom: 1,
  },
  bugFieldValue: { fontSize: 8, color: C.text },
  bugEnvRow: {
    flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 4,
    backgroundColor: C.bg, borderRadius: 3, padding: 6,
  },
  bugEnvItem: { fontSize: 7, color: C.muted },
  // ── Tester table ─────────────────────────────────────────────────────────
  tRow: {
    flexDirection: "row", borderBottomWidth: 1,
    borderBottomColor: C.border, paddingVertical: 5, paddingHorizontal: 4,
  },
  tHeader: { backgroundColor: C.primaryLight },
  tCell: { fontSize: 8 },
  // ── Moderator report card ─────────────────────────────────────────────────
  modCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: 5,
    marginBottom: 10, overflow: "hidden",
  },
  modCardHeader: {
    backgroundColor: C.primaryLight, padding: 8,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  modCardTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primaryMid },
  modCardBody: { padding: 10 },
  modCardField: { marginBottom: 6 },
  modCardLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", marginBottom: 1,
  },
  modCardValue: { fontSize: 8, color: C.text },
  modStatRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  modStatBox: {
    flex: 1, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, padding: 6, alignItems: "center",
  },
  modStatNum: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.primaryMid },
  modStatLabel: { fontSize: 7, color: C.muted },
  // ── Prose block ──────────────────────────────────────────────────────────
  proseBox: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, padding: 10, marginBottom: 8,
  },
  proseText: { fontSize: 9, color: C.text, lineHeight: 1.6 },
});

// ─── Shared components ────────────────────────────────────────────────────────

function PageHeader({
  title,
  subtitle,
  projectName,
  generatedAt,
}: {
  title: string;
  subtitle?: string;
  projectName: string;
  generatedAt: Date;
}) {
  return (
    <View style={s.header}>
      {/* Brand row */}
      <View style={s.headerBrand}>
        <View style={s.headerBrandDot} />
        <Text style={s.headerBrandText}>DZTESTERS</Text>
      </View>
      <View style={s.headerDivider} />
      {/* Report title */}
      <Text style={s.headerTitle}>{title}</Text>
      {/* Project label */}
      <Text style={s.headerProjectLabel}>Project</Text>
      <Text style={s.headerProjectName}>{projectName}</Text>
      {subtitle ? <Text style={{ fontSize: 8, color: "#94a3b8" }}>{subtitle}</Text> : null}
      {/* Date pushed down */}
      <Text style={s.headerMeta}>
        Generated on {generatedAt.toLocaleDateString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
        })}
      </Text>
    </View>
  );
}

function PageFooter({ campaignName, generatedAt }: { campaignName: string; generatedAt: Date }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>DzTesters · {campaignName}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
      <Text style={s.footerText}>{generatedAt.toLocaleDateString()}</Text>
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
  return items.reduce((acc, item) => {
    const k = key(item) || "Unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function topEntries(map: Record<string, number>, max = 10): [string, number][] {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, max);
}

// ─── PDF Document ────────────────────────────────────────────────────────────

function ReportDocument({ data }: { data: CampaignReportData }) {
  const approved = data.bugReports;
  const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

  const severityCounts = countBy(approved, (b) => b.severity);
  const countryCounts  = countBy(approved, (b) => {
    const code = b.environment?.country ?? b.tester.country ?? "Unknown";
    return code !== "Unknown" ? codeToCountryName(code) : "Unknown";
  });
  const deviceCounts   = countBy(approved, (b) => b.environment?.device ?? "Unknown");
  const errorCounts    = countBy(approved, (b) =>
    (b.errorType ?? "Other").replace(/optional/gi, "").replace(/\([^)]*\)/g, "").trim() || "Other",
  );

  const testerMap = new Map<string, { name: string; isCertified: boolean; bugCount: number }>();
  for (const bug of approved) {
    const prev = testerMap.get(bug.tester.name) ?? { name: bug.tester.name, isCertified: bug.tester.isCertified, bugCount: 0 };
    testerMap.set(bug.tester.name, { ...prev, bugCount: prev.bugCount + 1 });
  }
  const testerRows = Array.from(testerMap.values()).sort((a, b) => b.bugCount - a.bugCount);

  return (
    <Document
      title={data.editable.reportTitle || `Test Report — ${data.projectName}`}
      author="DzTesters Platform"
      subject="Campaign Final Report"
      creator="DzTesters"
    >
      {/* ── Page 1: Cover ──────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />
        <PageHeader
          title={data.editable.reportTitle || "Campaign Test Report"}
          projectName={data.projectName}
          generatedAt={data.generatedAt}
        />
        <View style={s.pageBody}>

          {/* Summary boxes */}
          <View style={s.summaryRow}>
            {(["CRITICAL","HIGH","MEDIUM","LOW"] as const).map((sev) => (
              <View key={sev} style={[s.summaryBox, { backgroundColor: severityColour(sev) }]}>
                <Text style={s.summaryNumber}>{severityCounts[sev] ?? 0}</Text>
                <Text style={s.summaryLabel}>{sev}</Text>
              </View>
            ))}
            <View style={[s.summaryBox, { backgroundColor: C.primaryMid }]}>
              <Text style={s.summaryNumber}>{approved.length}</Text>
              <Text style={s.summaryLabel}>Total Validated</Text>
            </View>
            <View style={[s.summaryBox, { backgroundColor: "#374151" }]}>
              <Text style={s.summaryNumber}>{data.testerCount}</Text>
              <Text style={s.summaryLabel}>Testers</Text>
            </View>
          </View>

          {/* Executive summary */}
          {data.editable.executiveSummary ? (
            <>
              <Text style={s.sectionTitle}>Executive Summary</Text>
              <View style={s.proseBox}>
                <Text style={s.proseText}>{data.editable.executiveSummary}</Text>
              </View>
            </>
          ) : null}

          {/* Scope */}
          {data.editable.scope ? (
            <>
              <Text style={s.sectionTitle}>Test Scope</Text>
              <View style={s.proseBox}>
                <Text style={s.proseText}>{data.editable.scope}</Text>
              </View>
            </>
          ) : null}

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
            <InfoCell label="Start Date" value={data.startDate ? data.startDate.toLocaleDateString() : "—"} />
            <InfoCell label="End Date" value={data.endDate ? data.endDate.toLocaleDateString() : "—"} />
            <InfoCell label="Client" value={`${data.client.name} (${data.client.email})`} />
            <InfoCell label="Test Manager" value={data.testManager ? `${data.testManager.name} (${data.testManager.email})` : "Not assigned"} />
          </View>

          {/* Conclusions */}
          {data.editable.conclusions ? (
            <>
              <Text style={s.sectionTitle}>Conclusions</Text>
              <View style={s.proseBox}>
                <Text style={s.proseText}>{data.editable.conclusions}</Text>
              </View>
            </>
          ) : null}

          {/* Recommendations */}
          {data.editable.recommendations ? (
            <>
              <Text style={s.sectionTitle}>Recommendations</Text>
              <View style={s.proseBox}>
                <Text style={s.proseText}>{data.editable.recommendations}</Text>
              </View>
            </>
          ) : null}
        </View>
      </Page>

      {/* ── Page 2: Bug Statistics ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />
        <PageHeader title="Bug Statistics" projectName={data.projectName} generatedAt={data.generatedAt} />
        <View style={s.pageBody}>

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
                  <Text style={[s.statsCell, { width: "40%", color: C.muted }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>

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
                <Text style={[s.statsCell, { width: "25%", color: C.muted }]}>
                  {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
                </Text>
              </View>
            ))}
          </View>

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
                <Text style={[s.statsCell, { width: "25%", color: C.muted }]}>
                  {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
                </Text>
              </View>
            ))}
          </View>

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
                <Text style={[s.statsCell, { width: "25%", color: C.muted }]}>
                  {approved.length > 0 ? ((count / approved.length) * 100).toFixed(1) : "0.0"}%
                </Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Tester Participation</Text>
          <View>
            <View style={[s.tRow, s.tHeader]}>
              <Text style={[s.tCell, { width: "50%", fontFamily: "Helvetica-Bold" }]}>Tester</Text>
              <Text style={[s.tCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>Certified</Text>
              <Text style={[s.tCell, { width: "30%", fontFamily: "Helvetica-Bold" }]}>Approved Bugs</Text>
            </View>
            {testerRows.length === 0 ? (
              <View style={s.tRow}>
                <Text style={[s.tCell, { color: C.muted }]}>No testers contributed yet.</Text>
              </View>
            ) : testerRows.map((row) => (
              <View key={row.name} style={s.tRow}>
                <Text style={[s.tCell, { width: "50%" }]}>{row.name}</Text>
                <Text style={[s.tCell, { width: "20%" }]}>{row.isCertified ? "✓ Yes" : "No"}</Text>
                <Text style={[s.tCell, { width: "30%" }]}>{row.bugCount}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ── Pages 4+: Bug Catalogue ─────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PageFooter campaignName={data.projectName} generatedAt={data.generatedAt} />
        <PageHeader
          title="Validated Bug Catalogue"
          subtitle={`${approved.length} approved bug${approved.length !== 1 ? "s" : ""}`}
          projectName={data.projectName}
          generatedAt={data.generatedAt}
        />
        <View style={s.pageBody}>
          {approved.length === 0 ? (
            <Text style={{ color: C.muted, fontSize: 9 }}>No approved bugs recorded yet.</Text>
          ) : null}
          {approved.map((bug, idx) => (
            <View key={bug.id} style={[s.bugCard, { borderColor: severityColour(bug.severity) }]} wrap={false}>
              <View style={[s.bugCardHeader, { backgroundColor: `${severityColour(bug.severity)}18` }]}>
                <Text style={{ fontSize: 8, color: C.muted, minWidth: 22 }}>#{idx + 1}</Text>
                <View style={[s.severityBadge, { backgroundColor: severityColour(bug.severity) }]}>
                  <Text style={s.severityText}>{bug.severity}</Text>
                </View>
                <Text style={s.bugTitle}>{bug.title}</Text>
                <Text style={{ fontSize: 7, color: C.muted }}>{bug.createdAt.toLocaleDateString()}</Text>
              </View>
              <View style={s.bugBody}>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    {bug.pageUrl ? <View style={s.bugField}><Text style={s.bugFieldLabel}>Page / URL</Text><Text style={s.bugFieldValue}>{bug.pageUrl}</Text></View> : null}
                    {bug.errorType ? <View style={s.bugField}><Text style={s.bugFieldLabel}>Error Type</Text><Text style={s.bugFieldValue}>{bug.errorType}</Text></View> : null}
                    <View style={s.bugField}><Text style={s.bugFieldLabel}>Description</Text><Text style={s.bugFieldValue}>{bug.description}</Text></View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.bugField}><Text style={s.bugFieldLabel}>Steps to Reproduce</Text><Text style={s.bugFieldValue}>{bug.reproductionSteps}</Text></View>
                    {bug.moderationNotes ? <View style={s.bugField}><Text style={s.bugFieldLabel}>Moderator Notes</Text><Text style={[s.bugFieldValue, { color: C.muted }]}>{bug.moderationNotes}</Text></View> : null}
                  </View>
                </View>
                <View style={s.bugEnvRow}>
                  {bug.environment?.device ? <Text style={s.bugEnvItem}>📱 {bug.environment.device}</Text> : null}
                  {bug.environment?.osVersion ? <Text style={s.bugEnvItem}>🖥 {bug.environment.osVersion}</Text> : null}
                  {bug.environment?.browser ? <Text style={s.bugEnvItem}>🌐 {bug.environment.browser}</Text> : null}
                  {bug.environment?.country ? <Text style={s.bugEnvItem}>📍 {codeToCountryName(bug.environment.country)}</Text> : null}
                  {bug.environment?.screenResolution ? <Text style={s.bugEnvItem}>🔲 {bug.environment.screenResolution}</Text> : null}
                  <Text style={s.bugEnvItem}>👤 {bug.tester.name}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateCampaignReportPdf(data: CampaignReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}
