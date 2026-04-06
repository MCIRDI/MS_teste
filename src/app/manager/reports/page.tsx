import { requireSession } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default async function ManagerReportsPage() {
  const session = await requireSession(["TEST_MANAGER"]);
  const data = await getManagerDashboardData(session.id);
  const validatedBugs = data.bugReports.filter((bug) => bug.status === "VALIDATED");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery"
        title="Final reports"
        description="Test managers compile bug trends, tester participation, device coverage, and country reach into the final campaign output."
      />
      <Card className="space-y-4">
        <h2 className="font-serif text-3xl text-stone-900">Validated bug output</h2>
        {validatedBugs.map((bug) => (
          <div key={bug.id} className="rounded-2xl bg-stone-100 p-4">
            <p className="font-medium text-stone-900">{bug.title}</p>
            <p className="text-sm text-stone-600">{bug.severity} severity</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
