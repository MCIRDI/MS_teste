import { env } from "@/lib/env";
import { calculateModeratorSlots } from "@/lib/utils";

export function estimateCampaignPrice(input: {
  crowdTesterCount: number;
  developerTesterCount: number;
  countries: string[];
  platforms: string[];
}) {
  const countryMultiplier = 1 + Math.max(0, input.countries.length - 1) * env.COUNTRY_MULTIPLIER_STEP;
  const platformMultiplier = 1 + Math.max(0, input.platforms.length - 1) * env.PLATFORM_MULTIPLIER_STEP;
  const crowdSubtotal = input.crowdTesterCount * env.CROWD_TESTER_BASE_PRICE;
  const developerSubtotal = input.developerTesterCount * env.DEVELOPER_TESTER_BASE_PRICE;
  const baseTotal = crowdSubtotal + developerSubtotal;
  const estimatedCost = Math.round(baseTotal * countryMultiplier * platformMultiplier);

  return {
    crowdSubtotal,
    developerSubtotal,
    countryMultiplier,
    platformMultiplier,
    moderatorSlots: calculateModeratorSlots(
      input.crowdTesterCount + input.developerTesterCount,
    ),
    estimatedCost,
  };
}
