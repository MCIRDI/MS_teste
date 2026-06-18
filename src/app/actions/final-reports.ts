"use server";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload, ensureUploadDirectories } from "@/lib/upload";
import { generateCampaignReportPdf, type CampaignReportData } from "@/lib/pdf/report-generator";
import { BugStatus } from "@/generated/prisma";

export async function uploadFinalReportAction(formData: FormData) {
  const session = await requireSession(["TEST_MANAGER"]);

  const campaignId = String(formData.get("campaignId") ?? "");
  const file = formData.get("pdf") as File | null;

  if (!campaignId || !file || !(file instanceof File) || file.size === 0) {
    return;
  }

  if (file.type !== "application/pdf") {
    return;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, testManagerId: true, clientId: true },
  });

  if (!campaign || campaign.testManagerId !== session.id) {
    return;
  }

  const uploaded = await saveUpload(file, "reports");

  await prisma.finalReport.create({
    data: {
      campaignId,
      uploadedById: session.id,
      originalName: uploaded.originalName,
      storedName: uploaded.storedName,
      relativePath: uploaded.relativePath,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
    },
  });

  revalidatePath("/manager/reports");
  revalidatePath("/client/reports");
  revalidatePath(`/client/dashboard`);
  return await redirectTo("/manager/reports");
}


/**
 * Generates a PDF final report from campaign data, saves it to disk,
 * creates a FinalReport record, and redirects back to the manager reports page.
 *
 * Only the assigned TEST_MANAGER (or ADMIN) may call this.
 */
export async function generateFinalReportAction(formData: FormData) {
  const session = await requireSession(["TEST_MANAGER", "ADMIN"]);
  const campaignId = String(formData.get("campaignId") ?? "");

  if (!campaignId) return;

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

  if (!campaign) return;

  // Only the assigned manager or admin may generate
  if (session.role === "TEST_MANAGER" && campaign.testManagerId !== session.id) return;

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

  const pdfBuffer = await generateCampaignReportPdf(reportData);

  const safeProjectName = campaign.projectName
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
  const originalName = `report_${safeProjectName}_${Date.now()}.pdf`;
  const storedName = `${randomUUID()}.pdf`;

  await ensureUploadDirectories();
  const absolutePath = path.join(process.cwd(), "uploads", "reports", storedName);
  await writeFile(absolutePath, pdfBuffer);

  await prisma.finalReport.create({
    data: {
      campaignId: campaign.id,
      uploadedById: session.id,
      originalName,
      storedName,
      relativePath: path.posix.join("uploads", "reports", storedName),
      mimeType: "application/pdf",
      sizeBytes: pdfBuffer.byteLength,
    },
  });

  revalidatePath("/manager/reports");
  revalidatePath("/client/reports");
  revalidatePath("/client/dashboard");
  return await redirectTo("/manager/reports");
}
