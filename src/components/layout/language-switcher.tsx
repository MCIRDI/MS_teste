"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, stripLocalePrefix, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeKeys: Record<Locale, "en" | "fr" | "ar"> = {
  en: "en",
  fr: "fr",
  ar: "ar",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function onChange(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    // usePathname is locale-free, but guard against /fr/... leaking into the next URL
    const pathWithoutLocale = stripLocalePrefix(pathname);
    router.replace(pathWithoutLocale, { locale: nextLocale });
  }

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className={cn(
          "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className,
        )}
        aria-label={t("label")}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(localeKeys[code])}
          </option>
        ))}
      </select>
    </label>
  );
}
