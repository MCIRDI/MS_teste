"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { currencies, type DisplayCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const triggerClassName =
  "flex h-9 min-w-[3.25rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-700";

export function CurrencySwitcher({
  className,
  menuPlacement = "bottom",
}: {
  className?: string;
  menuPlacement?: "top" | "bottom";
}) {
  const t = useTranslations("currency");
  const router = useRouter();
  const { currency, setCurrency } = useDisplayCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function onChange(nextCurrency: DisplayCurrency) {
    if (nextCurrency === currency) {
      setOpen(false);
      return;
    }

    setCurrency(nextCurrency);
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
        {currency}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("label")}
          className={cn(
            "absolute z-50 min-w-[4.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10",
            menuPlacement === "top" ? "bottom-full mb-2 start-0" : "start-0 mt-2 top-full",
          )}
        >
          {currencies.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === currency}
              onClick={() => onChange(code)}
              className={cn(
                "block w-full px-3 py-2 text-start text-sm transition hover:bg-slate-50",
                code === currency ? "font-semibold text-blue-700" : "text-slate-700",
              )}
            >
              {code}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
