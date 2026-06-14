import {
  AccountStatus,
  AssignmentRole,
  InvitationStatus,
  Prisma,
  Role,
  type Campaign,
} from "@/generated/prisma";

import { prisma } from "@/lib/prisma";

type CampaignSlotConfig = Pick<
  Campaign,
  "crowdTesterCount" | "certTesterCount" | "moderatorSlots"
>;

type CampaignInvitationSession = {
  id: string;
  role: Role;
  isCertified?: boolean;
};

export type AcceptCampaignInvitationResult = {
  status: "accepted" | "full" | "unavailable";
  campaignId: string | null;
  assignmentRole: AssignmentRole | null;
};

function getTesterAssignmentRole(isCertified?: boolean) {
  return isCertified ? AssignmentRole.CERT_TESTER : AssignmentRole.CROWD_TESTER;
}

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

export function getCampaignRequiredSlots(
  campaign: CampaignSlotConfig,
  assignmentRole: AssignmentRole,
) {
  switch (assignmentRole) {
    case AssignmentRole.TEST_MANAGER:
      return 1;
    case AssignmentRole.MODERATOR:
      return campaign.moderatorSlots;
    case AssignmentRole.CROWD_TESTER:
      return campaign.crowdTesterCount;
    case AssignmentRole.CERT_TESTER:
      return campaign.certTesterCount;
    default:
      return 0;
  }
}

function canSessionAcceptInvitation(
  assignmentRole: AssignmentRole,
  session: CampaignInvitationSession,
) {
  switch (assignmentRole) {
    case AssignmentRole.TEST_MANAGER:
      return session.role === Role.TEST_MANAGER;
    case AssignmentRole.MODERATOR:
      return session.role === Role.MODERATOR;
    case AssignmentRole.CROWD_TESTER:
      return session.role === Role.TESTER && !session.isCertified;
    case AssignmentRole.CERT_TESTER:
      return (
        (session.role === Role.TESTER || session.role === Role.CERT_TESTER) &&
        Boolean(session.isCertified)
      );
    default:
      return false;
  }
}

function resolveInvitationAssignmentRole(
  assignmentRole: AssignmentRole,
  session: CampaignInvitationSession,
) {
  if (
    (session.role === Role.TESTER || session.role === Role.CERT_TESTER) &&
    (assignmentRole === AssignmentRole.CROWD_TESTER || assignmentRole === AssignmentRole.CERT_TESTER)
  ) {
    return getTesterAssignmentRole(session.isCertified);
  }

  return assignmentRole;
}

async function expirePendingCampaignInvitations(
  tx: Prisma.TransactionClient,
  campaignId: string,
  assignmentRole: AssignmentRole,
  excludeInvitationId?: string,
) {
  await tx.campaignInvitation.updateMany({
    where: {
      campaignId,
      assignmentRole,
      status: InvitationStatus.PENDING,
      id: excludeInvitationId ? { not: excludeInvitationId } : undefined,
    },
    data: {
      status: InvitationStatus.EXPIRED,
      expiresAt: new Date(),
    },
  });
}

export async function inviteCampaignParticipants(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      invitations: true,
      assignments: true,
    },
  });

  if (!campaign) {
    return;
  }

  const targetCountries = campaign.targetCountries;
  const selectedPlatforms = campaign.selectedPlatforms;
  const invitationKeys = new Set(
    campaign.invitations.map((invitation) => `${invitation.recipientId}:${invitation.assignmentRole}`),
  );
  const assignmentKeys = new Set(
    campaign.assignments.map((assignment) => `${assignment.userId}:${assignment.assignmentRole}`),
  );
  const invitations: {
    campaignId: string;
    recipientId: string;
    assignmentRole: AssignmentRole;
    status: InvitationStatus;
  }[] = [];

  const activeManagerCount = campaign.assignments.filter(
    (assignment) => assignment.assignmentRole === AssignmentRole.TEST_MANAGER,
  ).length;
  if (activeManagerCount < getCampaignRequiredSlots(campaign, AssignmentRole.TEST_MANAGER)) {
    const managers = await prisma.user.findMany({
      where: {
        role: Role.TEST_MANAGER,
        accountStatus: AccountStatus.ACTIVE,
      },
      orderBy: { createdAt: "asc" },
    });

    invitations.push(
      ...managers
        .filter(
          (manager) =>
            !invitationKeys.has(`${manager.id}:${AssignmentRole.TEST_MANAGER}`) &&
            !assignmentKeys.has(`${manager.id}:${AssignmentRole.TEST_MANAGER}`),
        )
        .map((manager) => ({
          campaignId,
          recipientId: manager.id,
          assignmentRole: AssignmentRole.TEST_MANAGER,
          status: InvitationStatus.PENDING,
        })),
    );
  }

  const activeModeratorCount = campaign.assignments.filter(
    (assignment) => assignment.assignmentRole === AssignmentRole.MODERATOR,
  ).length;
  if (activeModeratorCount < getCampaignRequiredSlots(campaign, AssignmentRole.MODERATOR)) {
    const moderators = await prisma.user.findMany({
      where: {
        role: Role.MODERATOR,
        accountStatus: AccountStatus.ACTIVE,
      },
      orderBy: { createdAt: "asc" },
    });

    invitations.push(
      ...moderators
        .filter(
          (moderator) =>
            !invitationKeys.has(`${moderator.id}:${AssignmentRole.MODERATOR}`) &&
            !assignmentKeys.has(`${moderator.id}:${AssignmentRole.MODERATOR}`),
        )
        .map((moderator) => ({
          campaignId,
          recipientId: moderator.id,
          assignmentRole: AssignmentRole.MODERATOR,
          status: InvitationStatus.PENDING,
        })),
    );
  }

  const crowdAssignmentCount = campaign.assignments.filter(
    (assignment) => assignment.assignmentRole === AssignmentRole.CROWD_TESTER,
  ).length;
  const certAssignmentCount = campaign.assignments.filter(
    (assignment) => assignment.assignmentRole === AssignmentRole.CERT_TESTER,
  ).length;

  const pendingCrowdInvites = campaign.invitations.filter(
    (invitation) => invitation.assignmentRole === AssignmentRole.CROWD_TESTER,
  ).length;
  const pendingCertInvites = campaign.invitations.filter(
    (invitation) => invitation.assignmentRole === AssignmentRole.CERT_TESTER,
  ).length;

  const crowdSlotsToFill = Math.max(
    0,
    campaign.crowdTesterCount - crowdAssignmentCount - pendingCrowdInvites,
  );
  const certSlotsToFill = Math.max(
    0,
    campaign.certTesterCount - certAssignmentCount - pendingCertInvites,
  );

  if (crowdSlotsToFill > 0 || certSlotsToFill > 0) {
    const testers = await prisma.user.findMany({
      where: {
        role: { in: [Role.TESTER, Role.CERT_TESTER] },
        accountStatus: AccountStatus.ACTIVE,
        country: targetCountries.length > 0 ? { in: targetCountries } : undefined,
      },
      include: {
        devices: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const invitedRecipientIds = new Set<string>();

    const queueTesterInvites = (
      certified: boolean,
      limit: number,
      requirePlatformMatch: boolean,
    ) => {
      let created = 0;
      const assignmentRole = certified
        ? AssignmentRole.CERT_TESTER
        : AssignmentRole.CROWD_TESTER;

      for (const tester of testers) {
        if (created >= limit) {
          break;
        }

        if (tester.isCertified !== certified) {
          continue;
        }

        if (invitedRecipientIds.has(tester.id)) {
          continue;
        }

        if (assignmentKeys.has(`${tester.id}:${assignmentRole}`)) {
          continue;
        }

        if (requirePlatformMatch) {
          const fits = (tester.devices ?? []).some((device) =>
            matchesPlatforms(device.deviceName, device.osVersion, selectedPlatforms),
          );

          if (!fits) {
            continue;
          }
        }

        invitations.push({
          campaignId,
          recipientId: tester.id,
          assignmentRole,
          status: InvitationStatus.PENDING,
        });
        invitedRecipientIds.add(tester.id);
        created += 1;
      }

      return created;
    };

    const invitedCrowdMatches = queueTesterInvites(false, crowdSlotsToFill, true);
    const crowdFallback = Math.max(0, crowdSlotsToFill - invitedCrowdMatches);
    if (crowdFallback > 0) {
      queueTesterInvites(false, crowdFallback, false);
    }

    const invitedCertMatches = queueTesterInvites(true, certSlotsToFill, true);
    const certFallback = Math.max(0, certSlotsToFill - invitedCertMatches);
    if (certFallback > 0) {
      queueTesterInvites(true, certFallback, false);
    }
  }

  if (invitations.length > 0) {
    await prisma.campaignInvitation.createMany({
      data: invitations,
    });
  }
}

export async function acceptCampaignInvitation(
  invitationId: string,
  session: CampaignInvitationSession,
): Promise<AcceptCampaignInvitationResult> {
  if (!invitationId) {
    return { status: "unavailable", campaignId: null, assignmentRole: null };
  }

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.campaignInvitation.findUnique({
      where: { id: invitationId },
      include: {
        campaign: true,
      },
    });

    if (!invitation || invitation.recipientId !== session.id) {
      return { status: "unavailable", campaignId: null, assignmentRole: null };
    }

    const assignmentRole = resolveInvitationAssignmentRole(
      invitation.assignmentRole,
      session,
    );

    if (!canSessionAcceptInvitation(assignmentRole, session)) {
      return {
        status: "unavailable",
        campaignId: invitation.campaignId,
        assignmentRole,
      };
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return {
        status: invitation.status === InvitationStatus.ACCEPTED ? "accepted" : "unavailable",
        campaignId: invitation.campaignId,
        assignmentRole,
      };
    }

    const requiredSlots = getCampaignRequiredSlots(invitation.campaign, assignmentRole);

    if (requiredSlots <= 0) {
      await tx.campaignInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.EXPIRED,
          expiresAt: new Date(),
        },
      });

      return {
        status: "full",
        campaignId: invitation.campaignId,
        assignmentRole,
      };
    }

    const acceptedCount = await tx.campaignAssignment.count({
      where: {
        campaignId: invitation.campaignId,
        assignmentRole,
      },
    });

    if (acceptedCount >= requiredSlots) {
      await expirePendingCampaignInvitations(tx, invitation.campaignId, assignmentRole);

      return {
        status: "full",
        campaignId: invitation.campaignId,
        assignmentRole,
      };
    }

    const acceptedAt = new Date();
    await tx.campaignInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt,
        expiresAt: null,
      },
    });

    await tx.campaignAssignment.upsert({
      where: {
        campaignId_userId_assignmentRole: {
          campaignId: invitation.campaignId,
          userId: session.id,
          assignmentRole,
        },
      },
      update: {
        acceptedAt,
      },
      create: {
        campaignId: invitation.campaignId,
        userId: session.id,
        assignmentRole,
        acceptedAt,
      },
    });

    if (assignmentRole === AssignmentRole.TEST_MANAGER) {
      await tx.campaign.update({
        where: { id: invitation.campaignId },
        data: { testManagerId: session.id },
      });
    }

    if (acceptedCount + 1 >= requiredSlots) {
      await expirePendingCampaignInvitations(
        tx,
        invitation.campaignId,
        assignmentRole,
        invitation.id,
      );
    }

    return {
      status: "accepted",
      campaignId: invitation.campaignId,
      assignmentRole,
    };
  });
}
