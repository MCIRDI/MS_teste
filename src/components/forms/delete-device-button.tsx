"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

import { deleteTesterDeviceAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function DeleteDeviceButton({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteTesterDeviceAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="deviceId" value={deviceId} />
      <Button type="submit" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </Button>
    </form>
  );
}
