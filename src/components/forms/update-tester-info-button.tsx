"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";

import { updateTesterInfoAction } from "@/app/actions/tester-setup";
import { CountrySelect } from "@/components/forms/country-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { requestBrowserCountry } from "@/lib/geolocation-country";

type TesterInfoDefaults = {
  country: string;
  deviceName: string;
  osVersion: string;
  browser: string;
  screenResolution: string;
};

const initialState = { success: false, message: "" };

export function UpdateTesterInfoButton({ defaults }: { defaults?: Partial<TesterInfoDefaults> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateTesterInfoAction, initialState);
  const [country, setCountry] = useState(defaults?.country ?? "");
  const [countrySource, setCountrySource] = useState<"GEOLOCATION" | "MANUAL">("MANUAL");
  const [geoMessage, setGeoMessage] = useState("");
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [deviceFields, setDeviceFields] = useState({
    deviceName: defaults?.deviceName ?? "",
    osVersion: defaults?.osVersion ?? "",
    browser: defaults?.browser ?? "",
    screenResolution: defaults?.screenResolution ?? "",
  });

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [router, state.success]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCountry(defaults?.country ?? "");
    setCountrySource("MANUAL");
    setDeviceFields({
      deviceName: defaults?.deviceName ?? "",
      osVersion: defaults?.osVersion ?? "",
      browser: defaults?.browser ?? "",
      screenResolution: defaults?.screenResolution ?? "",
    });
  }, [open, defaults]);

  function detectDevice() {
    void import("@/lib/device-detection").then(({ detectDeviceInfo }) => {
      const info = detectDeviceInfo();
      setDeviceFields(info);
    });
  }

  async function detectCountry() {
    setDetectingCountry(true);
    setGeoMessage("");

    try {
      const detectedCountry = await requestBrowserCountry();
      setCountry(detectedCountry);
      setCountrySource("GEOLOCATION");
    } catch (error) {
      setGeoMessage(error instanceof Error ? error.message : "Could not detect country.");
    } finally {
      setDetectingCountry(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Edit testing info
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit testing info">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="countrySource" value={countrySource} />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="tester-country">
                Country
              </label>
              <Button
                type="button"
                variant="secondary"
                className="h-8 text-xs"
                onClick={detectCountry}
                disabled={detectingCountry}
              >
                {detectingCountry ? "Detecting..." : "Detect from location"}
              </Button>
            </div>
            <CountrySelect
              id="tester-country"
              value={country}
              onChange={(value) => {
                setCountry(value);
                setCountrySource("MANUAL");
              }}
              required
            />
            {geoMessage ? <p className="text-xs text-amber-700">{geoMessage}</p> : null}
            <p className="text-xs text-slate-500">
              Source: {countrySource === "GEOLOCATION" ? "Automatic (location)" : "Manual selection"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Device details</p>
            <Button type="button" variant="secondary" className="h-8 text-xs" onClick={detectDevice}>
              Auto-detect device
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="deviceName">
              Device
            </label>
            <Input
              id="deviceName"
              name="deviceName"
              value={deviceFields.deviceName}
              onChange={(event) => setDeviceFields((current) => ({ ...current, deviceName: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="osVersion">
              OS version
            </label>
            <Input
              id="osVersion"
              name="osVersion"
              value={deviceFields.osVersion}
              onChange={(event) => setDeviceFields((current) => ({ ...current, osVersion: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="browser">
              Browser
            </label>
            <Input
              id="browser"
              name="browser"
              value={deviceFields.browser}
              onChange={(event) => setDeviceFields((current) => ({ ...current, browser: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="screenResolution">
              Screen resolution
            </label>
            <Input
              id="screenResolution"
              name="screenResolution"
              value={deviceFields.screenResolution}
              onChange={(event) =>
                setDeviceFields((current) => ({ ...current, screenResolution: event.target.value }))
              }
              required
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
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
