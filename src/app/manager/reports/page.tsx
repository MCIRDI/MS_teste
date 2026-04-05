import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function ManagerReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery"
        title="Final reports"
        description="Test managers compile bug trends, tester participation, device coverage, and country reach into the final campaign output."
      />
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Report generation</h2>
        <p className="text-sm leading-7 text-stone-600">The report area is structured for executive summaries, raw defect exports, and coverage notes that can be handed directly to the client team.</p>
      </Card>
    </div>
  );
}
