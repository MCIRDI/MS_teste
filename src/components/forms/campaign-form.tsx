"use client";

import { useActionState } from "react";

import { createCampaignAction } from "@/app/actions/campaigns";
import type { ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { browsers, countries, platforms, softwareTypes } from "@/lib/constants";
import { estimateCampaignPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { success: false };

export function CampaignForm() {
  const [state, formAction] = useActionState(createCampaignAction, initialState);

  const preview = estimateCampaignPrice({
    crowdTesterCount: 120,
    developerTesterCount: 10,
    countries: ["United States", "Germany", "Poland"],
    platforms: ["Windows", "iOS", "Android"],
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <form action={formAction} className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="selectedPlatforms">
              Platforms
            </label>
            <Textarea
              id="selectedPlatforms"
              name="selectedPlatforms"
              defaultValue={platforms.join(", ")}
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="selectedBrowsers">
              Browsers
            </label>
            <Textarea
              id="selectedBrowsers"
              name="selectedBrowsers"
              defaultValue={browsers.join(", ")}
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="selectedCountries">
              Countries
            </label>
            <Textarea
              id="selectedCountries"
              name="selectedCountries"
              defaultValue={countries.join(", ")}
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="crowdTesterCount">
              Crowd testers
            </label>
            <Input id="crowdTesterCount" name="crowdTesterCount" type="number" min="0" defaultValue="120" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700" htmlFor="developerTesterCount">
              Developer testers
            </label>
            <Input id="developerTesterCount" name="developerTesterCount" type="number" min="0" defaultValue="10" />
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
        <SubmitButton label="Launch for approval" pendingLabel="Saving campaign..." />
      </form>

      <aside className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Pricing preview</p>
          <h3 className="mt-2 font-serif text-3xl text-stone-900">
            {formatCurrency(preview.estimatedCost)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            The estimate combines tester counts, country spread, and platform breadth before the campaign is sent for approval.
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
          <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
            <span>Moderator slots</span>
            <span>{preview.moderatorSlots}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-stone-300 p-5 text-sm leading-6 text-stone-600">
          Default lists are prefilled so you can quickly start from the requested platform and country coverage.
        </div>
      </aside>
    </div>
  );
}
