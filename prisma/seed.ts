import {
  AccountStatus,
  AssignmentRole,
  CampaignStage,
  Role,
  SoftwareType,
  TesterKind,
} from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ""),
});

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mstest.local" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@mstest.local",
      passwordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "Hungary",
      language: "English",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@mstest.local" },
    update: {},
    create: {
      name: "Acme Product Team",
      email: "client@mstest.local",
      passwordHash,
      role: Role.CLIENT,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "Germany",
      language: "English",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@mstest.local" },
    update: {},
    create: {
      name: "Campaign Manager",
      email: "manager@mstest.local",
      passwordHash,
      role: Role.TEST_MANAGER,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "Poland",
      language: "English",
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@mstest.local" },
    update: {},
    create: {
      name: "Quality Moderator",
      email: "moderator@mstest.local",
      passwordHash,
      role: Role.MODERATOR,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "Brazil",
      language: "English",
    },
  });

  const tester = await prisma.user.upsert({
    where: { email: "tester@mstest.local" },
    update: {},
    create: {
      name: "Crowd Tester",
      email: "tester@mstest.local",
      passwordHash,
      role: Role.TESTER,
      testerKind: TesterKind.CROWD,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "United States",
      language: "English",
      testingExperience: "3 years of e-commerce and fintech exploratory testing.",
    },
  });

  await prisma.device.deleteMany({
    where: { userId: tester.id },
  });

  await prisma.device.createMany({
    data: [
      {
        userId: tester.id,
        deviceName: "iPhone 15",
        osVersion: "iOS 18",
        browsers: ["Safari", "Chrome"],
        screenResolution: "1179x2556",
      },
      {
        userId: tester.id,
        deviceName: "Lenovo ThinkPad",
        osVersion: "Windows 11",
        browsers: ["Chrome", "Firefox", "Edge"],
        screenResolution: "1920x1080",
      },
    ],
  });

  await prisma.campaign.upsert({
    where: { id: "seed-campaign" },
    update: {},
    create: {
      id: "seed-campaign",
      clientId: client.id,
      testManagerId: manager.id,
      projectName: "Checkout reliability sprint",
      description: "Cross-device checkout and coupon validation for a retail web app.",
      softwareType: SoftwareType.WEBSITE,
      websiteUrl: "https://demo.mstest.local",
      stage: CampaignStage.TESTING,
      crowdTesterCount: 40,
      developerTesterCount: 6,
      selectedCountries: ["United States", "Germany", "Poland"],
      selectedPlatforms: ["Windows", "macOS", "iOS", "Android"],
      selectedBrowsers: ["Chrome", "Firefox", "Safari", "Edge"],
      estimatedCost: 2160,
      moderatorSlots: 1,
      requirements: {
        summary: "Focus on cart, checkout, discounts, failed cards, and account creation.",
      },
      analytics: {
        totalBugs: 18,
        critical: 2,
        high: 4,
        medium: 8,
        low: 4,
      },
      tasks: {
        create: [
          {
            title: "Create account",
            description: "Register with a fresh email and verify the activation path.",
            orderIndex: 1,
          },
          {
            title: "Apply discount",
            description: "Attempt valid and invalid coupon combinations during checkout.",
            orderIndex: 2,
          },
          {
            title: "Force edge cases",
            description: "Use expired cards, refresh mid-flow, and retry failed checkout states.",
            orderIndex: 3,
          },
        ],
      },
      assignments: {
        create: [
          {
            userId: manager.id,
            assignmentRole: AssignmentRole.TEST_MANAGER,
            acceptedAt: new Date(),
          },
          {
            userId: moderator.id,
            assignmentRole: AssignmentRole.MODERATOR,
            acceptedAt: new Date(),
          },
          {
            userId: tester.id,
            assignmentRole: AssignmentRole.CROWD_TESTER,
            acceptedAt: new Date(),
          },
        ],
      },
    },
  });

  await prisma.auditLog.deleteMany({
    where: {
      action: "SEED_DATA_CREATED",
      entityId: "seed-campaign",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      campaignId: "seed-campaign",
      action: "SEED_DATA_CREATED",
      entityType: "Campaign",
      entityId: "seed-campaign",
      metadata: { source: "prisma/seed.ts" },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
