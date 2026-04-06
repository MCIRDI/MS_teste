import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterProfilePage() {
  const session = await requireSession(["TESTER"]);
  const tester = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    include: { devices: true },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Profile"
        title="Tester profile and device inventory"
        description="Profiles capture country, language, experience, and device details that feed the campaign matching workflow."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Profile</h2>
          <p className="text-sm leading-7 text-stone-600">Name: {tester.name}</p>
          <p className="text-sm leading-7 text-stone-600">Email: {tester.email}</p>
          <p className="text-sm leading-7 text-stone-600">Country: {tester.country ?? "Not set"}</p>
          <p className="text-sm leading-7 text-stone-600">Language: {tester.language ?? "Not set"}</p>
          <p className="text-sm leading-7 text-stone-600">Tester type: {tester.testerKind ?? "Not set"}</p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Device inventory</h2>
          {tester.devices.map((device) => (
            <div key={device.id} className="rounded-2xl bg-stone-100 p-4">
              <p className="text-sm font-medium text-stone-900">{device.deviceName}</p>
              <p className="text-sm text-stone-600">{device.osVersion}</p>
              <p className="text-sm text-stone-600">{device.screenResolution}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
