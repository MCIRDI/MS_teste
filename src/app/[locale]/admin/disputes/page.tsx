import { resolveDisputeAction } from "@/app/actions/disputes";
import { requireSession } from "@/lib/auth";
import { getAdminDisputes } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminDisputesPage() {
  await requireSession(["ADMIN"]);
  const disputes = await getAdminDisputes();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Escalations"
        title="Escalated disputes"
        description="Final decisions on disputes escalated by moderators."
      />

      {disputes.length === 0 ? (
        <Card variant="muted" className="border-dashed">
          <CardSection className="py-10 text-center text-sm text-slate-600">
            No escalated disputes.
          </CardSection>
        </Card>
      ) : (
        disputes.map((dispute) => (
          <Card key={dispute.id} padding="none">
            <CardHeader>
              <CardTitle>{dispute.bugReport.title}</CardTitle>
              <CardDescription>
                {dispute.bugReport.campaign.projectName} · Escalated{" "}
                {dispute.escalatedAt?.toLocaleString() ?? "—"}
              </CardDescription>
            </CardHeader>
            <CardSection className="space-y-4 border-t border-slate-100/90">
              <p className="text-sm text-slate-700">{dispute.reason}</p>
              <form action={resolveDisputeAction} className="space-y-3">
                <input type="hidden" name="disputeId" value={dispute.id} />
                <Textarea name="resolution" placeholder="Final decision notes" required />
                <div className="flex gap-2">
                  <Button type="submit" name="decision" value="maintain">
                    Maintain bug
                  </Button>
                  <Button type="submit" name="decision" value="reject" variant="secondary">
                    Reject bug
                  </Button>
                </div>
              </form>
            </CardSection>
          </Card>
        ))
      )}
    </div>
  );
}
