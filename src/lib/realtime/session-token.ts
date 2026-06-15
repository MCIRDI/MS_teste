import { jwtVerify } from "jose";

import type { Role } from "@/generated/prisma";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type VerifiedSession = {
  id: string;
  role: Role;
};

export async function verifySessionToken(token: string): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      id: String(payload.id),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
