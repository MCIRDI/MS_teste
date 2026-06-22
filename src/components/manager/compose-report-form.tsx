"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardDescription, CardHeader, CardSection, CardTitle,
} from "@/components/ui/card";
import type { ReportEditableFields } from "@/lib/pdf/report-generator";

type State = { success: boolean; message: string };
const INITIAL: State = { success: false, message: "" };

interface Props {
  campaignId: string;
  defaults: ReportEditableFields;
  action: (prevState: State, formData: FormData) => Promise<State>;
}

export function ComposeReportForm({ campaignId, defaults, action }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <Card padding="none">
      <CardHeader>
        <CardTitle>Report content</CardTitle>
        <CardDescription>
          All fields are pre-filled from campaign data. Edit anything before generating the PDF.
          Bug statistics, moderator reports, and the full bug catalogue are always included automatically.
        </CardDescription>
      </CardHeader>
      <CardSection className="border-t border-slate-100/90">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="campaignId" value={campaignId} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="reportTitle">
              Report title
            </label>
            <Input
              id="reportTitle"
              name="reportTitle"
              required
              defaultValue={defaults.reportTitle}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="executiveSummary">
              Executive summary
            </label>
            <p className="text-xs text-slate-500">
              High-level overview of the campaign results for the client.
            </p>
            <Textarea
              id="executiveSummary"
              name="executiveSummary"
              className="min-h-32"
              defaultValue={defaults.executiveSummary}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="scope">
              Test scope
            </label>
            <p className="text-xs text-slate-500">
              What was tested, which platforms and countries were targeted.
            </p>
            <Textarea
              id="scope"
              name="scope"
              defaultValue={defaults.scope}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="conclusions">
              Conclusions
            </label>
            <p className="text-xs text-slate-500">
              Overall quality assessment, risk level, and readiness for release.
            </p>
            <Textarea
              id="conclusions"
              name="conclusions"
              defaultValue={defaults.conclusions}
              placeholder="Based on the results, the application shows… The critical bugs identified require…"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="recommendations">
              Recommendations
            </label>
            <p className="text-xs text-slate-500">
              Actionable next steps for the client's development team.
            </p>
            <Textarea
              id="recommendations"
              name="recommendations"
              defaultValue={defaults.recommendations}
              placeholder="We recommend addressing the critical issues before release. Priority fixes include…"
            />
          </div>

          {state.message && !state.success ? (
            <p className="text-sm text-red-600">{state.message}</p>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Generating PDF…" : "Generate & publish PDF"}
            </Button>
          </div>
        </form>
      </CardSection>
    </Card>
  );
}
