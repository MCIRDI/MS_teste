import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export async function SiteFooter() {
  const t = await getTranslations();

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("brand.name")}</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">{t("footer.tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
          <Link href="/about" className="transition hover:text-indigo-600">
            {t("nav.about")}
          </Link>
          <Link href="/how-it-works" className="transition hover:text-indigo-600">
            {t("nav.howItWorks")}
          </Link>
          <Link href="/login" className="transition hover:text-indigo-600">
            {t("nav.login")}
          </Link>
          <Link href="/signup" className="transition hover:text-indigo-600">
            {t("nav.signup")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
