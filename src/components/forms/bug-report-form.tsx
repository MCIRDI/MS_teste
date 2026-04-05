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

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="title">
            Bug title
          </label>
          <Input id="title" name="title" placeholder="Safari checkout spinner never resolves" required />
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
          <label className="text-sm font-medium text-stone-700" htmlFor="expectedResult">
            Expected result
          </label>
          <Textarea id="expectedResult" name="expectedResult" className="min-h-24" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="actualResult">
            Actual result
          </label>
          <Textarea id="actualResult" name="actualResult" className="min-h-24" required />
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="device">
            Device
          </label>
          <Input id="device" name="device" placeholder="iPhone 15" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="osVersion">
            OS version
          </label>
          <Input id="osVersion" name="osVersion" placeholder="iOS 18" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="browser">
            Browser
          </label>
          <Input id="browser" name="browser" placeholder="Safari 18" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="screenResolution">
            Screen resolution
          </label>
          <Input id="screenResolution" name="screenResolution" placeholder="1179x2556" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="attachments">
            Attachments
          </label>
          <Input id="attachments" name="attachments" type="file" multiple />
        </div>
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <SubmitButton label="Submit bug report" pendingLabel="Uploading report..." />
    </form>
  );
}
