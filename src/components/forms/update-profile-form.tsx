"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

import { updateProfileAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { success: false, message: "" };

export function UpdateProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="profile-name">
          Display name
        </label>
        <Input id="profile-name" name="name" defaultValue={name} required minLength={2} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="profile-current-password">
          Current password
        </label>
        <Input
          id="profile-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder="Required only when changing password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="profile-new-password">
          New password
        </label>
        <Input
          id="profile-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Leave blank to keep current password"
        />
        <p className="text-xs text-slate-500">Minimum 8 characters.</p>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.success ? "text-emerald-700" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
