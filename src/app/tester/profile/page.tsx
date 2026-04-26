import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterProfilePage() {
  const session = await requireSession(["TESTER"]);
  const tester = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    include: { devices: { orderBy: { createdAt: "desc" } } },
  });

  const device = tester.devices[0] ?? null;
  const browser =
    device && Array.isArray(device.browsers) ? String(device.browsers[0] ?? "") : "";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Profile"
        title="Tester profile"
        description="Your testing info is used for campaign matching and is attached to every bug report you submit."
        action={
          <Link href="/tester/setup">
            <Button>Edit testing info</Button>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Account</h2>
          <p className="text-sm leading-7 text-stone-600">Name: {tester.name}</p>
          <p className="text-sm leading-7 text-stone-600">Email: {tester.email}</p>
          <p className="text-sm leading-7 text-stone-600">Country: {tester.country ?? "Not set"}</p>
          <p className="text-sm leading-7 text-stone-600">Tester type: {tester.testerKind ?? "Not set"}</p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Current device</h2>
          {device ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-900">{device.deviceName}</p>
              <p className="text-sm text-stone-600">OS: {device.osVersion}</p>
              <p className="text-sm text-stone-600">Browser: {browser || "Not set"}</p>
              <p className="text-sm text-stone-600">Resolution: {device.screenResolution}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-600">No device info yet. Use &quot;Edit testing info&quot;.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
