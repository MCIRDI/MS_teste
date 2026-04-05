import { TokenType } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const record = await prisma.emailToken.findUnique({ where: { token } });

  if (!record || record.type !== TokenType.EMAIL_VERIFICATION || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token is invalid or expired." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.emailToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
