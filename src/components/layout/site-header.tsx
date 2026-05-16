import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getCurrentSession, getDashboardPath } from "@/lib/auth";
import { getPublicNavigation } from "@/lib/i18n";

export async function SiteHeader() {
  const t = await getTranslations();
  const session = await getCurrentSession();
  const publicNavigation = getPublicNavigation(t);

  return (
    <header className="nav-gradient sticky top-0 z-50 shadow-sm shadow-blue-900/5">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition group-hover:scale-105">
            Dz
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {t("brand.name")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {publicNavigation.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-100/80 hover:text-blue-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {session ? (
            <Link href={getDashboardPath(session.role)}>
              <Button variant="secondary" className="hidden sm:inline-flex">
                {t("nav.openDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-100/80 hover:text-blue-800 sm:inline"
              >
                {t("nav.login")}
              </Link>
              <Link href="/signup">
                <Button>{t("nav.getStarted")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
