"use client";

import { useActionState, useState } from "react";

import { createCampaignAction } from "@/app/actions/campaigns";
import type { ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { browsers, countries, platforms, softwareTypes } from "@/lib/constants";
import { estimateCampaignPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

const initialState: ActionState = { success: false };

export function CampaignForm() {
  const [state, formAction] = useActionState(createCampaignAction, initialState);
  const [crowdTesterCount, setCrowdTesterCount] = useState(120);
  const [developerTesterCount, setDeveloperTesterCount] = useState(10);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Windows", "iOS", "Android"]);
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(["Chrome", "Firefox", "Safari"]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["United States", "Germany", "Poland"]);

  const preview = estimateCampaignPrice({
    crowdTesterCount,
    developerTesterCount,
    countries: selectedCountries,
    platforms: selectedPlatforms,
    browsers: selectedBrowsers,
  });

  function toggleValue(
    value: string,
    items: string[],
    setItems: (next: string[]) => void,
  ) {
    setItems(
      items.includes(value) ? items.filter((item) => item !== value) : [...items, value],
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card padding="none">
        <CardHeader>
          <CardTitle>Campaign scope</CardTitle>
          <CardDescription>Define tester coverage, environments, and tasks for this test cycle.</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="selectedPlatforms" value={selectedPlatforms.join(", ")} />
            <input type="hidden" name="selectedBrowsers" value={selectedBrowsers.join(", ")} />
            <input type="hidden" name="selectedCountries" value={selectedCountries.join(", ")} />
            <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="projectName">
              Project name
            </label>
            <Input id="projectName" name="projectName" placeholder="Checkout reliability sprint" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="softwareType">
              Software type
            </label>
            <Select id="softwareType" name="softwareType" defaultValue="WEBSITE">
              {softwareTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="websiteUrl">
              Website URL
            </label>
            <Input id="websiteUrl" name="websiteUrl" placeholder="https://app.example.com" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="description">
              Description
            </label>
            <Textarea id="description" name="description" placeholder="Scope, risk areas, and expected tester behavior" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="testerLoginCredentials">
              Tester login credentials
            </label>
            <Textarea id="testerLoginCredentials" name="testerLoginCredentials" placeholder="Shared credentials or access instructions" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="softwareFile">
              Downloadable build
            </label>
            <Input id="softwareFile" name="softwareFile" type="file" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Target device types
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const active = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => toggleValue(platform, selectedPlatforms, setSelectedPlatforms)}
                    className={
                      active
                        ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                        : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                    }
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Browsers
            </label>
            <div className="flex flex-wrap gap-2">
              {browsers.map((browser) => {
                const active = selectedBrowsers.includes(browser);
                return (
                  <button
                    key={browser}
                    type="button"
                    onClick={() => toggleValue(browser, selectedBrowsers, setSelectedBrowsers)}
                    className={
                      active
                        ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                        : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                    }
                  >
                    {browser}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">
              Target countries
            </label>
            <div className="flex flex-wrap gap-2">
              {countries.map((country) => {
                const active = selectedCountries.includes(country);
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleValue(country, selectedCountries, setSelectedCountries)}
                    className={
                      active
                        ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                        : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                    }
                  >
                    {country}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="crowdTesterCount">
              Crowd testers
            </label>
            <Input
              id="crowdTesterCount"
              name="crowdTesterCount"
              type="number"
              min="0"
              value={crowdTesterCount}
              onChange={(event) => setCrowdTesterCount(Number(event.currentTarget.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="developerTesterCount">
              Developer testers
            </label>
            <Input
              id="developerTesterCount"
              name="developerTesterCount"
              type="number"
              min="0"
              value={developerTesterCount}
              onChange={(event) => setDeveloperTesterCount(Number(event.currentTarget.value || 0))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="tasks">
              Testing tasks
            </label>
            <Textarea
              id="tasks"
              name="tasks"
              defaultValue={[
                "Create account",
                "Browse products",
                "Test checkout",
                "Attempt incorrect inputs",
                "Explore edge cases",
              ].join("\n")}
              className="min-h-40"
            />
          </div>
        </div>
            {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
            <SubmitButton label="Launch campaign" pendingLabel="Launching campaign..." />
          </form>
        </CardSection>
      </Card>

      <Card padding="none" variant="muted">
        <CardHeader>
          <CardTitle>Pricing preview</CardTitle>
          <CardDescription>
            Updates automatically from testers, countries, browsers, and device targets.
          </CardDescription>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(preview.estimatedCost)}
          </p>
        </CardHeader>
        <CardSection className="space-y-5 border-t border-slate-100/90">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Crowd testers</span>
            <span>{formatCurrency(preview.crowdSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Developer testers</span>
            <span>{formatCurrency(preview.developerSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Country multiplier</span>
            <span>x{preview.countryMultiplier.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Platform multiplier</span>
            <span>x{preview.platformMultiplier.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Browser multiplier</span>
            <span>x{preview.browserMultiplier.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900">
            <span>Moderator slots</span>
            <span>{preview.moderatorSlots}</span>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-900">Selected scope</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCountries.map((country) => (
              <Badge key={country}>{country}</Badge>
            ))}
            {selectedPlatforms.map((platform) => (
              <Badge key={platform}>{platform}</Badge>
            ))}
            {selectedBrowsers.map((browser) => (
              <Badge key={browser}>{browser}</Badge>
            ))}
          </div>
        </div>
        </CardSection>
      </Card>
    </div>
  );
}
