import Link from "next/link";
import type { ReactNode } from "react";

import { acceptRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { clearSession, type SessionUser } from "@/lib/auth";
import { getPendingRoleUpgradeInvitation } from "@/lib/dashboard-data";
import { getRoleSummary } from "@/lib/demo-data";
import type { Role } from "@/generated/prisma/client";
import { roleLabels, roleNavigation } from "@/lib/constants";
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

export async function AppShell({ session, children, title, description }: AppShellProps) {
  const items = roleNavigation[session.role as Role];
  const pendingRoleUpgrade = await getPendingRoleUpgradeInvitation(session.id);

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[32px] border border-stone-200 bg-white p-6 lg:block">
          <div className="space-y-1">
            <p className="text-sm text-stone-500">{roleLabels[session.role]}</p>
            <h2 className="text-xl font-semibold text-stone-900">{session.name}</h2>
            <p className="text-sm leading-6 text-stone-600">{getRoleSummary(session.role)}</p>
          </div>
          {pendingRoleUpgrade ? (
            <div className="mt-6 rounded-3xl bg-stone-900 px-4 py-4 text-sm text-stone-100">
              <p className="font-semibold text-white">Level upgrade available</p>
              <p className="mt-2 leading-6">
                Accept to move from {roleLabels[pendingRoleUpgrade.currentRole]} to{" "}
                {roleLabels[pendingRoleUpgrade.targetRole]}.
              </p>
              <form action={acceptRoleUpgradeInvitationAction} className="mt-4">
                <input type="hidden" name="invitationId" value={pendingRoleUpgrade.id} />
                <Button type="submit" className="w-full bg-white text-stone-900 hover:bg-stone-100">
                  Accept upgrade
                </Button>
              </form>
            </div>
          ) : null}
          <nav className="mt-8 space-y-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-8">
            <Button variant="secondary" type="submit" className="w-full">
              Log out
            </Button>
          </form>
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          <section className="rounded-[32px] border border-stone-200 bg-white px-6 py-8 shadow-[0_8px_30px_rgba(28,25,23,0.04)]">
            <p className="text-sm uppercase tracking-[0.18em] text-stone-500">MS test</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-serif text-4xl text-stone-900">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
              </div>
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
                Signed in as <span className="font-semibold text-stone-900">{session.email}</span>
              </div>
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
