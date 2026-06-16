"use server";

import { CountrySource } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirectTo } from "@/lib/redirect";

import { requireSession } from "@/lib/auth";
import { isValidCountrySource } from "@/lib/country-source";
import { prisma } from "@/lib/prisma";

export async function saveCountryAction(input: { country: string; countrySource: CountrySource }) {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);
  const country = input.country.trim();

  if (!country) {
    throw new Error("Country is required.");
  }

  if (!isValidCountrySource(input.countrySource) || input.countrySource === "ADMIN") {
    throw new Error("Invalid country source.");
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      country,
      countrySource: input.countrySource,
    },
  });

  revalidatePath("/tester/profile");
  revalidatePath("/tester/campaigns");
  revalidatePath("/admin/users");
}

export async function updateTesterInfoAction(
  _prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  const country = String(formData.get("country") ?? "").trim();
  const countrySourceRaw = String(formData.get("countrySource") ?? "MANUAL");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const osVersion = String(formData.get("osVersion") ?? "").trim();
  const browser = String(formData.get("browser") ?? "").trim();
  const screenResolution = String(formData.get("screenResolution") ?? "").trim();

  if (!country) {
    return { success: false, message: "Please select your country." };
  }

  if (!isValidCountrySource(countrySourceRaw) || countrySourceRaw === "ADMIN") {
    return { success: false, message: "Invalid country source." };
  }

  if (!deviceName || !osVersion || !browser || !screenResolution) {
    return { success: false, message: "Device info is incomplete." };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      country,
      countrySource: countrySourceRaw,
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
  revalidatePath("/admin/users");

  return { success: true, message: "Testing info updated." };
}

export async function saveTesterSetupAction(formData: FormData) {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);

  const country = String(formData.get("country") ?? "").trim();
  const countrySourceRaw = String(formData.get("countrySource") ?? "MANUAL");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const osVersion = String(formData.get("osVersion") ?? "").trim();
  const browser = String(formData.get("browser") ?? "").trim();
  const screenResolution = String(formData.get("screenResolution") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  if (!country || !deviceName || !osVersion || !browser || !screenResolution) {
    return await redirectTo(`/tester/setup?next=${encodeURIComponent(next || "/tester/campaigns")}`);
  }

  const countrySource = isValidCountrySource(countrySourceRaw) && countrySourceRaw !== "ADMIN"
    ? countrySourceRaw
    : CountrySource.MANUAL;

  await prisma.user.update({
    where: { id: session.id },
    data: {
      country,
      countrySource,
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
  revalidatePath("/admin/users");

  return await redirectTo(next && next.startsWith("/tester") ? next : "/tester/campaigns");
}
