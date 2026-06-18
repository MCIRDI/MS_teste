import { z } from "zod";

const baseSignupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const signupSchema = z.discriminatedUnion("role", [
  baseSignupSchema.extend({
    role: z.literal("CLIENT"),
  }),
  baseSignupSchema.extend({
    role: z.literal("TESTER"),
    languages: z.array(z.enum(["ar", "fr", "en"])).min(1),
    deviceName: z.string().min(1),
    osVersion: z.string().min(1),
    browser: z.string().min(1),
    screenResolution: z.string().min(1),
  }),
]);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const createCampaignSchema = z.object({
  projectName: z.string().min(3),
  description: z.string().min(20),
  softwareType: z.enum(["WEBSITE", "ANDROID_APP", "IOS_APP", "DESKTOP_SOFTWARE"]),
  websiteUrl: z.url().optional().or(z.literal("")),
  testerLoginCredentials: z.string().optional(),
  selectedPlatforms: z.array(z.string()).min(1),
  selectedBrowsers: z.array(z.string()).min(1),
  targetCountries: z.array(z.string()).min(1),
  crowdTesterCount: z.coerce.number().int().min(0),
  certTesterCount: z.coerce.number().int().min(0),
  tasks: z.array(z.string()).min(1),
  softwareFilePath: z.string().optional(),
  isPremium: z.coerce.boolean().optional(),
});

export const bugReportSchema = z.object({
  campaignId: z.string().min(1),
  bugType: z.enum([
    "Functional Bugs",
    "UI / Visual Issues",
    "Performance Issues",
    "Crash / Critical Errors",
    "Compatibility Issues",
    "Usability Problems",
    "Security Issues",
    "Data Issues",
    "Network / API Issues",
    "Localization / Language Issues",
    "Installation / Setup Issues",
    "Edge Case Bugs",
    "Cultural Issues",
    "Other",
  ]),
  title: z.string().min(4),
  pageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().min(20),
  reproductionSteps: z.string().min(10),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  reportType: z.enum(["STANDARD", "API", "PERFORMANCE", "SECURITY", "DEVOPS"]).optional(),
});

export const passwordResetRequestSchema = z.object({
  email: z.email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});
