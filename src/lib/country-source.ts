import type { CountrySource } from "@/generated/prisma";

import { countries, COUNTRY_MAP } from "@/lib/constants";

export function isKnownCountry(code: string) {
  return code in COUNTRY_MAP;
}

export function codeToCountryName(code: string): string {
  return COUNTRY_MAP[code] ?? code;
}

export function getCountrySourceLabel(source: CountrySource | null | undefined) {
  switch (source) {
    case "GEOLOCATION":
      return "Auto (location)";
    case "MANUAL":
      return "Manual";
    case "ADMIN":
      return "Set by admin";
    default:
      return "Unknown";
  }
}

export function getCountrySourceBadgeClass(source: CountrySource | null | undefined) {
  switch (source) {
    case "GEOLOCATION":
      return "bg-emerald-50 text-emerald-700";
    case "MANUAL":
      return "bg-amber-50 text-amber-800";
    case "ADMIN":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function isValidCountrySource(value: string): value is CountrySource {
  return value === "GEOLOCATION" || value === "MANUAL" || value === "ADMIN";
}
