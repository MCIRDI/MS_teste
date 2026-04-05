import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ms-test-session";
const protectedAreas = ["/client", "/tester", "/moderator", "/manager", "/admin"];

const rolePrefixes: Record<string, string[]> = {
  CLIENT: ["/client"],
  TESTER: ["/tester"],
  MODERATOR: ["/moderator"],
  TEST_MANAGER: ["/manager"],
  ADMIN: ["/admin"],
};

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
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if ((pathname === "/login" || pathname === "/signup") && token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
      );
      const { payload } = await jwtVerify(token, secret);
      return NextResponse.redirect(new URL(getDashboardPath(String(payload.role)), request.url));
    } catch {
      return NextResponse.next();
    }
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
    );
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload.role);
    const allowedPrefixes = rolePrefixes[role] ?? [];

    if (!allowedPrefixes.some((segment) => pathname.startsWith(segment))) {
      return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/client/:path*",
    "/tester/:path*",
    "/moderator/:path*",
    "/manager/:path*",
    "/admin/:path*",
  ],
};
