import Link from "next/link";
import type { ReactNode } from "react";

import { acceptRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { clearSession, type SessionUser } from "@/lib/auth";
import { getPendingRoleUpgradeInvitation } from "@/lib/dashboard-data";
import type { Role } from "@/generated/prisma/client";
import { roleLabels, roleNavigation } from "@/lib/constants";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";

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
  const items = roleNavigation[session.role as Role];
  const pendingRoleUpgrade = await getPendingRoleUpgradeInvitation(session.id);
  const initials = userInitials(session.name);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 md:gap-8 md:px-6">
        <aside className="hidden w-56 shrink-0 flex-col lg:sticky lg:top-6 lg:flex lg:self-start">
          <div className="flex flex-col">
            <Link href="/" className="text-sm font-semibold tracking-tight text-blue-700">
              MS test
            </Link>
            <div className="mt-6 flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
                aria-hidden
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                <p className="truncate text-xs text-slate-500">{session.email}</p>
                <p className="mt-1.5">
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    {roleLabels[session.role]}
                  </span>
                </p>
              </div>
            </div>

            {pendingRoleUpgrade ? (
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-3 text-xs leading-relaxed text-blue-950">
                <p className="font-semibold text-blue-900">Role upgrade</p>
                <p className="mt-1 text-blue-900/90">
                  {roleLabels[pendingRoleUpgrade.currentRole]} → {roleLabels[pendingRoleUpgrade.targetRole]}
                </p>
                <form action={acceptRoleUpgradeInvitationAction} className="mt-3">
                  <input type="hidden" name="invitationId" value={pendingRoleUpgrade.id} />
                  <Button type="submit" className="h-9 w-full text-xs">
                    Accept
                  </Button>
                </form>
              </div>
            ) : null}

            <p className="mb-2 mt-8 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            <SidebarNav items={items} />

            <div className="mt-6 border-t border-slate-200 pt-5">
              <form action={logoutAction}>
                <Button variant="ghost" type="submit" className="h-9 w-full justify-start px-3 text-slate-600">
                  Log out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <div className="hidden w-px shrink-0 bg-slate-200 lg:block" aria-hidden />
        <main className="min-w-0 flex-1 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">MS test</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Signed in as <span className="font-semibold text-slate-900">{session.email}</span>
              </div>
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
