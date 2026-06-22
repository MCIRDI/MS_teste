/**
 * POST /api/campaigns/[campaignId]/generate-report
 *
 * Generates a PDF final report for a campaign from its data.
 *
 * Query params:
 *   ?save=1   — also persists the PDF to disk and creates a FinalReport record
 *               (TEST_MANAGER only when saving; any authorised user can just preview)
 *
 * Authorization:
 *   - ADMIN: always allowed
 *   - TEST_MANAGER: must be assigned to the campaign
 *   - CLIENT: must own the campaign (preview only, ?save=1 blocked)
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUploadDirectories } from "@/lib/upload";
import { generateCampaignReportPdf, type CampaignReportData } from "@/lib/pdf/report-generator";
import { BugStatus } from "@/generated/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { campaignId } = await params;
  const url = new URL(_req.url);
  const shouldSave = url.searchParams.get("save") === "1";

  // ── Fetch campaign ──────────────────────────────────────────────────────────
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      testManager: { select: { id: true, name: true, email: true } },
      assignments: { select: { userId: true, assignmentRole: true } },
      bugReports: {
        where: { status: BugStatus.APPROVED },
        include: {
          tester: {
            select: { name: true, country: true, isCertified: true },
          },
        },
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!campaign) {
    return new Response("Campaign not found", { status: 404 });
  }

  // ── Authorisation ────────────────────────────────────────────────────────────
  const role = session.role;
  let allowed = false;

  if (role === "ADMIN") {
    allowed = true;
  } else if (role === "TEST_MANAGER") {
    allowed = campaign.testManagerId === session.id;
  } else if (role === "CLIENT") {
    // Clients can preview but not save
    allowed = campaign.clientId === session.id && !shouldSave;
  }

  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  // ── Build data object ────────────────────────────────────────────────────────
  const testerCount = campaign.assignments.filter(
    (a) => a.assignmentRole === "CROWD_TESTER" || a.assignmentRole === "CERT_TESTER",
  ).length;

  const reportData: CampaignReportData = {
    id: campaign.id,
    projectName: campaign.projectName,
    description: campaign.description,
    softwareType: campaign.softwareType,
    websiteUrl: campaign.websiteUrl,
    targetCountries: campaign.targetCountries,
    selectedPlatforms: campaign.selectedPlatforms,
    selectedBrowsers: campaign.selectedBrowsers,
    stage: campaign.stage,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    estimatedCost: campaign.estimatedCost,
    currency: campaign.currency,
    crowdTesterCount: campaign.crowdTesterCount,
    certTesterCount: campaign.certTesterCount,
    client: campaign.client,
    testManager: campaign.testManager,
    testerCount,
    generatedAt: new Date(),
    editable: {
      reportTitle:      `Test Report — ${campaign.projectName}`,
      executiveSummary: "",
      scope:            `Platforms: ${campaign.selectedPlatforms.join(", ") || "All"}. Countries: ${campaign.targetCountries.join(", ") || "All"}.`,
      conclusions:      "",
      recommendations:  "",
    },
    bugReports: campaign.bugReports.map((bug) => ({
      id: bug.id,
      title: bug.title,
      severity: bug.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      status: bug.status,
      errorType: bug.errorType,
      feature: bug.feature,
      pageUrl: bug.pageUrl,
      description: bug.description,
      reproductionSteps: bug.reproductionSteps,
      moderationNotes: bug.moderationNotes,
      environment: (bug.environment as Record<string, string>) ?? {},
      tester: bug.tester,
      createdAt: bug.createdAt,
    })),
  };

  // ── Generate PDF ─────────────────────────────────────────────────────────────
  const pdfBuffer = await generateCampaignReportPdf(reportData);
  const safeProjectName = campaign.projectName
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
  const filename = `report_${safeProjectName}_${Date.now()}.pdf`;

  // ── Optionally save to disk and DB ───────────────────────────────────────────
  if (shouldSave && (role === "ADMIN" || role === "TEST_MANAGER")) {
    await ensureUploadDirectories();
    const storedName = `${randomUUID()}.pdf`;
    const absolutePath = path.join(process.cwd(), "uploads", "reports", storedName);
    await writeFile(absolutePath, pdfBuffer);

    await prisma.finalReport.create({
      data: {
        campaignId: campaign.id,
        uploadedById: session.id,
        originalName: filename,
        storedName,
        relativePath: path.posix.join("uploads", "reports", storedName),
        mimeType: "application/pdf",
        sizeBytes: pdfBuffer.byteLength,
      },
    });
  }

  // ── Stream PDF back to caller ────────────────────────────────────────────────
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
