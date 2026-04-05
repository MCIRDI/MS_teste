"use client";

import { useActionState } from "react";

import { loginAction, type ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { success: false };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="name@company.com" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="Your password" required />
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <SubmitButton label="Login" pendingLabel="Signing in..." />
    </form>
  );
}
