import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ModeratorCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Campaign moderation"
        title={`Moderation details for ${campaignId}`}
        description="One moderator is required for every fifty testers. This area is reserved for report triage, duplicate linking, and tester feedback."
      />
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Moderation checklist</h2>
        <p className="text-sm leading-7 text-stone-600">Check reproduction quality, confirm environment details, flag duplicates, and route approved issues to the assigned test manager.</p>
      </Card>
    </div>
  );
}
