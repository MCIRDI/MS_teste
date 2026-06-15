export const currencies = ["DZD", "USD", "EUR"] as const;
export type DisplayCurrency = (typeof currencies)[number];

export const DISPLAY_CURRENCY_COOKIE = "dztesters-currency";
export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = "DZD";

/** Platform prices are stored in USD; convert for display. */
const USD_TO: Record<DisplayCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  DZD: 135,
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return currencies.includes(value as DisplayCurrency);
}

export function convertFromUsd(amountUsd: number, target: DisplayCurrency) {
  return amountUsd * USD_TO[target];
}

export function formatMoney(
  amountUsd: number,
  currency: DisplayCurrency,
  locale = "en",
) {
  const value = convertFromUsd(amountUsd, currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "DZD" ? 0 : 2,
  }).format(value);
}

export function readCurrencyFromCookieValue(cookieHeader: string | undefined): DisplayCurrency {
  if (!cookieHeader) {
    return DEFAULT_DISPLAY_CURRENCY;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DISPLAY_CURRENCY_COOKIE}=`));

  if (!match) {
    return DEFAULT_DISPLAY_CURRENCY;
  }

  const value = match.slice(DISPLAY_CURRENCY_COOKIE.length + 1);
  return isDisplayCurrency(value) ? value : DEFAULT_DISPLAY_CURRENCY;
}

export function readCurrencyFromDocumentCookie(): DisplayCurrency {
  if (typeof document === "undefined") {
    return DEFAULT_DISPLAY_CURRENCY;
  }

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DISPLAY_CURRENCY_COOKIE}=`));

  if (!match) {
    return DEFAULT_DISPLAY_CURRENCY;
  }

  const value = decodeURIComponent(match.slice(DISPLAY_CURRENCY_COOKIE.length + 1));
  return isDisplayCurrency(value) ? value : DEFAULT_DISPLAY_CURRENCY;
}

export function writeCurrencyCookie(currency: DisplayCurrency) {
  document.cookie = `${DISPLAY_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; SameSite=Lax`;
}
