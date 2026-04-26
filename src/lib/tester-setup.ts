import { prisma } from "@/lib/prisma";

export type TesterSetupState = {
  needsSetup: boolean;
  reason?: string;
};

export async function getTesterSetupState(userId: string): Promise<TesterSetupState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { devices: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!user) {
    return { needsSetup: true, reason: "Missing user." };
  }

  const device = user.devices[0] ?? null;
  const browser =
    device && Array.isArray(device.browsers) ? String(device.browsers[0] ?? "") : "";

  if (!user.country) return { needsSetup: true, reason: "Country is missing." };
  if (!device) return { needsSetup: true, reason: "Device is missing." };
  if (!device.deviceName) return { needsSetup: true, reason: "Device name is missing." };
  if (!device.osVersion || device.osVersion === "Not provided") return { needsSetup: true, reason: "OS version is missing." };
  if (!browser) return { needsSetup: true, reason: "Browser is missing." };
  if (!device.screenResolution || device.screenResolution === "Not provided") return { needsSetup: true, reason: "Screen resolution is missing." };

  return { needsSetup: false };
}

