import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { saveUpload, type UploadCategory } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const category = String(formData.get("category") ?? "attachments") as UploadCategory;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const uploaded = await saveUpload(file, category);
  return NextResponse.json({ file: uploaded }, { status: 201 });
}
