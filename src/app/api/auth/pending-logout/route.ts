import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { env } from "@/lib/env";

const SESSION_COOKIE = "ms-test-session";

export async function GET(request: NextRequest) {
  const base = env.APP_URL || request.nextUrl.origin;
  const response = NextResponse.redirect(`${base}/login?status=pending-approval`);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
