import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function TesterProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Profile"
        title="Tester profile and device inventory"
        description="Profiles capture country, language, experience, and device details that feed the campaign matching workflow."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Profile fields</h2>
          <p className="text-sm leading-7 text-stone-600">Name, country, language, testing experience, and preferred testing areas.</p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Device inventory</h2>
          <p className="text-sm leading-7 text-stone-600">Device name, OS version, browser list, and screen resolution for each available test device.</p>
        </Card>
      </div>
    </div>
  );
}
