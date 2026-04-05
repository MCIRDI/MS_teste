import Link from "next/link";

import { testerSnapshot } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function TesterWorkspacePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Workspace"
        title={`Campaign ${campaignId}`}
        description="Each workspace centralizes instructions, software access, testing tasks, and the bug submission flow."
        action={
          <Link href={`/tester/bugs/new?campaignId=${campaignId}`}>
            <Button>Submit bug</Button>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Campaign instructions</h2>
          <p className="text-sm leading-7 text-stone-600">
            Focus on account creation, browsing, checkout, invalid inputs, and unusual session transitions. Capture exact environment details for every issue.
          </p>
          <p className="text-sm leading-7 text-stone-600">
            Shared access URL: https://demo.mstest.local
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Testing tasks</h2>
          <ul className="space-y-3 text-sm leading-7 text-stone-600">
            {testerSnapshot.workspaceTasks.map((task) => (
              <li key={task} className="rounded-2xl bg-stone-100 px-4 py-3">
                {task}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
