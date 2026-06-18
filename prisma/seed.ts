import "dotenv/config";

import {
  AccountStatus,
  AssignmentRole,
  CampaignStage,
  Role,
  SoftwareType,
} from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dztesters.online" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@dztesters.online",
      passwordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr", "ar"],
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@dztesters.online" },
    update: {},
    create: {
      name: "Acme Product Team",
      email: "client@dztesters.online",
      passwordHash,
      role: Role.CLIENT,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr"],
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@dztesters.online" },
    update: {},
    create: {
      name: "Campaign Manager",
      email: "manager@dztesters.online",
      passwordHash,
      role: Role.TEST_MANAGER,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr"],
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@dztesters.online" },
    update: {},
    create: {
      name: "Quality Moderator",
      email: "moderator@dztesters.online",
      passwordHash,
      role: Role.MODERATOR,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr", "ar"],
    },
  });

  const tester = await prisma.user.upsert({
    where: { email: "tester@dztesters.online" },
    update: {},
    create: {
      name: "Crowd Tester",
      email: "tester@dztesters.online",
      passwordHash,
      role: Role.TESTER,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr", "ar"],
      testingExperience: "3 years of e-commerce and fintech exploratory testing.",
    },
  });

  const certTester = await prisma.user.upsert({
    where: { email: "cert@dztesters.online" },
    update: {},
    create: {
      name: "Certified Tester",
      email: "cert@dztesters.online",
      passwordHash,
      role: Role.CERT_TESTER,
      isCertified: true,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: true,
      country: "DZ",
      languages: ["fr", "en"],
      testingExperience: "API, performance and security testing specialist.",
      badges: ["cert_api"],
    },
  });

  await prisma.device.deleteMany({
    where: { userId: { in: [tester.id, certTester.id] } },
  });

  await prisma.device.createMany({
    data: [
      {
        userId: tester.id,
        deviceName: "Samsung Galaxy A54",
        osVersion: "Android 14",
        browsers: ["Chrome", "Firefox"],
        screenResolution: "1080x2400",
        operator: "Djezzy",
        connectionType: "4G",
      },
      {
        userId: certTester.id,
        deviceName: "Lenovo ThinkPad",
        osVersion: "Windows 11",
        browsers: ["Chrome", "Firefox", "Edge"],
        screenResolution: "1920x1080",
        connectionType: "WiFi",
      },
    ],
  });

  const existingCampaign = await prisma.campaign.findFirst({
    where: { projectName: "Checkout reliability sprint" },
  });

  const campaign =
    existingCampaign ??
    (await prisma.campaign.create({
      data: {
        clientId: client.id,
        testManagerId: manager.id,
        projectName: "Checkout reliability sprint",
        description: "Cross-device checkout and coupon validation for a retail web app.",
        softwareType: SoftwareType.WEBSITE,
        websiteUrl: "https://demo.dztesters.online",
        stage: CampaignStage.TESTING,
        crowdTesterCount: 40,
        certTesterCount: 6,
        targetCountries: ["DZ", "TN"],
        selectedPlatforms: ["Windows", "Android", "iOS"],
        selectedBrowsers: ["Chrome", "Firefox", "Safari"],
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
            {
              userId: certTester.id,
              assignmentRole: AssignmentRole.CERT_TESTER,
              acceptedAt: new Date(),
            },
          ],
        },
      },
    }));

  await prisma.auditLog.deleteMany({
    where: {
      action: "SEED_DATA_CREATED",
      entityId: campaign.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      campaignId: campaign.id,
      action: "SEED_DATA_CREATED",
      entityType: "Campaign",
      entityId: campaign.id,
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
