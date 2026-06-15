"use client";

import { useLocale } from "next-intl";
import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_DISPLAY_CURRENCY,
  formatMoney,
  readCurrencyFromDocumentCookie,
  type DisplayCurrency,
  writeCurrencyCookie,
} from "@/lib/currency";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("dztesters-currency-change", onStoreChange);
  return () => window.removeEventListener("dztesters-currency-change", onStoreChange);
}

function getSnapshot() {
  return readCurrencyFromDocumentCookie();
}

function getServerSnapshot() {
  return DEFAULT_DISPLAY_CURRENCY;
}

export function useDisplayCurrency() {
  const locale = useLocale();
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCurrency = useCallback((next: DisplayCurrency) => {
    writeCurrencyCookie(next);
    window.dispatchEvent(new Event("dztesters-currency-change"));
  }, []);

  const format = useCallback(
    (amountUsd: number) => formatMoney(amountUsd, currency, locale),
    [currency, locale],
  );

  return { currency, setCurrency, format };
}
