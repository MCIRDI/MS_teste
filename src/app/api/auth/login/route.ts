import { NextResponse } from "next/server";

import { signSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = consumeRateLimit(`login:${ip}`, 20, 1000 * 60 * 10);

  if (!rate.ok) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await signSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    testerKind: user.testerKind,
  });

  const response = NextResponse.json({
    user: { id: user.id, role: user.role, email: user.email },
  });

  response.cookies.set("ms-test-session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
