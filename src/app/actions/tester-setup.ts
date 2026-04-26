"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveTesterSetupAction(formData: FormData) {
  const session = await requireSession(["TESTER"]);

  const country = String(formData.get("country") ?? "").trim();
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const osVersion = String(formData.get("osVersion") ?? "").trim();
  const browser = String(formData.get("browser") ?? "").trim();
  const screenResolution = String(formData.get("screenResolution") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  if (!country || !deviceName || !osVersion || !browser || !screenResolution) {
    redirect(`/tester/setup?next=${encodeURIComponent(next || "/tester/campaigns")}`);
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      country,
    },
  });

  const existing = await prisma.device.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: {
        deviceName,
        osVersion,
        browsers: [browser],
        screenResolution,
      },
    });
  } else {
    await prisma.device.create({
      data: {
        userId: session.id,
        deviceName,
        osVersion,
        browsers: [browser],
        screenResolution,
      },
    });
  }

  revalidatePath("/tester/profile");
  revalidatePath("/tester/campaigns");
  revalidatePath("/tester/bugs/new");

  redirect(next && next.startsWith("/tester") ? next : "/tester/campaigns");
}
