import { CampaignForm } from "@/components/forms/campaign-form";
import { SectionHeading } from "@/components/sections/section-heading";

export default function ClientCampaignNewPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="New campaign"
        title="Create a testing campaign"
        description="Define the scope, target countries, tester counts, required devices, and task list. Pricing is estimated before the campaign is sent into the approval workflow."
      />
      <CampaignForm />
    </div>
  );
}
