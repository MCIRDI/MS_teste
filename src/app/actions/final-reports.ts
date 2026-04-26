"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/upload";

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
  redirect("/manager/reports");
}

