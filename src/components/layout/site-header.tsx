import Link from "next/link";

import { publicNavigation } from "@/lib/constants";
import { getCurrentSession, getDashboardPath } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getCurrentSession();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-blue-700">
          MS test
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {publicNavigation.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href={getDashboardPath(session.role)}>
              <Button variant="secondary">Open dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-700">
                Login
              </Link>
              <Link href="/signup">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
