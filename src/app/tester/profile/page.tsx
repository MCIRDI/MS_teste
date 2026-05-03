import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardMeta, CardMetaItem, CardSection, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Identity and tester classification</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <CardMeta className="sm:grid-cols-1">
              <CardMetaItem label="Name">{tester.name}</CardMetaItem>
              <CardMetaItem label="Email">{tester.email}</CardMetaItem>
              <CardMetaItem label="Country">{tester.country ?? "Not set"}</CardMetaItem>
              <CardMetaItem label="Tester type">{tester.testerKind ?? "Not set"}</CardMetaItem>
            </CardMeta>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Current device</CardTitle>
            <CardDescription>Used for environment blocks on bug reports</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            {device ? (
              <CardMeta className="sm:grid-cols-1">
                <CardMetaItem label="Device">{device.deviceName}</CardMetaItem>
                <CardMetaItem label="OS">{device.osVersion}</CardMetaItem>
                <CardMetaItem label="Browser">{browser || "Not set"}</CardMetaItem>
                <CardMetaItem label="Resolution">{device.screenResolution}</CardMetaItem>
              </CardMeta>
            ) : (
              <p className="text-sm text-slate-600">No device info yet. Use &quot;Edit testing info&quot;.</p>
            )}
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
