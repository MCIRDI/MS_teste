import {
  AssignmentRole,
  BugStatus,
  InvitationStatus,
  Role,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/utils";
import { computePriorityScore, makeGroupKey, severityRank } from "@/lib/moderation";

type BugEnvironment = {
  device?: string;
  osVersion?: string;
  browser?: string;
  screenResolution?: string;
};

export async function getClientDashboardData(clientId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    include: {
      invitations: true,
      assignments: true,
      bugReports: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bugReports = campaigns.flatMap((campaign) => campaign.bugReports);
  const approvedBugs = bugReports.filter((bug) => bug.status === BugStatus.APPROVED);
  const totalTesters = campaigns.reduce(
    (sum, campaign) =>
      sum +
      campaign.assignments.filter(
        (assignment) =>
          assignment.assignmentRole === AssignmentRole.CROWD_TESTER ||
          assignment.assignmentRole === AssignmentRole.DEVELOPER_TESTER,
      ).length,
    0,
  );
  const countries = new Set(
    campaigns.flatMap((campaign) => toStringArray(campaign.selectedCountries)),
  );
  const devices = new Set(
    campaigns.flatMap((campaign) => toStringArray(campaign.selectedPlatforms)),
  );

  return {
    stats: [
      { label: "Campaigns", value: campaigns.length },
      { label: "Active testers", value: totalTesters },
      { label: "Approved bugs", value: approvedBugs.length },
      { label: "Target countries", value: countries.size },
    ],
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.projectName,
      testers: campaign.assignments.filter(
        (assignment) =>
          assignment.assignmentRole === AssignmentRole.CROWD_TESTER ||
          assignment.assignmentRole === AssignmentRole.DEVELOPER_TESTER,
      ).length,
      bugs: campaign.bugReports.length,
      countries: toStringArray(campaign.selectedCountries).join(", "),
      devices: toStringArray(campaign.selectedPlatforms).join(", "),
      price: campaign.estimatedCost,
      pendingInvitations: campaign.invitations.filter(
        (invitation) => invitation.status === InvitationStatus.PENDING,
      ).length,
    })),
    severity: {
      critical: approvedBugs.filter((bug) => bug.severity === "CRITICAL").length,
      high: approvedBugs.filter((bug) => bug.severity === "HIGH").length,
      medium: approvedBugs.filter((bug) => bug.severity === "MEDIUM").length,
      low: approvedBugs.filter((bug) => bug.severity === "LOW").length,
    },
    coverage: {
      countries: Array.from(countries),
      devices: Array.from(devices),
    },
  };
}

export async function getTesterDashboardData(testerId: string) {
  const tester = await prisma.user.findUniqueOrThrow({
    where: { id: testerId },
    include: {
      devices: true,
      campaignInvitations: {
        where: {
          assignmentRole: {
            in: [AssignmentRole.CROWD_TESTER, AssignmentRole.DEVELOPER_TESTER],
          },
        },
        include: {
          campaign: {
            include: {
              tasks: true,
              assignments: true,
              invitations: true,
            },
          },
        },
        orderBy: { invitedAt: "desc" },
      },
      assignments: {
        where: {
          assignmentRole: {
            in: [AssignmentRole.CROWD_TESTER, AssignmentRole.DEVELOPER_TESTER],
          },
        },
        include: {
          campaign: {
            include: {
              tasks: true,
              invitations: true,
              assignments: true,
            },
          },
        },
      },
      bugReports: true,
    },
  });

  const pendingInvitations = tester.campaignInvitations.filter(
    (invitation) => invitation.status === InvitationStatus.PENDING,
  );

  return {
    tester,
    pendingInvitations,
    assignments: tester.assignments,
    stats: [
      { label: "Pending invitations", value: pendingInvitations.length },
      { label: "Accepted campaigns", value: tester.assignments.length },
      { label: "Submitted bugs", value: tester.bugReports.length },
      { label: "Devices", value: tester.devices.length },
    ],
  };
}

export async function getModeratorDashboardData(moderatorId: string) {
  const [pendingInvitations, assignments] = await Promise.all([
    prisma.campaignInvitation.findMany({
      where: {
        recipientId: moderatorId,
        assignmentRole: AssignmentRole.MODERATOR,
        status: InvitationStatus.PENDING,
      },
      include: {
        campaign: {
          include: {
            assignments: true,
            invitations: true,
          },
        },
      },
      orderBy: { invitedAt: "desc" },
    }),
    prisma.campaignAssignment.findMany({
      where: {
        userId: moderatorId,
        assignmentRole: AssignmentRole.MODERATOR,
      },
      include: {
        campaign: {
          include: {
            bugReports: {
              where: {
                status: {
                  in: [
                    BugStatus.SUBMITTED,
                    BugStatus.NEEDS_INFO,
                    BugStatus.DUPLICATE,
                    BugStatus.APPROVED,
                    BugStatus.REJECTED,
                  ],
                },
              },
              include: {
                tester: true,
                attachments: true,
              },
              orderBy: { createdAt: "desc" },
            },
            invitations: true,
            assignments: true,
          },
        },
      },
    }),
  ]);

  const bugReports = assignments.flatMap((assignment) => assignment.campaign.bugReports);

  const testerStats = await prisma.bugReport.groupBy({
    by: ["testerId", "status"],
    _count: { _all: true },
    where: {
      campaignId: { in: assignments.map((item) => item.campaignId) },
    },
  });
  const testerRatingById = new Map<string, number>();
  for (const row of testerStats) {
    const current = testerRatingById.get(row.testerId) ?? 3;
    const count = row._count._all;
    if (row.status === BugStatus.APPROVED) {
      testerRatingById.set(row.testerId, Math.min(5, current + count * 0.1));
    } else if (row.status === BugStatus.REJECTED) {
      testerRatingById.set(row.testerId, Math.max(0, current - count * 0.05));
    } else {
      testerRatingById.set(row.testerId, current);
    }
  }

  const grouped = new Map<string, typeof bugReports>();
  for (const bug of bugReports) {
    // `groupKey` is only meaningful within a single campaign.
    const key = `${bug.campaignId}:${bug.groupKey || makeGroupKey(bug)}`;
    const list = grouped.get(key) ?? [];
    list.push(bug);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.entries()).map(([compositeKey, items]) => {
    const [campaignId, ...rest] = compositeKey.split(":");
    const groupKey = rest.join(":");
    const representative = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    const duplicateCount = Math.max(0, items.length - 1);
    const env = representative.environment as unknown as BugEnvironment;
    const device = String(env.device ?? "Unknown device");
    const osVersion = String(env.osVersion ?? "");
    const browser = String(env.browser ?? "");
    const testerRating = testerRatingById.get(representative.testerId) ?? 3;
    const statusOrder = (status: BugStatus) => {
      switch (status) {
        case BugStatus.SUBMITTED:
          return 0;
        case BugStatus.NEEDS_INFO:
          return 1;
        case BugStatus.DUPLICATE:
          return 2;
        case BugStatus.APPROVED:
          return 3;
        case BugStatus.REJECTED:
          return 4;
        default:
          return 5;
      }
    };
    const groupStatus =
      [...items].sort((a, b) => statusOrder(a.status) - statusOrder(b.status))[0]?.status ??
      representative.status;

    const groupPriorityScore = computePriorityScore({
      severity: representative.severity,
      status: groupStatus,
      duplicateCount,
      testerRating,
      device,
      osVersion,
    });

    return {
      campaignId,
      groupKey,
      title: representative.title,
      feature: representative.feature,
      errorType: representative.errorType,
      pageUrl: representative.pageUrl,
      severity: representative.severity,
      status: groupStatus,
      representative,
      count: items.length,
      duplicateCount,
      latestAt: items.reduce(
        (latest, bug) => (bug.createdAt > latest ? bug.createdAt : latest),
        representative.createdAt,
      ),
      priorityScore: groupPriorityScore,
      deviceLabel: `${device}${browser ? ` / ${browser}` : ""}`,
      testerRating,
    };
  });

  groups.sort((a, b) => {
    const statusOrder = (status: BugStatus) => {
      switch (status) {
        case BugStatus.SUBMITTED:
          return 0;
        case BugStatus.NEEDS_INFO:
          return 1;
        case BugStatus.DUPLICATE:
          return 2;
        case BugStatus.APPROVED:
          return 3;
        case BugStatus.REJECTED:
          return 4;
        default:
          return 5;
      }
    };

    const diff = statusOrder(a.status) - statusOrder(b.status);
    if (diff !== 0) return diff;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (severityRank(b.severity) !== severityRank(a.severity)) return severityRank(b.severity) - severityRank(a.severity);
    return b.latestAt.getTime() - a.latestAt.getTime();
  });

  return {
    stats: [
      { label: "Pending invitations", value: pendingInvitations.length },
      { label: "Assigned campaigns", value: assignments.length },
      { label: "Awaiting review", value: bugReports.filter((bug) => bug.status === BugStatus.SUBMITTED).length },
      { label: "Needs info", value: bugReports.filter((bug) => bug.status === BugStatus.NEEDS_INFO).length },
    ],
    pendingInvitations,
    assignments,
    bugReports,
    groups,
  };
}

export async function getManagerDashboardData(managerId: string) {
  const [pendingInvitations, campaigns] = await Promise.all([
    prisma.campaignInvitation.findMany({
      where: {
        recipientId: managerId,
        assignmentRole: AssignmentRole.TEST_MANAGER,
        status: InvitationStatus.PENDING,
      },
      include: {
        campaign: {
          include: {
            assignments: true,
            invitations: true,
          },
        },
      },
      orderBy: { invitedAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { testManagerId: managerId },
      include: {
        bugReports: {
          include: {
            attachments: true,
            tester: true,
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: true,
        invitations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const bugReports = campaigns.flatMap((campaign) => campaign.bugReports);
  return {
    stats: [
      { label: "Pending invitations", value: pendingInvitations.length },
      { label: "Managed campaigns", value: campaigns.length },
      { label: "Approved bugs", value: bugReports.filter((bug) => bug.status === BugStatus.APPROVED).length },
    ],
    pendingInvitations,
    campaigns,
    bugReports,
  };
}

export async function getAdminDashboardData() {
  const [users, totalUsers, liveCampaigns, totalBugs, pendingStaffInvitations, pendingPromotions] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          receivedRoleUpgradeInvitations: {
            where: {
              status: InvitationStatus.PENDING,
            },
            orderBy: { invitedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.campaign.count({
        where: {
          stage: {
            in: ["ACTIVE", "TESTING", "BUG_REVIEW"],
          },
        },
      }),
      prisma.bugReport.count(),
      prisma.campaignInvitation.count({
        where: {
          status: InvitationStatus.PENDING,
        },
      }),
      prisma.roleUpgradeInvitation.count({
        where: {
          status: InvitationStatus.PENDING,
        },
      }),
    ]);

  const campaigns = await prisma.campaign.findMany({
    include: {
      client: true,
      assignments: true,
      invitations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    stats: [
      { label: "Users", value: totalUsers },
      { label: "Live campaigns", value: liveCampaigns },
      { label: "Pending staff invites", value: pendingStaffInvitations },
      { label: "Pending promotions", value: pendingPromotions },
    ],
    users,
    campaigns,
    totalBugs,
  };
}

export async function getAdminSettingsData() {
  const [managers, moderators, activeCampaigns] = await Promise.all([
    prisma.user.count({
      where: { role: Role.TEST_MANAGER },
    }),
    prisma.user.count({
      where: { role: Role.MODERATOR },
    }),
    prisma.campaign.count({
      where: {
        stage: {
          in: ["ACTIVE", "TESTING", "BUG_REVIEW"],
        },
      },
    }),
  ]);

  return {
    stats: [
      { label: "Managers", value: managers },
      { label: "Moderators", value: moderators },
      { label: "Active campaigns", value: activeCampaigns },
    ],
  };
}

export async function getClientReportsData(clientId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    include: {
      bugReports: true,
      finalReports: {
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.projectName,
    countries: toStringArray(campaign.selectedCountries),
    devices: toStringArray(campaign.selectedPlatforms),
    bugs: campaign.bugReports.filter((bug) => bug.status === BugStatus.APPROVED),
    finalReport: campaign.finalReports[0] ?? null,
    testers: campaign.assignments.filter(
      (assignment) =>
        assignment.assignmentRole === AssignmentRole.CROWD_TESTER ||
        assignment.assignmentRole === AssignmentRole.DEVELOPER_TESTER,
    ).length,
  }));
}

export async function getUsersByRole(role: Role) {
  return prisma.user.findMany({
    where: {
      role,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPendingRoleUpgradeInvitation(userId: string) {
  if (!("roleUpgradeInvitation" in prisma)) {
    return null;
  }
  return prisma.roleUpgradeInvitation.findFirst({
    where: {
      recipientId: userId,
      status: InvitationStatus.PENDING,
    },
    orderBy: { invitedAt: "desc" },
  });
}
