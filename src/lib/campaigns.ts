import { AccountStatus, AssignmentRole, InvitationStatus, Role, TesterKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateModeratorSlots, toStringArray } from "@/lib/utils";

function matchesPlatforms(deviceName: string, osVersion: string, selectedPlatforms: string[]) {
  if (selectedPlatforms.length === 0) {
    return true;
  }

  const haystack = `${deviceName} ${osVersion}`.toLowerCase();
  return selectedPlatforms.some((platform) => {
    const target = platform.toLowerCase();
    if (haystack.includes(target)) {
      return true;
    }

    if (target === "ios") {
      return haystack.includes("iphone") || haystack.includes("ipad");
    }

    if (target === "android") {
      return haystack.includes("android") || haystack.includes("pixel") || haystack.includes("galaxy");
    }

    if (target === "windows") {
      return haystack.includes("windows") || haystack.includes("thinkpad") || haystack.includes("laptop") || haystack.includes("pc");
    }

    if (target === "macos") {
      return haystack.includes("mac") || haystack.includes("macbook") || haystack.includes("imac");
    }

    if (target === "linux") {
      return haystack.includes("linux") || haystack.includes("ubuntu");
    }

    return false;
  });
}

export async function assignCampaignStaff(campaignId: string, totalTesters: number) {
  const moderatorSlots = calculateModeratorSlots(totalTesters);
  const [manager, moderators] = await Promise.all([
    prisma.user.findFirst({
      where: {
        role: Role.TEST_MANAGER,
        accountStatus: AccountStatus.ACTIVE,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: Role.MODERATOR,
        accountStatus: AccountStatus.ACTIVE,
      },
      take: moderatorSlots,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (manager) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { testManagerId: manager.id },
    });

    await prisma.campaignAssignment.upsert({
      where: {
        campaignId_userId_assignmentRole: {
          campaignId,
          userId: manager.id,
          assignmentRole: AssignmentRole.TEST_MANAGER,
        },
      },
      update: { acceptedAt: new Date() },
      create: {
        campaignId,
        userId: manager.id,
        assignmentRole: AssignmentRole.TEST_MANAGER,
        acceptedAt: new Date(),
      },
    });
  }

  await Promise.all(
    moderators.map((moderator) =>
      prisma.campaignAssignment.upsert({
        where: {
          campaignId_userId_assignmentRole: {
            campaignId,
            userId: moderator.id,
            assignmentRole: AssignmentRole.MODERATOR,
          },
        },
        update: { acceptedAt: new Date() },
        create: {
          campaignId,
          userId: moderator.id,
          assignmentRole: AssignmentRole.MODERATOR,
          acceptedAt: new Date(),
        },
      }),
    ),
  );
}

export async function inviteMatchingTesters(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      invitations: true,
    },
  });

  if (!campaign) {
    return;
  }

  const selectedCountries = toStringArray(campaign.selectedCountries);
  const selectedPlatforms = toStringArray(campaign.selectedPlatforms);

  const testers = await prisma.user.findMany({
    where: {
      role: Role.TESTER,
      accountStatus: AccountStatus.ACTIVE,
      country: selectedCountries.length > 0 ? { in: selectedCountries } : undefined,
    },
    include: {
      devices: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const existingTesterIds = new Set(campaign.invitations.map((invitation) => invitation.testerId));
  const crowdTesters = testers.filter(
    (tester) =>
      tester.testerKind === TesterKind.CROWD &&
      !existingTesterIds.has(tester.id) &&
      tester.devices.some((device) =>
        matchesPlatforms(device.deviceName, device.osVersion, selectedPlatforms),
      ),
  );
  const developerTesters = testers.filter(
    (tester) =>
      tester.testerKind === TesterKind.DEVELOPER &&
      !existingTesterIds.has(tester.id) &&
      tester.devices.some((device) =>
        matchesPlatforms(device.deviceName, device.osVersion, selectedPlatforms),
      ),
  );

  const invitations = [
    ...crowdTesters.slice(0, campaign.crowdTesterCount).map((tester) => ({
      campaignId,
      testerId: tester.id,
      status: InvitationStatus.PENDING,
    })),
    ...developerTesters.slice(0, campaign.developerTesterCount).map((tester) => ({
      campaignId,
      testerId: tester.id,
      status: InvitationStatus.PENDING,
    })),
  ];

  if (invitations.length > 0) {
    await prisma.campaignInvitation.createMany({
      data: invitations,
      skipDuplicates: true,
    });
  }
}
