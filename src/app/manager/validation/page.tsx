import { validateBugReportAction } from "@/app/actions/bugs";
import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ManagerValidationPage() {
  const session = await requireSession(["TEST_MANAGER"]);
  const data = await getManagerDashboardData(session.id);
  const approvedBugs = data.bugReports.filter((bug) => bug.status === "APPROVED");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Validation"
        title="Final bug validation"
        description="Approved reports arrive here for final acceptance before they become visible in the client dashboard."
      />
      <div className="grid gap-4">
        {approvedBugs.map((bug) => (
          <Card key={bug.id} className="space-y-3">
            <h2 className="font-serif text-2xl text-stone-900">{bug.title}</h2>
            <p className="text-sm text-stone-600">{bug.severity} severity</p>
            <p className="text-sm leading-7 text-stone-600">{bug.description}</p>
            <form action={validateBugReportAction} className="space-y-2">
              <input type="hidden" name="bugReportId" value={bug.id} />
              <textarea
                name="validationNotes"
                className="min-h-20 w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm"
                placeholder="Validation notes"
              />
              <button className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white" type="submit">
                Validate bug
              </button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
