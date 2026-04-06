import { AssignmentRole, BugStatus, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/utils";

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
  const validatedBugs = bugReports.filter((bug) => bug.status === BugStatus.VALIDATED);
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
      { label: "Validated bugs", value: validatedBugs.length },
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
    })),
    severity: {
      critical: validatedBugs.filter((bug) => bug.severity === "CRITICAL").length,
      high: validatedBugs.filter((bug) => bug.severity === "HIGH").length,
      medium: validatedBugs.filter((bug) => bug.severity === "MEDIUM").length,
      low: validatedBugs.filter((bug) => bug.severity === "LOW").length,
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
      invitations: {
        include: {
          campaign: {
            include: {
              tasks: true,
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
          campaign: true,
        },
      },
      bugReports: true,
    },
  });

  return {
    tester,
    invitations: tester.invitations,
    assignments: tester.assignments,
    stats: [
      { label: "Pending invitations", value: tester.invitations.filter((item) => item.status === "PENDING").length },
      { label: "Accepted campaigns", value: tester.assignments.length },
      { label: "Submitted bugs", value: tester.bugReports.length },
      { label: "Devices", value: tester.devices.length },
    ],
  };
}

export async function getModeratorDashboardData(moderatorId: string) {
  const assignments = await prisma.campaignAssignment.findMany({
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
                in: [BugStatus.SUBMITTED, BugStatus.APPROVED, BugStatus.REJECTED],
              },
            },
            include: {
              tester: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const bugReports = assignments.flatMap((assignment) => assignment.campaign.bugReports);
  return {
    stats: [
      { label: "Assigned campaigns", value: assignments.length },
      { label: "Awaiting review", value: bugReports.filter((bug) => bug.status === BugStatus.SUBMITTED).length },
      { label: "Approved", value: bugReports.filter((bug) => bug.status === BugStatus.APPROVED).length },
      { label: "Rejected", value: bugReports.filter((bug) => bug.status === BugStatus.REJECTED).length },
    ],
    assignments,
    bugReports,
  };
}

export async function getManagerDashboardData(managerId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { testManagerId: managerId },
    include: {
      bugReports: true,
      assignments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bugReports = campaigns.flatMap((campaign) => campaign.bugReports);
  return {
    stats: [
      { label: "Managed campaigns", value: campaigns.length },
      { label: "Approved bugs", value: bugReports.filter((bug) => bug.status === BugStatus.APPROVED).length },
      { label: "Validated bugs", value: bugReports.filter((bug) => bug.status === BugStatus.VALIDATED).length },
      { label: "Moderators", value: campaigns.reduce((sum, campaign) => sum + campaign.assignments.filter((item) => item.assignmentRole === AssignmentRole.MODERATOR).length, 0) },
    ],
    campaigns,
    bugReports,
  };
}

export async function getAdminDashboardData() {
  const [users, totalUsers, totalCampaigns, totalBugs, suspendedUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.bugReport.count(),
    prisma.user.count({
      where: { accountStatus: "SUSPENDED" },
    }),
  ]);
  const campaigns = await prisma.campaign.findMany({
    include: {
      client: true,
      assignments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return {
    stats: [
      { label: "Users", value: totalUsers },
      { label: "Campaigns", value: totalCampaigns },
      { label: "Bugs", value: totalBugs },
      { label: "Suspended", value: suspendedUsers },
    ],
    users,
    campaigns,
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
    bugs: campaign.bugReports.filter((bug) => bug.status === BugStatus.VALIDATED),
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
