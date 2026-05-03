import { Card, CardSection } from "@/components/ui/card";

const steps = [
  "Client creates a campaign and previews the estimated cost before launch.",
  "MS test assigns a test manager and calculates moderator needs based on tester counts.",
  "Eligible crowd testers and developer testers receive invitations based on country and device fit.",
  "Testers work through tasks and submit structured bugs with attachments and environment data.",
  "Moderators review duplicates and quality, then the test manager validates final reports for the client.",
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Workflow</p>
        <h1 className="font-serif text-5xl text-slate-900">From campaign setup to validated defect delivery.</h1>
      </div>
      <section className="mt-10 grid gap-3">
        {steps.map((step, index) => (
          <Card key={step} padding="none">
            <CardSection className="flex gap-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <p className="pt-1 text-sm leading-relaxed text-slate-700">{step}</p>
            </CardSection>
          </Card>
        ))}
      </section>
    </main>
  );
}
