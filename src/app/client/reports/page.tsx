import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function ClientReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Reports"
        title="Campaign reporting"
        description="Final reports combine severity, device coverage, country coverage, and tester participation into a client-ready summary."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Coverage summary</h2>
          <p className="text-sm leading-7 text-stone-600">
            Devices tested: iPhone 15, Galaxy S24, Windows 11 laptop, macOS Sonoma desktop.
          </p>
          <p className="text-sm leading-7 text-stone-600">
            Countries reached: United States, Germany, Poland, Brazil.
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Discovery timeline</h2>
          <p className="text-sm leading-7 text-stone-600">
            Timeline and export features are designed to sit here once live campaign data is connected to the dashboard queries.
          </p>
        </Card>
      </div>
    </div>
  );
}
