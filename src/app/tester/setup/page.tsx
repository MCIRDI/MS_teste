import Link from "next/link";
import { redirect } from "next/navigation";

import { saveTesterSetupAction } from "@/app/actions/tester-setup";
import { requireSession } from "@/lib/auth";
import { getTesterSetupState } from "@/lib/tester-setup";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await requireSession(["TESTER"]);
  const { next } = await searchParams;

  const state = await getTesterSetupState(session.id);
  if (!state.needsSetup && (!next || next === "/tester/setup")) {
    redirect("/tester/campaigns");
  }

  const tester = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    include: { devices: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const device = tester.devices[0] ?? null;
  const browser =
    device && Array.isArray(device.browsers) ? String(device.browsers[0] ?? "") : "";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Setup"
        title="Complete your testing info"
        description="We use your country and device details to match you to campaigns and auto-fill bug environment data."
        action={
          <Link href="/tester/profile">
            <Button variant="secondary">View profile</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
        <form action={saveTesterSetupAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="country">
              Country
            </label>
            <Input id="country" name="country" defaultValue={tester.country ?? ""} placeholder="United States" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="deviceName">
              Device
            </label>
            <Input id="deviceName" name="deviceName" defaultValue={device?.deviceName ?? ""} placeholder="Pixel 7" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="osVersion">
              OS version
            </label>
            <Input id="osVersion" name="osVersion" defaultValue={device?.osVersion === "Not provided" ? "" : device?.osVersion ?? ""} placeholder="Android 13" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="browser">
              Browser
            </label>
            <Input id="browser" name="browser" defaultValue={browser} placeholder="Chrome 123" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="screenResolution">
              Screen resolution
            </label>
            <Input
              id="screenResolution"
              name="screenResolution"
              defaultValue={device?.screenResolution === "Not provided" ? "" : device?.screenResolution ?? ""}
              placeholder="1080x2400"
              required
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save testing info</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

