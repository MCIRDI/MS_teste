"use client";

import { useRouter } from "@/i18n/routing";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { currencies, type DisplayCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function CurrencySwitcher({ className }: { className?: string }) {
  const t = useTranslations("currency");
  const router = useRouter();
  const { currency, setCurrency } = useDisplayCurrency();

  function onChange(nextCurrency: DisplayCurrency) {
    if (nextCurrency === currency) {
      return;
    }

    setCurrency(nextCurrency);
    router.refresh();
  }

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="sr-only">{t("label")}</span>
      <select
        key={currency}
        value={currency}
        onChange={(event) => onChange(event.target.value as DisplayCurrency)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        aria-label={t("label")}
      >
        {currencies.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
