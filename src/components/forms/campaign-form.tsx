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
      <form action={formAction} className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
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
                    className={active ? "rounded-full bg-stone-900 px-4 py-2 text-sm text-white" : "rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700"}
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
                    className={active ? "rounded-full bg-stone-900 px-4 py-2 text-sm text-white" : "rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700"}
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
                    className={active ? "rounded-full bg-stone-900 px-4 py-2 text-sm text-white" : "rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700"}
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

      <aside className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Pricing preview</p>
          <h3 className="mt-2 font-serif text-3xl text-stone-900">
            {formatCurrency(preview.estimatedCost)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            The estimate updates automatically from tester counts, target countries, browsers, and device types.
          </p>
        </div>
        <div className="space-y-3 rounded-3xl bg-stone-100 p-5 text-sm text-stone-700">
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
          <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
            <span>Moderator slots</span>
            <span>{preview.moderatorSlots}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-stone-300 p-5 text-sm leading-6 text-stone-600">
          <p className="font-medium text-stone-900">Selected scope</p>
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
      </aside>
    </div>
  );
}
