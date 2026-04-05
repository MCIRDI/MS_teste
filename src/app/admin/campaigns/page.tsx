import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Campaigns"
        title="Campaign monitoring"
        description="Admins track live campaigns, assignment balance, fraud signals, and moderation capacity across the platform."
      />
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Platform-wide monitoring</h2>
        <p className="text-sm leading-7 text-stone-600">This page is intended to consolidate campaign stages, tester volume, moderator ratios, and escalation signals into a single operational view.</p>
      </Card>
    </div>
  );
}
