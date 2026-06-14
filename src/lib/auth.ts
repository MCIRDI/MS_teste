import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirectTo } from "@/lib/redirect";

import { env } from "@/lib/env";
import type { AccountStatus, Role } from "@/generated/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isCertified?: boolean;
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
      isCertified: payload.isCertified === true,
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]) {
  const session = await getCurrentSession();

  if (!session) {
    await redirectTo("/login");
    throw new Error("Redirecting to login");
  }

  if (roles && !roles.includes(session.role)) {
    await redirectTo(getDashboardPath(session.role));
    throw new Error("Redirecting to dashboard");
  }

  return session;
}

export function getDashboardPath(role: Role) {
  switch (role) {
    case "CLIENT":
      return "/client/dashboard";
    case "TESTER":
    case "CERT_TESTER":
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

export function getSignupAccountStatus(role: Role): AccountStatus {
  return role === "TESTER" ? "PENDING_APPROVAL" : "ACTIVE";
}

export function getTesterPendingLoginMessage(vetingScore: number | null) {
  return "Your account is pending administrator approval after passing vetting.";
}

export function isTesterLoginBlocked(user: {
  role: Role;
  accountStatus: AccountStatus;
  vetingScore: number | null;
}) {
  return (
    user.role === "TESTER" &&
    user.accountStatus === "PENDING_APPROVAL" &&
    (user.vetingScore ?? 0) >= 60
  );
}

export function hasPassedVetting(vetingScore: number | null) {
  return (vetingScore ?? 0) >= 60;
}

export function isAwaitingAdminAfterVetting(user: {
  role: Role;
  accountStatus: AccountStatus;
  vetingScore: number | null;
}) {
  return (
    user.role === "TESTER" &&
    user.accountStatus === "PENDING_APPROVAL" &&
    hasPassedVetting(user.vetingScore)
  );
}

export function needsTesterOnboarding(user: {
  role: Role;
  accountStatus: AccountStatus;
  country: string | null;
  vetingScore: number | null;
}) {
  if (user.role !== "TESTER" || user.accountStatus !== "PENDING_APPROVAL") {
    return false;
  }

  if (isAwaitingAdminAfterVetting(user)) {
    return false;
  }

  return !user.country || !hasPassedVetting(user.vetingScore);
}

export function getTesterOnboardingPath(user: {
  country: string | null;
  vetingScore: number | null;
}) {
  if (!user.country) {
    return "/tester/location-setup";
  }

  return "/tester/vetting";
}

export function shouldAutoActivateOnLogin(user: { role: Role; accountStatus: AccountStatus }) {
  return user.accountStatus === "PENDING_APPROVAL" && user.role !== "TESTER";
}
