"use client";

import { useActionState } from "react";

import { signupAction, type ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { success: false };

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="name">
            Name
          </label>
          <Input id="name" name="name" placeholder="Your full name" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="name@company.com" required />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="role">
            Account type
          </label>
          <Select id="role" name="role" defaultValue="CLIENT">
            <option value="CLIENT">Client</option>
            <option value="TESTER">Tester</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="testerKind">
            Tester type
          </label>
          <Select id="testerKind" name="testerKind" defaultValue="CROWD">
            <option value="CROWD">Crowd tester</option>
            <option value="DEVELOPER">Developer tester</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="country">
            Country
          </label>
          <Input id="country" name="country" placeholder="Country" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700" htmlFor="language">
            Language
          </label>
          <Input id="language" name="language" placeholder="Language" required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="testingExperience">
          Testing experience
        </label>
        <Textarea
          id="testingExperience"
          name="testingExperience"
          placeholder="Devices, industries, API tools, bug reporting experience"
        />
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <SubmitButton label="Create account" pendingLabel="Creating account..." />
    </form>
  );
}
