import { NextResponse } from "next/server";

import { getCurrentSession, signSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const token = await signSession(session);
  const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "ws://127.0.0.1:3031/ws";

  return NextResponse.json({
    token,
    wsUrl,
    userId: session.id,
    role: session.role,
  });
}
