import { moderatorSnapshot } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function ModeratorReviewQueuePage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Queue"
        title="Bug review queue"
        description="Moderators review quality, check for duplicates, and move approved bugs toward final validation."
      />
      <div className="grid gap-5">
        {moderatorSnapshot.queue.map((bug) => (
          <Card key={bug.id} className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-stone-500">Report</p>
              <p className="mt-2 font-semibold text-stone-900">{bug.id}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-stone-500">Title</p>
              <p className="mt-2 text-stone-900">{bug.title}</p>
            </div>
            <div>
              <p className="text-sm text-stone-500">Review notes</p>
              <p className="mt-2 text-stone-700">{bug.severity} severity · Duplicate risk {bug.duplicateRisk}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
