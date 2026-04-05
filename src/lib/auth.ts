import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import type { Role, TesterKind } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  testerKind?: TesterKind | null;
};

const SESSION_COOKIE = "ms-test-session";
const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setSession(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
      testerKind: payload.testerKind as TesterKind | null | undefined,
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (roles && !roles.includes(session.role)) {
    redirect(getDashboardPath(session.role));
  }

  return session;
}

export function getDashboardPath(role: Role) {
  switch (role) {
    case "CLIENT":
      return "/client/dashboard";
    case "TESTER":
      return "/tester/campaigns";
    case "MODERATOR":
      return "/moderator/review-queue";
    case "TEST_MANAGER":
      return "/manager/dashboard";
    case "ADMIN":
    default:
      return "/admin/users";
  }
}
