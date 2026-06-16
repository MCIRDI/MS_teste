"use client";

import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/generated/prisma";
import { Link } from "@/i18n/routing";
import { getProfileCircleClass } from "@/lib/profile-circle";
import { cn } from "@/lib/utils";

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function ProfileMenu({
  name,
  role,
  profileHref,
  settingsHref,
  profileLabel,
  settingsLabel,
  logoutLabel,
}: {
  name: string;
  role: Role;
  profileHref: string | null;
  settingsHref: string | null;
  profileLabel: string;
  settingsLabel: string;
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex items-center justify-center rounded-full font-semibold transition hover:scale-105",
          getProfileCircleClass(role),
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={profileLabel}
      >
        {userInitials(name)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
        >
          {profileHref ? (
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {profileLabel}
            </Link>
          ) : null}
          {settingsHref ? (
            <Link
              href={settingsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {settingsLabel}
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className={cn(
                "block w-full px-4 py-2 text-start text-sm text-slate-700 transition hover:bg-slate-50",
                !profileHref && !settingsHref ? "" : "border-t border-slate-100",
              )}
            >
              {logoutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
