import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/rate-limit";
import { AccountStatus, Role, TesterKind, TokenType } from "@/generated/prisma/client";
import { signSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = consumeRateLimit(`signup:${ip}`, 10, 1000 * 60 * 10);

  if (!rate.ok) {
    return NextResponse.json({ error: "Too many signup attempts." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Account already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role as Role,
      testerKind:
        parsed.data.role === "TESTER"
          ? (parsed.data.testerKind as TesterKind)
          : null,
      accountStatus: AccountStatus.ACTIVE,
      country: parsed.data.role === "TESTER" ? parsed.data.country : null,
      language: parsed.data.role === "TESTER" ? parsed.data.language : null,
      devices:
        parsed.data.role === "TESTER"
          ? {
              create: {
                deviceName: parsed.data.deviceName,
                osVersion: "Not provided",
                browsers: [],
                screenResolution: "Not provided",
              },
            }
          : undefined,
      emailTokens: {
        create: {
          token: randomUUID(),
          type: TokenType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
    },
  });

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
