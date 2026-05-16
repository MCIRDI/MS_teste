import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/routing";

export async function redirectTo(href: string): Promise<never> {
  const locale = await getLocale();
  redirect({ href, locale });
  throw new Error(`Redirecting to ${href}`);
}
