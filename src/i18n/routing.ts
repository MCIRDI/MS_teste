import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export function isRtlLocale(locale: string) {
  return locale === "ar";
}

export function hasLocalePrefix(pathname: string) {
  return locales.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
}

/** Strip a leading /en, /fr or /ar segment — safe for language switching. */
export function stripLocalePrefix(pathname: string) {
  for (const loc of locales) {
    if (pathname === `/${loc}`) {
      return "/";
    }
    if (pathname.startsWith(`/${loc}/`)) {
      const rest = pathname.slice(loc.length + 1);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }
  return pathname || "/";
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const match = pathname.match(/^\/(en|fr|ar)(?=\/|$)/);
  return match ? (match[1] as Locale) : null;
}

export function localizedPath(locale: string, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}
