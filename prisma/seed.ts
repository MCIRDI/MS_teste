import "dotenv/config";

import {
  AccountStatus,
  AssignmentRole,
  BugSeverity,
  BugStatus,
  CampaignStage,
  ReportType,
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

  // ── Bug Reports ──────────────────────────────────────────────────────────
  await prisma.bugReport.deleteMany({ where: { campaignId: campaign.id, groupKey: "seed" } });

  await prisma.bugReport.createMany({
    data: [
      {
        campaignId: campaign.id,
        testerId: tester.id,
        moderatorId: moderator.id,
        groupKey: "seed",
        title: "Coupon code not applied at checkout",
        pageUrl: "https://demo.dztesters.online/checkout",
        feature: "Checkout / Discounts",
        errorType: "Functional",
        description:
          "When a valid coupon code is entered during checkout, the discount is not reflected in the order summary. The total remains unchanged.",
        reproductionSteps:
          "1. Add any item to cart.\n2. Proceed to checkout.\n3. Enter coupon code SUMMER20.\n4. Click 'Apply'.\n5. Observe that the order total does not change.",
        expectedResult: "A 20% discount should be applied to the order total.",
        actualResult: "Order total stays the same; no error message is shown.",
        severity: BugSeverity.HIGH,
        reportType: ReportType.STANDARD,
        status: BugStatus.APPROVED,
        moderationNotes: "Reproduced on Chrome and Firefox. Confirmed valid coupon logic is broken.",
        moderatedAt: new Date(),
        environment: {
          device: "Samsung Galaxy A54",
          os: "Android 14",
          browser: "Chrome 124",
          resolution: "1080x2400",
          connection: "4G",
        },
        language: "fr",
      },
      {
        campaignId: campaign.id,
        testerId: certTester.id,
        moderatorId: moderator.id,
        groupKey: "seed",
        title: "Payment fails with expired card — no user feedback",
        pageUrl: "https://demo.dztesters.online/checkout/payment",
        feature: "Checkout / Payment",
        errorType: "UX / Error Handling",
        description:
          "Using an expired credit card during checkout causes a silent failure. The page reloads without any error message, leaving the user confused.",
        reproductionSteps:
          "1. Add an item to cart and proceed to checkout.\n2. Fill in expired card details (e.g., 12/22).\n3. Click 'Pay Now'.\n4. Observe the page behavior.",
        expectedResult: "A clear error message should inform the user that the card is expired.",
        actualResult: "Page reloads silently; cart remains full; no feedback given.",
        severity: BugSeverity.CRITICAL,
        reportType: ReportType.STANDARD,
        status: BugStatus.APPROVED,
        moderationNotes: "Critical UX issue. Reproduced consistently across all tested browsers.",
        moderatedAt: new Date(),
        environment: {
          device: "Lenovo ThinkPad",
          os: "Windows 11",
          browser: "Firefox 125",
          resolution: "1920x1080",
          connection: "WiFi",
        },
        language: "fr",
      },
      {
        campaignId: campaign.id,
        testerId: tester.id,
        groupKey: "seed",
        title: "Account registration form accepts invalid email format",
        pageUrl: "https://demo.dztesters.online/register",
        feature: "Account Creation",
        errorType: "Validation",
        description:
          "The registration form allows submission with a malformed email address (e.g., 'user@' or 'plaintext'). No client-side or server-side validation error is triggered.",
        reproductionSteps:
          "1. Navigate to /register.\n2. Enter 'test@' in the email field.\n3. Fill in the remaining fields with valid data.\n4. Click 'Register'.\n5. Observe that the form submits successfully.",
        expectedResult: "Validation error: 'Please enter a valid email address.'",
        actualResult: "Form submits and creates an account with an invalid email.",
        severity: BugSeverity.MEDIUM,
        reportType: ReportType.STANDARD,
        status: BugStatus.SUBMITTED,
        environment: {
          device: "Samsung Galaxy A54",
          os: "Android 14",
          browser: "Chrome 124",
          resolution: "1080x2400",
          connection: "4G",
        },
        language: "fr",
      },
      {
        campaignId: campaign.id,
        testerId: certTester.id,
        groupKey: "seed",
        title: "Cart quantity update causes incorrect stock display",
        pageUrl: "https://demo.dztesters.online/cart",
        feature: "Cart",
        errorType: "Data Integrity",
        description:
          "Updating item quantity in the cart via the '+'/'-' buttons updates the visual count but the stock indicator does not refresh accordingly, showing stale availability data.",
        reproductionSteps:
          "1. Add an item with limited stock (e.g., qty 3 available) to cart.\n2. Increase quantity to 3 using the '+' button.\n3. Observe the 'In stock' label — it still shows the original available quantity.",
        expectedResult: "Stock indicator should update dynamically to reflect reserved quantity.",
        actualResult: "Stock label remains unchanged after quantity update.",
        severity: BugSeverity.LOW,
        reportType: ReportType.STANDARD,
        status: BugStatus.SUBMITTED,
        environment: {
          device: "Lenovo ThinkPad",
          os: "Windows 11",
          browser: "Edge 124",
          resolution: "1920x1080",
          connection: "WiFi",
        },
        language: "fr",
      },
    ],
  });

  // ── Audit Log ─────────────────────────────────────────────────────────────
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
