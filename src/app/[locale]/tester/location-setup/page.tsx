"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";

import { saveCountryAction } from "@/app/actions/tester-setup";
import { CountrySelect } from "@/components/forms/country-select";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { requestBrowserCountry } from "@/lib/geolocation-country";

type Mode = "geo" | "manual";

export default function TesterLocationSetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("geo");
  const [status, setStatus] = useState<"idle" | "requesting" | "detecting" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function saveCountry(country: string, countrySource: "GEOLOCATION" | "MANUAL") {
    setStatus("saving");
    setMessage("");

    try {
      await saveCountryAction({ country, countrySource });
      router.push("/tester/vetting");
    } catch {
      setMessage("Could not save your country. Please try again.");
      setStatus(mode === "manual" ? "idle" : "error");
    }
  }

  async function requestLocation() {
    setStatus("requesting");
    setMessage("");

    try {
      setStatus("detecting");
      const country = await requestBrowserCountry();
      await saveCountry(country, "GEOLOCATION");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not detect your country.");
    }
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const country = String(formData.get("country") ?? "").trim();

    if (!country) {
      setStatus("error");
      setMessage("Please select your country.");
      return;
    }

    await saveCountry(country, "MANUAL");
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full space-y-6">
        <div className="text-center">
          <SectionHeading
            eyebrow="One more step"
            title="Location required"
            description="We use your country to match you with relevant campaigns. Your exact coordinates are never stored."
            className="flex-col items-center text-center"
          />
        </div>

        <Card padding="none">
          <CardHeader>
            <CardTitle>{mode === "geo" ? "Enable location access" : "Choose your country"}</CardTitle>
            <CardDescription>
              {mode === "geo"
                ? "Allow your browser to detect your country. A permission popup will appear."
                : "Select the country where you perform testing."}
            </CardDescription>
          </CardHeader>
          <CardSection className="space-y-4 border-t border-slate-100/90">
            {mode === "geo" ? (
              <>
                {status === "idle" || status === "error" ? (
                  <Button onClick={requestLocation} className="w-full">
                    Allow location access
                  </Button>
                ) : null}
                {status === "requesting" ? (
                  <Button disabled className="w-full">
                    Waiting for browser permission...
                  </Button>
                ) : null}
                {status === "detecting" || status === "saving" ? (
                  <Button disabled className="w-full">
                    {status === "saving" ? "Saving..." : "Detecting your country..."}
                  </Button>
                ) : null}
                {status === "error" && message ? <p className="text-sm text-red-700">{message}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    setMode("manual");
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="text-sm text-blue-700 underline-offset-2 hover:underline"
                >
                  Ignore and choose country manually
                </button>
              </>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <CountrySelect id="country" required />
                {message ? <p className="text-sm text-red-700">{message}</p> : null}
                <Button type="submit" className="w-full" disabled={status === "saving"}>
                  {status === "saving" ? "Saving..." : "Continue to vetting"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("geo");
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="text-sm text-blue-700 underline-offset-2 hover:underline"
                >
                  Try automatic location instead
                </button>
              </form>
            )}
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
