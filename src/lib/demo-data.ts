import type { Role } from "@/generated/prisma/client";

export const publicStats = [
  { label: "Campaigns coordinated", value: "320+" },
  { label: "Verified testers", value: "2,400+" },
  { label: "Countries covered", value: "40" },
  { label: "Median review time", value: "3h" },
];

export const publicFeatures = [
  {
    title: "Layered review flow",
    description:
      "Every bug passes through moderators and a test manager before it reaches the client dashboard.",
  },
  {
    title: "Real User Testing",
    description:
      "Get feedback from a diverse group of real users who test your product in real-world scenarios, helping you understand how people truly interact with it.",
  },
  {
    title: "Targeted tester matching",
    description:
      "Campaign invitations are filtered by country, devices, OS versions, browsers, and tester type.",
  },
];

export const clientSnapshot = {
  stats: [
    { label: "Active campaigns", value: "4" },
    { label: "Approved bugs", value: "61" },
    { label: "Device variants", value: "18" },
    { label: "Country coverage", value: "9" },
  ],
  campaigns: [
    {
      name: "Checkout reliability sprint",
      stage: "Testing phase",
      testers: 46,
      bugs: 18,
      coverage: "US, DE, PL",
    },
    {
      name: "Android onboarding pass",
      stage: "Bug review phase",
      testers: 28,
      bugs: 11,
      coverage: "BR, US",
    },
  ],
  severityBreakdown: [
    { label: "Critical", value: 3 },
    { label: "High", value: 8 },
    { label: "Medium", value: 19 },
    { label: "Low", value: 31 },
  ],
};

export const testerSnapshot = {
  invitations: [
    {
      campaignId: "seed-campaign",
      project: "Checkout reliability sprint",
      testerType: "Crowd tester",
      countries: "United States, Germany, Poland",
      focus: "Checkout, coupons, account creation",
    },
    {
      campaignId: "api-hardening",
      project: "API hardening pass",
      testerType: "Developer tester",
      countries: "United States, Brazil",
      focus: "Token refresh, rate limiting, auth edge cases",
    },
  ],
  workspaceTasks: [
    "Create a new account and verify activation.",
    "Browse products and complete checkout with and without coupons.",
    "Try malformed input and interrupted sessions.",
    "Document exact environment data for every issue found.",
  ],
};

export const moderatorSnapshot = {
  queue: [
    {
      id: "BUG-248",
      title: "Coupon accepted with expired code",
      tester: "Crowd Tester",
      severity: "High",
      duplicateRisk: "Low",
    },
    {
      id: "BUG-251",
      title: "Safari checkout spinner never resolves",
      tester: "Developer Tester",
      severity: "Critical",
      duplicateRisk: "Medium",
    },
  ],
};

export const managerSnapshot = {
  stats: [
    { label: "Campaigns in flight", value: "6" },
    { label: "Moderators active", value: "11" },
    { label: "Bugs awaiting validation", value: "14" },
    { label: "Coverage gaps", value: "3" },
  ],
};

export const adminSnapshot = {
  stats: [
    { label: "Pending approvals", value: "12" },
    { label: "Suspended accounts", value: "4" },
    { label: "Live campaigns", value: "17" },
    { label: "Fraud flags", value: "2" },
  ],
  users: [
    { name: "Ana Silva", role: "Tester", status: "Pending approval", country: "Brazil" },
    { name: "Martin Keller", role: "Client", status: "Active", country: "Germany" },
    { name: "Sofia Novak", role: "Moderator", status: "Active", country: "Poland" },
  ],
};

export function getRoleSummary(role: Role) {
  switch (role) {
    case "CLIENT":
      return "Launch campaigns, preview pricing, and monitor approved defects.";
    case "TESTER":
      return "Accept matching invitations, work through tasks, and submit structured bugs.";
    case "MODERATOR":
      return "Review incoming bugs, reject duplicates, and keep report quality high.";
    case "TEST_MANAGER":
      return "Coordinate the campaign, close coverage gaps, and publish final client-ready reports.";
    case "ADMIN":
    default:
      return "Manage accounts, platform assignments, campaign oversight, and system configuration.";
  }
}
