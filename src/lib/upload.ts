import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

export type UploadCategory = "screenshots" | "videos" | "logs" | "attachments";

const categoryMimeChecks: Record<UploadCategory, RegExp[]> = {
  screenshots: [/^image\//],
  videos: [/^video\//],
  logs: [/^text\//, /^application\/json$/, /^application\/zip$/],
  attachments: [/^image\//, /^video\//, /^text\//, /^application\//],
};

function getUploadRoot() {
  return path.join(process.cwd(), "uploads");
}

export async function ensureUploadDirectories() {
  const root = getUploadRoot();
  await Promise.all(
    (["screenshots", "videos", "logs", "attachments"] as const).map((segment) =>
      mkdir(path.join(root, segment), { recursive: true }),
    ),
  );
}

export function getUploadPath(category: UploadCategory, storedName: string) {
  return path.join(getUploadRoot(), category, storedName);
}

export function isValidUpload(file: File, category: UploadCategory) {
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  const allowed = categoryMimeChecks[category].some((regex) => regex.test(file.type));
  return allowed && file.size <= maxBytes;
}

export async function saveUpload(file: File, category: UploadCategory) {
  await ensureUploadDirectories();

  if (!isValidUpload(file, category)) {
    throw new Error(`Invalid file for ${category}.`);
  }

  const extension = path.extname(file.name) || "";
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = getUploadPath(category, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    originalName: file.name,
    storedName,
    relativePath: path.posix.join("uploads", category, storedName),
    sizeBytes: buffer.byteLength,
    mimeType: file.type || "application/octet-stream",
  };
}
