"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";

import { updateTesterInfoAction } from "@/app/actions/tester-setup";
import { Button } from "@/components/ui/button";

export function UpdateTesterInfoButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "requesting" | "detecting" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
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
          // Get country from geolocation
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: AbortSignal.timeout(8000) }
          );
          const data = await res.json();
          const country = data.countryName || "";

          // Get device info from detection utility
          const { detectDeviceInfo } = await import("@/lib/device-detection");
          const info = detectDeviceInfo();

          // Call server action
          const formData = new FormData();
          formData.set("country", country);
          formData.set("deviceName", info.deviceName);
          formData.set("osVersion", info.osVersion);
          formData.set("browser", info.browser);
          formData.set("screenResolution", info.screenResolution);

          setStatus("saving");
          const result = await updateTesterInfoAction(formData);
          if (result.success) {
            setStatus("done");
            router.refresh();
            setTimeout(() => setStatus("idle"), 2000);
          } else {
            setStatus("error");
            setMessage(result.message || "Failed to update info.");
          }
        } catch {
          setStatus("error");
          setMessage("Something went wrong.");
        }
      },
      (err) => {
        setStatus("error");
        if (err.code === 1) {
          setMessage("Location permission denied. Please enable it in browser settings.");
        } else if (err.code === 2) {
          setMessage("Location unavailable.");
        } else if (err.code === 3) {
          setMessage("Location request timed out.");
        } else {
          setMessage("Could not retrieve your location.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false }
    );
  }

  if (status === "requesting") {
    return <Button disabled>Waiting for location permission...</Button>;
  }
  if (status === "detecting") {
    return <Button disabled>Detecting info...</Button>;
  }
  if (status === "saving") {
    return <Button disabled>Saving...</Button>;
  }
  if (status === "done") {
    return <Button disabled variant="secondary">Updated successfully</Button>;
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={handleClick} variant="secondary">Update info</Button>
        <span className="text-sm text-red-700">{message}</span>
      </div>
    );
  }

  return <Button onClick={handleClick}>Update info</Button>;
}
