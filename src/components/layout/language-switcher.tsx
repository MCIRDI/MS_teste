"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/routing";
import { locales, stripLocalePrefix, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeKeys: Record<Locale, "en" | "fr" | "ar"> = {
  en: "en",
  fr: "fr",
  ar: "ar",
};

function resolveLocaleFromParams(params: ReturnType<typeof useParams>): Locale {
  const raw = params.locale;
  if (typeof raw === "string" && locales.includes(raw as Locale)) {
    return raw as Locale;
  }
  return "en";
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = resolveLocaleFromParams(params);

  function onChange(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      return;
    }

    const pathWithoutLocale = stripLocalePrefix(pathname || "/");
    router.replace(pathWithoutLocale, { locale: nextLocale });
    router.refresh();
  }

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="sr-only">{t("label")}</span>
      <select
        key={currentLocale}
        value={currentLocale}
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
