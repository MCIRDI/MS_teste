import { TokenType } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordResetConfirmSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = passwordResetConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.emailToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.type !== TokenType.PASSWORD_RESET || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token is invalid or expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.emailToken.update({
      where: { token: parsed.data.token },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
