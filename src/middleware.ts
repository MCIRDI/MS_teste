import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import {
  getLocaleFromPathname,
  localizedPath,
  routing,
  stripLocalePrefix,
  hasLocalePrefix,
} from "@/i18n/routing";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(routing.defaultLocale, pathname);
    return NextResponse.redirect(url);
  }

  const intlResponse = intlMiddleware(request);

  if (intlResponse.headers.get("Location")) {
    return intlResponse;
  }

  const locale = getLocaleFromPathname(pathname) ?? routing.defaultLocale;
  const pathWithoutLocale = stripLocalePrefix(pathname);
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (authPages.includes(pathWithoutLocale) && token) {
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

  if (!isProtectedPath(pathWithoutLocale)) {
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

    if (!allowedPrefixes.some((segment) => pathWithoutLocale.startsWith(segment))) {
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
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
