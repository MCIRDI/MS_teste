import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const SESSION_COOKIE = "ms-test-session";
const protectedAreas = ["/client", "/tester", "/moderator", "/manager", "/admin"];
const authPages = ["/login", "/signup"];

const rolePrefixes: Record<string, string[]> = {
  CLIENT: ["/client"],
  TESTER: ["/tester"],
  MODERATOR: ["/moderator"],
  TEST_MANAGER: ["/manager"],
  ADMIN: ["/admin"],
};

const intlMiddleware = createIntlMiddleware(routing);

function stripLocale(pathname: string) {
  const match = pathname.match(/^\/(en|fr|ar)(?=\/|$)/);
  if (!match) {
    return { locale: routing.defaultLocale, pathname };
  }

  const locale = match[1]!;
  const rest = pathname.slice(locale.length + 1) || "/";
  return { locale, pathname: rest };
}

function isProtectedPath(pathname: string) {
  return protectedAreas.some((segment) => pathname.startsWith(segment));
}

function getDashboardPath(role: string) {
  switch (role) {
    case "CLIENT":
      return "/client/dashboard";
    case "TESTER":
      return "/tester/campaigns";
    case "MODERATOR":
      return "/moderator/review-queue";
    case "TEST_MANAGER":
      return "/manager/dashboard";
    case "ADMIN":
    default:
      return "/admin/users";
  }
}

function localizedPath(locale: string, path: string) {
  return `/${locale}${path}`;
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { locale, pathname } = stripLocale(request.nextUrl.pathname);
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (authPages.includes(pathname) && token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
      );
      const { payload } = await jwtVerify(token, secret);
      return NextResponse.redirect(
        new URL(localizedPath(locale, getDashboardPath(String(payload.role))), request.url),
      );
    } catch {
      return intlResponse;
    }
  }

  if (!isProtectedPath(pathname)) {
    return intlResponse;
  }

  if (!token) {
    return NextResponse.redirect(new URL(localizedPath(locale, "/login"), request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
    );
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload.role);
    const allowedPrefixes = rolePrefixes[role] ?? [];

    if (!allowedPrefixes.some((segment) => pathname.startsWith(segment))) {
      return NextResponse.redirect(
        new URL(localizedPath(locale, getDashboardPath(role)), request.url),
      );
    }

    return intlResponse;
  } catch {
    return NextResponse.redirect(new URL(localizedPath(locale, "/login"), request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
