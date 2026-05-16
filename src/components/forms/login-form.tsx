"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { loginAction, type ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { success: false };

export function LoginForm() {
  const t = useTranslations("login");
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          {t("email")}
        </label>
        <Input id="email" name="email" type="email" placeholder={t("emailPlaceholder")} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          {t("password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          required
        />
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <SubmitButton label={t("submit")} pendingLabel={t("pending")} />
    </form>
  );
}
