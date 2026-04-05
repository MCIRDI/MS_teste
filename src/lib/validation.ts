import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["CLIENT", "TESTER"]),
  testerKind: z.enum(["CROWD", "DEVELOPER"]).optional(),
  country: z.string().min(2),
  language: z.string().min(2),
  testingExperience: z.string().optional(),
});

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
  selectedCountries: z.array(z.string()).min(1),
  crowdTesterCount: z.coerce.number().int().min(0),
  developerTesterCount: z.coerce.number().int().min(0),
  tasks: z.array(z.string()).min(1),
  softwareFilePath: z.string().optional(),
});

export const bugReportSchema = z.object({
  campaignId: z.string().min(1),
  title: z.string().min(4),
  description: z.string().min(20),
  reproductionSteps: z.string().min(10),
  expectedResult: z.string().min(5),
  actualResult: z.string().min(5),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  device: z.string().min(2),
  osVersion: z.string().min(2),
  browser: z.string().min(2),
  screenResolution: z.string().min(2),
});

export const passwordResetRequestSchema = z.object({
  email: z.email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});
