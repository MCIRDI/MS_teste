import type { AssignmentRole, CampaignStage, Role } from "@/generated/prisma";

type Translate = (key: string) => string;

export function getPublicNavigation(t: Translate) {
  return [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/how-it-works", label: t("nav.howItWorks") },
    { href: "/login", label: t("nav.login") },
    { href: "/signup", label: t("nav.signup") },
  ] as const;
}

export function getRoleLabels(t: Translate): Record<Role, string> {
  return {
    ADMIN: t("roles.ADMIN"),
    CLIENT: t("roles.CLIENT"),
    TESTER: t("roles.TESTER"),
    CERT_TESTER: t("roles.CERT_TESTER"),
    MODERATOR: t("roles.MODERATOR"),
    TEST_MANAGER: t("roles.TEST_MANAGER"),
  };
}

export function getCampaignStageLabels(t: Translate): Record<CampaignStage, string> {
  return {
    DRAFT: t("campaignStages.DRAFT"),
    PENDING_APPROVAL: t("campaignStages.PENDING_APPROVAL"),
    ACTIVE: t("campaignStages.ACTIVE"),
    TESTING: t("campaignStages.TESTING"),
    BUG_REVIEW: t("campaignStages.BUG_REVIEW"),
    COMPLETED: t("campaignStages.COMPLETED"),
    ARCHIVED: t("campaignStages.ARCHIVED"),
  };
}

export function getAssignmentRoleLabels(t: Translate): Record<AssignmentRole, string> {
  return {
    CROWD_TESTER: t("assignmentRoles.CROWD_TESTER"),
    CERT_TESTER: t("assignmentRoles.CERT_TESTER"),
    MODERATOR: t("assignmentRoles.MODERATOR"),
    TEST_MANAGER: t("assignmentRoles.TEST_MANAGER"),
  };
}

export function getSoftwareTypes(t: Translate) {
  return [
    { value: "WEBSITE", label: t("softwareTypes.WEBSITE") },
    { value: "ANDROID_APP", label: t("softwareTypes.ANDROID_APP") },
    { value: "IOS_APP", label: t("softwareTypes.IOS_APP") },
    { value: "DESKTOP_SOFTWARE", label: t("softwareTypes.DESKTOP_SOFTWARE") },
  ] as const;
}

export function getRoleNavigation(t: Translate): Record<Role, { href: string; label: string }[]> {
  return {
    CLIENT: [
      { href: "/client/dashboard", label: t("roleNav.clientDashboard") },
      { href: "/client/campaigns/new", label: t("roleNav.clientCreateCampaign") },
      { href: "/client/reports", label: t("roleNav.clientReports") },
      { href: "/client/profile", label: t("roleNav.profile") },
    ],
    TESTER: [
      { href: "/tester/profile", label: t("roleNav.testerProfile") },
      { href: "/tester/vetting", label: t("roleNav.testerVetting") },
      { href: "/tester/setup", label: t("roleNav.testerSetup") },
      { href: "/tester/campaigns", label: t("roleNav.testerCampaigns") },
      { href: "/tester/bugs/new", label: t("roleNav.testerSubmitBug") },
    ],
    CERT_TESTER: [
      { href: "/tester/profile", label: t("roleNav.testerProfile") },
      { href: "/tester/setup", label: t("roleNav.testerSetup") },
      { href: "/tester/campaigns", label: t("roleNav.testerCampaigns") },
      { href: "/tester/bugs/new", label: t("roleNav.testerSubmitBug") },
    ],
    MODERATOR: [
      { href: "/moderator/review-queue", label: t("roleNav.moderatorInbox") },
      { href: "/moderator/disputes", label: t("roleNav.moderatorDisputes") },
      { href: "/moderator/campaigns", label: t("roleNav.moderatorCampaigns") },
      { href: "/moderator/reports/new", label: t("roleNav.moderatorSendReport") },
      { href: "/moderator/profile", label: t("roleNav.profile") },
    ],
    TEST_MANAGER: [
      { href: "/manager/dashboard", label: t("roleNav.managerDashboard") },
      { href: "/manager/validation", label: t("roleNav.managerValidation") },
      { href: "/manager/reports", label: t("roleNav.managerReports") },
      { href: "/manager/profile", label: t("roleNav.profile") },
    ],
    ADMIN: [
      { href: "/admin/users", label: t("roleNav.adminUsers") },
      { href: "/admin/disputes", label: t("roleNav.adminDisputes") },
      { href: "/admin/campaigns", label: t("roleNav.adminCampaigns") },
      { href: "/admin/settings", label: t("roleNav.adminSettings") },
      { href: "/admin/profile", label: t("roleNav.profile") },
    ],
  };
}

export function getHomeStats(t: Translate) {
  return [
    { label: t("home.stats.campaigns"), value: "320+" },
    { label: t("home.stats.testers"), value: "2,400+" },
    { label: t("home.stats.countries"), value: "40" },
    { label: t("home.stats.reviewTime"), value: "3h" },
  ];
}

export function getHomeFeatures(t: Translate) {
  return [
    {
      title: t("home.features.reviewTitle"),
      description: t("home.features.reviewDescription"),
    },
    {
      title: t("home.features.rutTitle"),
      description: t("home.features.rutDescription"),
    },
    {
      title: t("home.features.matchingTitle"),
      description: t("home.features.matchingDescription"),
    },
  ];
}
