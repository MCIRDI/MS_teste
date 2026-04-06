import Link from "next/link";

import { acceptInvitationAction } from "@/app/actions/campaigns";
import { requireSession } from "@/lib/auth";
import { getTesterDashboardData } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function TesterCampaignsPage() {
  const session = await requireSession(["TESTER"]);
  const data = await getTesterDashboardData(session.id);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <SectionHeading
        eyebrow="Invitations"
        title="Available campaigns"
        description="These invitations come from actual campaign matching and move into your workspace after acceptance."
      />
      <div className="grid gap-5">
        {data.invitations.map((invitation) => (
          <Card key={invitation.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-stone-900">{invitation.campaign.projectName}</h2>
              <p className="text-sm text-stone-600">
                {invitation.campaign.crowdTesterCount} crowd testers · {invitation.campaign.developerTesterCount} developer testers
              </p>
              <p className="text-sm leading-7 text-stone-600">{invitation.campaign.description}</p>
            </div>
            {invitation.status === "ACCEPTED" ? (
              <Link href={`/tester/workspace/${invitation.campaignId}`}>
                <Button>Open workspace</Button>
              </Link>
            ) : (
              <form action={acceptInvitationAction}>
                <input type="hidden" name="invitationId" value={invitation.id} />
                <Button type="submit">Accept invitation</Button>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
