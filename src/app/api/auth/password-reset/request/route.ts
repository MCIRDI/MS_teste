import { TokenType } from "@/generated/prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { passwordResetRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = passwordResetRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = await prisma.emailToken.create({
    data: {
      userId: user.id,
      token: randomUUID(),
      type: TokenType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  return NextResponse.json({ ok: true, token: token.token });
}
