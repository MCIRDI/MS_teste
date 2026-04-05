"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import { getDashboardPath, hashPassword, setSession, verifyPassword } from "@/lib/auth";
import { AccountStatus, Role, TesterKind, TokenType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema } from "@/lib/validation";

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const defaultState: ActionState = { success: false };

export async function signupAction(
  _: ActionState = defaultState,
  formData: FormData,
): Promise<ActionState> {
  void _;

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    testerKind: formData.get("testerKind") || undefined,
    country: formData.get("country"),
    language: formData.get("language"),
    testingExperience: formData.get("testingExperience") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return {
      success: false,
      message: "An account with this email already exists.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role as Role,
      testerKind:
        parsed.data.role === "TESTER"
          ? ((parsed.data.testerKind ?? "CROWD") as TesterKind)
          : null,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: false,
      country: parsed.data.country,
      language: parsed.data.language,
      testingExperience: parsed.data.testingExperience,
      emailTokens: {
        create: {
          token: randomUUID(),
          type: TokenType.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
      auditLogs: {
        create: {
          action: "ACCOUNT_CREATED",
          entityType: "User",
          entityId: "self",
          metadata: { role: parsed.data.role },
        },
      },
    },
  });

  await setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    testerKind: user.testerKind,
  });

  redirect(getDashboardPath(user.role));
}

export async function loginAction(
  _: ActionState = defaultState,
  formData: FormData,
): Promise<ActionState> {
  void _;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Enter a valid email and password.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return { success: false, message: "No account was found for that email." };
  }

  if (user.accountStatus === "SUSPENDED") {
    return { success: false, message: "This account is suspended." };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Incorrect password." };
  }

  await setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    testerKind: user.testerKind,
  });

  redirect(getDashboardPath(user.role));
}
