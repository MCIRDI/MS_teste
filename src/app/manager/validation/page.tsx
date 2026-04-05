import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function ManagerValidationPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Validation"
        title="Final bug validation"
        description="Approved reports arrive here for final acceptance before they become visible in the client dashboard."
      />
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Validation tools</h2>
        <p className="text-sm leading-7 text-stone-600">Severity confirmation, business impact notes, prioritization, and final client-facing wording would be managed in this surface.</p>
      </Card>
    </div>
  );
}
