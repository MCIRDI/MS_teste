import { moderateBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { getModeratorDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default async function ModeratorReviewQueuePage() {
  const session = await requireSession(["MODERATOR"]);
  const data = await getModeratorDashboardData(session.id);

  return (
    <div className="space-y-6">
      <StatGrid items={data.stats} />
      <SectionHeading
        eyebrow="Queue"
        title="Bug review queue"
        description="Moderators review quality, check for duplicates, and move approved bugs toward final validation."
      />
      <div className="grid gap-5">
        {data.bugReports.map((bug) => (
          <Card key={bug.id} className="grid gap-4 md:grid-cols-[1fr_2fr_1.2fr]">
            <div>
              <p className="text-sm text-stone-500">Report</p>
              <p className="mt-2 font-semibold text-stone-900">{bug.title}</p>
              <p className="mt-2 text-sm text-stone-600">{bug.tester.name}</p>
            </div>
            <div>
              <p className="text-sm text-stone-500">Details</p>
              <p className="mt-2 text-stone-900">{bug.description}</p>
              <p className="mt-2 text-sm text-stone-600">{bug.severity} severity</p>
            </div>
            <form action={moderateBugReportAction} className="space-y-2">
              <input type="hidden" name="bugReportId" value={bug.id} />
              <textarea
                name="moderationNotes"
                className="min-h-20 w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm"
                placeholder="Optional moderation notes"
              />
              <div className="flex gap-2">
                <button className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white" type="submit" name="decision" value="APPROVED">
                  Approve
                </button>
                <button className="rounded-full bg-stone-200 px-4 py-2 text-sm text-stone-900" type="submit" name="decision" value="REJECTED">
                  Reject
                </button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
