import Link from "next/link";

import { testerSnapshot } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function TesterCampaignsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Invitations"
        title="Available campaigns"
        description="Eligible testers receive invitations based on devices, operating systems, browsers, country, and tester specialization."
      />
      <div className="grid gap-5">
        {testerSnapshot.invitations.map((invitation) => (
          <Card key={invitation.campaignId} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-stone-900">{invitation.project}</h2>
              <p className="text-sm text-stone-600">{invitation.testerType}</p>
              <p className="text-sm leading-7 text-stone-600">{invitation.focus}</p>
              <p className="text-sm text-stone-500">{invitation.countries}</p>
            </div>
            <Link href={`/tester/workspace/${invitation.campaignId}`}>
              <Button>Open workspace</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
