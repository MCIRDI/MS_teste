import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { acceptRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { AppShellRealtime } from "@/components/layout/app-shell-realtime";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { Role } from "@/generated/prisma";
import { clearSession, type SessionUser } from "@/lib/auth";
import { getPendingRoleUpgradeInvitation, getUserNotifications, getUnreadNotificationCount } from "@/lib/dashboard-data";
import { getRoleLabels, getRoleNavigation } from "@/lib/i18n";

export async function logoutAction() {
  "use server";
  await clearSession();
}

type AppShellProps = {
  session: SessionUser;
  children: ReactNode;
  title: string;
  description: string;
};

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export async function AppShell({ session, children, title, description }: AppShellProps) {
  const t = await getTranslations();
  const roleLabels = getRoleLabels(t);
  const items = getRoleNavigation(t)[session.role as Role];
  const pendingRoleUpgrade = await getPendingRoleUpgradeInvitation(session.id);
  const notifications = await getUserNotifications(session.id);
  const unreadCount = await getUnreadNotificationCount(session.id);
  const initials = userInitials(session.name);

  return (
    <div className="dashboard-mesh min-h-screen">
      <div className="nav-gradient border-b border-blue-200/40 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            {t("brand.name")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 md:gap-8 md:px-6">
        <aside className="hidden w-60 shrink-0 lg:sticky lg:top-6 lg:flex lg:self-start">
          <div className="glass-panel flex w-full flex-col rounded-2xl p-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
                Dz
              </span>
              <span className="text-sm font-semibold text-slate-900">{t("brand.name")}</span>
            </Link>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/80 p-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-md"
                aria-hidden
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                <p className="truncate text-xs text-slate-500">{session.email}</p>
                <p className="mt-1.5">
                  <span className="inline-flex rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                    {roleLabels[session.role]}
                  </span>
                </p>
              </div>
            </div>

            {pendingRoleUpgrade ? (
              <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/90 px-3 py-3 text-xs leading-relaxed text-blue-950">
                <p className="font-semibold text-blue-900">{t("shell.roleUpgrade")}</p>
                <p className="mt-1 text-blue-900/90">
                  {roleLabels[pendingRoleUpgrade.currentRole]} → {roleLabels[pendingRoleUpgrade.targetRole]}
                </p>
                <form action={acceptRoleUpgradeInvitationAction} className="mt-3">
                  <input type="hidden" name="invitationId" value={pendingRoleUpgrade.id} />
                  <Button type="submit" className="h-9 w-full text-xs">
                    {t("shell.accept")}
                  </Button>
                </form>
              </div>
            ) : null}

            {notifications.length > 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {t("shell.notifications")} {unreadCount > 0 ? `(${unreadCount})` : ""}
                  </p>
                  {unreadCount > 0 ? (
                    <form action={markNotificationsReadAction}>
                      <Button type="submit" variant="ghost" className="h-7 px-2 text-[10px]">
                        {t("shell.markRead")}
                      </Button>
                    </form>
                  ) : null}
                </div>
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-600">
                  {notifications.slice(0, 5).map((notification) => (
                    <li key={notification.id} className={notification.isRead ? "" : "font-medium text-slate-900"}>
                      {notification.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("nav.navigation")}
            </p>
            <SidebarNav items={items} />

            <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-4">
              <LanguageSwitcher />
              <CurrencySwitcher />
              <form action={logoutAction}>
                <Button variant="ghost" type="submit" className="h-9 w-full justify-start px-3 text-slate-600">
                  {t("nav.logOut")}
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <section className="workspace-gradient overflow-hidden rounded-2xl px-6 py-7 text-white shadow-lg shadow-blue-900/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              {roleLabels[session.role]}
            </p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/95">{description}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
                {t("shell.signedInAs")}{" "}
                <span className="font-semibold text-white">{session.email}</span>
              </div>
            </div>
          </section>
          <AppShellRealtime>{children}</AppShellRealtime>
        </main>
      </div>
    </div>
  );
}
