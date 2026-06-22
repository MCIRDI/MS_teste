"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";

import { addTesterDeviceAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const initialState = { success: false, message: "" };

export function AddDeviceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addTesterDeviceAction, initialState);
  const [fields, setFields] = useState({
    deviceName: "",
    osVersion: "",
    browser: "",
    screenResolution: "",
    operator: "",
    connectionType: "",
  });

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setFields({ deviceName: "", osVersion: "", browser: "", screenResolution: "", operator: "", connectionType: "" });
      router.refresh();
    }
  }, [state.success, router]);

  useEffect(() => {
    if (!open) return;
    setFields({ deviceName: "", osVersion: "", browser: "", screenResolution: "", operator: "", connectionType: "" });
  }, [open]);

  function detectDevice() {
    void import("@/lib/device-detection").then(({ detectDeviceInfo }) => {
      const info = detectDeviceInfo();
      setFields((prev) => ({ ...prev, ...info }));
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        + Add device
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add new device">
        <form action={formAction} className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Device details</p>
            <Button type="button" variant="secondary" className="h-8 text-xs" onClick={detectDevice}>
              Auto-detect
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-deviceName">
              Device name
            </label>
            <Input
              id="add-deviceName"
              name="deviceName"
              value={fields.deviceName}
              onChange={(e) => setFields((p) => ({ ...p, deviceName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-osVersion">
              OS version
            </label>
            <Input
              id="add-osVersion"
              name="osVersion"
              value={fields.osVersion}
              onChange={(e) => setFields((p) => ({ ...p, osVersion: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-browser">
              Browser
            </label>
            <Input
              id="add-browser"
              name="browser"
              value={fields.browser}
              onChange={(e) => setFields((p) => ({ ...p, browser: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-screenResolution">
              Screen resolution
            </label>
            <Input
              id="add-screenResolution"
              name="screenResolution"
              value={fields.screenResolution}
              onChange={(e) => setFields((p) => ({ ...p, screenResolution: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-operator">
              Operator / carrier <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              id="add-operator"
              name="operator"
              value={fields.operator}
              onChange={(e) => setFields((p) => ({ ...p, operator: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="add-connectionType">
              Connection type <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              id="add-connectionType"
              name="connectionType"
              placeholder="e.g. WiFi, 4G, 5G"
              value={fields.connectionType}
              onChange={(e) => setFields((p) => ({ ...p, connectionType: e.target.value }))}
            />
          </div>

          {state.message ? (
            <p className={`text-sm ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add device"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
