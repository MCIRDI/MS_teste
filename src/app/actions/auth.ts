"use server";

import { randomUUID } from "node:crypto";
import { redirectTo } from "@/lib/redirect";

import { getDashboardPath, hashPassword, setSession, verifyPassword, getSignupAccountStatus, getTesterPendingLoginMessage, isTesterLoginBlocked, shouldAutoActivateOnLogin, getTesterOnboardingPath, needsTesterOnboarding } from "@/lib/auth";
import { AccountStatus, Role, TokenType } from "@/generated/prisma";
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

  const languagesRaw = formData.getAll("languages");
  const languages =
    languagesRaw.length > 0
      ? languagesRaw.map(String)
      : splitList(String(formData.get("languages") ?? "fr"));

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    languages,
    deviceName: formData.get("deviceName") || undefined,
    osVersion: formData.get("osVersion") || undefined,
    browser: formData.get("browser") || undefined,
    screenResolution: formData.get("screenResolution") || undefined,
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
      accountStatus: getSignupAccountStatus(parsed.data.role as Role),
      isEmailVerified: false,
      languages: parsed.data.role === "TESTER" ? parsed.data.languages : [],
      devices:
        parsed.data.role === "TESTER"
          ? {
              create: {
                deviceName: parsed.data.deviceName,
                osVersion: parsed.data.osVersion,
                browsers: [parsed.data.browser],
                screenResolution: parsed.data.screenResolution,
              },
            }
          : undefined,
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
    isCertified: user.isCertified,
  });

  if (user.role === "TESTER") {
    return await redirectTo("/tester/location-setup");
  }

  return await redirectTo(getDashboardPath(user.role));
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

  if (isTesterLoginBlocked(user)) {
    return {
      success: false,
      message: getTesterPendingLoginMessage(user.vetingScore),
    };
  }

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED") {
    return { success: false, message: "This account is suspended." };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Incorrect password." };
  }

  if (shouldAutoActivateOnLogin(user)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: AccountStatus.ACTIVE },
    });
  }

  await setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isCertified: user.isCertified,
  });

  if (needsTesterOnboarding(user)) {
    return await redirectTo(getTesterOnboardingPath(user));
  }

  return await redirectTo(getDashboardPath(user.role));
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
