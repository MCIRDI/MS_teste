import {
  escalateDisputeAction,
  resolveDisputeAction,
} from "@/app/actions/disputes";
import { requireSession } from "@/lib/auth";
import { getModeratorDisputes } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { Textarea } from "@/components/ui/textarea";

export default async function ModeratorDisputesPage() {
  const session = await requireSession(["MODERATOR"]);
  const disputes = await getModeratorDisputes(session.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Disputes"
        title="Disputed bug reports"
        description="Review client disputes on approved bugs and maintain or overturn the moderation decision."
      />

      {disputes.length === 0 ? (
        <Card variant="muted" className="border-dashed">
          <CardSection className="py-10 text-center text-sm text-slate-600">
            No open disputes at the moment.
          </CardSection>
        </Card>
      ) : (
        disputes.map((dispute) => (
          <Card key={dispute.id} padding="none">
            <CardHeader>
              <CardTitle>{dispute.bugReport.title}</CardTitle>
              <CardDescription>
                Campaign: {dispute.bugReport.campaign.projectName} · Tester: {dispute.bugReport.tester.name} ·{" "}
                {dispute.status}
              </CardDescription>
            </CardHeader>
            <CardSection className="space-y-4 border-t border-slate-100/90">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Client reason:</span> {dispute.reason}
              </p>
              <form action={resolveDisputeAction} className="space-y-3 rounded-xl border border-slate-200 p-4">
                <input type="hidden" name="disputeId" value={dispute.id} />
                <Textarea
                  name="resolution"
                  placeholder="Resolution notes"
                  required
                  className="min-h-20"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="maintain">
                    Maintain bug
                  </Button>
                  <Button type="submit" name="decision" value="reject" variant="secondary">
                    Reject bug
                  </Button>
                </div>
              </form>
              {dispute.status === "OPEN" ? (
                <form action={escalateDisputeAction}>
                  <input type="hidden" name="disputeId" value={dispute.id} />
                  <Button type="submit" variant="ghost">
                    Escalate to admin
                  </Button>
                </form>
              ) : null}
            </CardSection>
          </Card>
        ))
      )}
    </div>
  );
}
