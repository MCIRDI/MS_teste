import { env } from "@/lib/env";
import { calculateModeratorSlots } from "@/lib/utils";

export function estimateCampaignPrice(input: {
  crowdTesterCount: number;
  certTesterCount: number;
  countries: string[];
  platforms: string[];
  browsers?: string[];
  isPremium?: boolean;
}) {
  const countryMultiplier = 1 + Math.max(0, input.countries.length - 1) * env.COUNTRY_MULTIPLIER_STEP;
  const platformMultiplier = 1 + Math.max(0, input.platforms.length - 1) * env.PLATFORM_MULTIPLIER_STEP;
  const browserMultiplier = 1 + Math.max(0, (input.browsers?.length ?? 0) - 1) * 0.03;
  const premiumMultiplier = input.isPremium ? 1.3 : 1;
  const crowdSubtotal = input.crowdTesterCount * env.CROWD_TESTER_BASE_PRICE;
  const certSubtotal = input.certTesterCount * env.CERT_TESTER_BASE_PRICE;
  const baseTotal = crowdSubtotal + certSubtotal;
  const estimatedCost = Math.round(
    baseTotal * countryMultiplier * platformMultiplier * browserMultiplier * premiumMultiplier,
  );

  return {
    crowdSubtotal,
    certSubtotal,
    countryMultiplier,
    platformMultiplier,
    browserMultiplier,
    premiumMultiplier,
    moderatorSlots: calculateModeratorSlots(input.crowdTesterCount + input.certTesterCount),
    estimatedCost,
  };
}
