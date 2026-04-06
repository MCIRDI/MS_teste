import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ModeratorCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await requireSession(["MODERATOR"]);
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      assignments: {
        where: {
          userId: session.id,
        },
      },
      bugReports: {
        include: {
          tester: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Campaign moderation"
        title={`Moderation details for ${campaign.projectName}`}
        description="One moderator is required for every fifty testers. This area is reserved for report triage, duplicate linking, and tester feedback."
      />
      <div className="grid gap-4">
        {campaign.bugReports.map((bug) => (
          <Card key={bug.id} className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">{bug.title}</h2>
            <p className="text-sm text-stone-600">{bug.tester.name} · {bug.status} · {bug.severity}</p>
            <p className="text-sm leading-7 text-stone-600">{bug.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
