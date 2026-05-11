"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { saveCountryAction } from "@/app/actions/tester-setup";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";

export default function TesterLocationSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requesting" | "detecting" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function requestLocation() {
    setStatus("requesting");
    setMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("detecting");
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const country = data.countryName || "";

          if (!country) {
            setStatus("error");
            setMessage("Could not determine your country from location.");
            return;
          }

          setStatus("saving");
          await saveCountryAction(country);
          setStatus("done");
          router.push("/tester/campaigns");
        } catch {
          setStatus("error");
          setMessage("Something went wrong while detecting your location.");
        }
      },
      (err) => {
        setStatus("error");
        if (err.code === 1) {
          setMessage("Location permission was denied. Please enable it in your browser settings.");
        } else if (err.code === 2) {
          setMessage("Location information is unavailable.");
        } else if (err.code === 3) {
          setMessage("Location request timed out.");
        } else {
          setMessage("Could not retrieve your location.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false }
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full space-y-6">
        <div className="text-center">
          <SectionHeading
            eyebrow="One more step"
            title="Location required"
            description="We need your country to send you campaigns that match your region. Your exact location is only used once to detect your country and is never stored."
            className="flex-col items-center text-center"
          />
        </div>

        <Card padding="none">
          <CardHeader>
            <CardTitle>Enable location access</CardTitle>
            <CardDescription>
              Click the button below to allow your browser to detect your country. A browser popup will appear.
            </CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90 space-y-4">
            {status === "idle" && (
              <Button onClick={requestLocation} className="w-full">
                Allow location access
              </Button>
            )}
            {status === "requesting" && (
              <Button disabled className="w-full">
                Waiting for browser permission...
              </Button>
            )}
            {status === "detecting" && (
              <Button disabled className="w-full">
                Detecting your country...
              </Button>
            )}
            {status === "saving" && (
              <Button disabled className="w-full">
                Saving...
              </Button>
            )}
            {status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-red-700">{message}</p>
                <Button onClick={requestLocation} variant="secondary" className="w-full">
                  Try again
                </Button>
              </div>
            )}
            {status === "done" && (
              <p className="text-sm text-green-700">Country saved. Redirecting...</p>
            )}
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
