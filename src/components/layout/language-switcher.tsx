"use client";

import { useEffect, useRef, useState } from "react";
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

const triggerClassName =
  "flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-700";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function resolveLocaleFromParams(params: ReturnType<typeof useParams>): Locale {
  const raw = params.locale;
  if (typeof raw === "string" && locales.includes(raw as Locale)) {
    return raw as Locale;
  }
  return "en";
}

export function LanguageSwitcher({
  className,
  menuPlacement = "bottom",
}: {
  className?: string;
  menuPlacement?: "top" | "bottom";
}) {
  const t = useTranslations("language");
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = resolveLocaleFromParams(params);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function onChange(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      setOpen(false);
      return;
    }

    const pathWithoutLocale = stripLocalePrefix(pathname || "/");
    router.replace(pathWithoutLocale, { locale: nextLocale });
    router.refresh();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("label")}
      >
        <GlobeIcon className="h-4 w-4 shrink-0" />
        <span>{t(localeKeys[currentLocale])}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("label")}
          className={cn(
            "absolute z-50 min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10",
            menuPlacement === "top" ? "bottom-full mb-2 start-0" : "start-0 mt-2 top-full",
          )}
        >
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === currentLocale}
              onClick={() => onChange(code)}
              className={cn(
                "block w-full px-3 py-2 text-start text-sm transition hover:bg-slate-50",
                code === currentLocale ? "font-semibold text-blue-700" : "text-slate-700",
              )}
            >
              {t(localeKeys[code])}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
