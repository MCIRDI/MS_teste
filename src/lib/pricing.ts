import { env } from "@/lib/env";
import { calculateModeratorSlots } from "@/lib/utils";

export function estimateCampaignPrice(input: {
  crowdTesterCount: number;
  developerTesterCount: number;
  countries: string[];
  platforms: string[];
  browsers?: string[];
}) {
  const countryMultiplier = 1 + Math.max(0, input.countries.length - 1) * env.COUNTRY_MULTIPLIER_STEP;
  const platformMultiplier = 1 + Math.max(0, input.platforms.length - 1) * env.PLATFORM_MULTIPLIER_STEP;
  const browserMultiplier = 1 + Math.max(0, (input.browsers?.length ?? 0) - 1) * 0.03;
  const crowdSubtotal = input.crowdTesterCount * env.CROWD_TESTER_BASE_PRICE;
  const developerSubtotal = input.developerTesterCount * env.DEVELOPER_TESTER_BASE_PRICE;
  const baseTotal = crowdSubtotal + developerSubtotal;
  const estimatedCost = Math.round(
    baseTotal * countryMultiplier * platformMultiplier * browserMultiplier,
  );

  return {
    crowdSubtotal,
    developerSubtotal,
    countryMultiplier,
    platformMultiplier,
    browserMultiplier,
    moderatorSlots: calculateModeratorSlots(
      input.crowdTesterCount + input.developerTesterCount,
    ),
    estimatedCost,
  };
}
