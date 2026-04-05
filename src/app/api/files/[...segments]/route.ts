import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ segments: string[] }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { segments } = await context.params;
  const root = path.join(process.cwd(), "uploads");
  const requested = path.resolve(root, ...segments);

  if (!requested.startsWith(root)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  try {
    const buffer = await readFile(requested);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(requested)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
