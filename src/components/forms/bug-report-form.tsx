"use client";

import { useActionState } from "react";

import { submitBugReportAction } from "@/app/actions/bugs";
import type { ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { success: false };

export function BugReportForm({ campaignId }: { campaignId: string }) {
  const [state, formAction] = useActionState(submitBugReportAction, initialState);
  const errorEntries = Object.entries(state.errors ?? {});
  const fieldLabels: Record<string, string> = {
    campaignId: "Campaign",
    bugType: "Type",
    title: "Title",
    pageUrl: "URL",
    description: "Description",
    reproductionSteps: "Reproduction steps",
    severity: "Severity",
  };

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="bugType">
            Type
          </label>
          <Select id="bugType" name="bugType" defaultValue="Functional Bugs">
            <option value="Functional Bugs">Functional Bugs</option>
            <option value="UI / Visual Issues">UI / Visual Issues</option>
            <option value="Performance Issues">Performance Issues</option>
            <option value="Crash / Critical Errors">Crash / Critical Errors</option>
            <option value="Compatibility Issues">Compatibility Issues</option>
            <option value="Usability Problems">Usability Problems</option>
            <option value="Security Issues">Security Issues</option>
            <option value="Data Issues">Data Issues</option>
            <option value="Network / API Issues">Network / API Issues</option>
            <option value="Localization / Language Issues">Localization / Language Issues</option>
            <option value="Installation / Setup Issues">Installation / Setup Issues</option>
            <option value="Edge Case Bugs">Edge Case Bugs</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="title">
            Title
          </label>
          <Input id="title" name="title" placeholder="Checkout button does nothing on Safari" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="pageUrl">
            URL (optional)
          </label>
          <Input id="pageUrl" name="pageUrl" placeholder="https://example.com/checkout" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="description">
            Description
          </label>
          <Textarea id="description" name="description" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="reproductionSteps">
            Reproduction steps
          </label>
          <Textarea id="reproductionSteps" name="reproductionSteps" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="severity">
            Severity
          </label>
          <Select id="severity" name="severity" defaultValue="MEDIUM">
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="attachments">
            Attachments (optional)
          </label>
          <Input id="attachments" name="attachments" type="file" multiple />
        </div>
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      {errorEntries.length ? (
        <div className="space-y-1 text-sm text-red-700">
          {errorEntries.map(([field, errors]) => (
            <p key={field}>
              <span className="font-semibold">{fieldLabels[field] ?? field}</span>: {errors.join(", ")}
            </p>
          ))}
        </div>
      ) : null}
      <SubmitButton label="Submit bug report" pendingLabel="Uploading report..." />
    </form>
  );
}
