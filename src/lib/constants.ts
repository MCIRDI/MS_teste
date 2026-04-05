import type {
  AssignmentRole,
  CampaignStage,
  Role,
  TesterKind,
} from "@/generated/prisma/client";

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Signup" },
] as const;

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  CLIENT: "Client",
  TESTER: "Tester",
  MODERATOR: "Moderator",
  TEST_MANAGER: "Test Manager",
};

export const testerKindLabels: Record<TesterKind, string> = {
  CROWD: "Crowd tester",
  DEVELOPER: "Developer tester",
};

export const campaignStageLabels: Record<CampaignStage, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  TESTING: "Testing phase",
  BUG_REVIEW: "Bug review phase",
  COMPLETED: "Completed",
};

export const assignmentRoleLabels: Record<AssignmentRole, string> = {
  CROWD_TESTER: "Crowd tester",
  DEVELOPER_TESTER: "Developer tester",
  MODERATOR: "Moderator",
  TEST_MANAGER: "Test manager",
};

export const platforms = ["Android", "iOS", "Windows", "macOS", "Linux"] as const;
export const browsers = ["Chrome", "Firefox", "Safari", "Edge"] as const;
export const countries = ["United States", "Germany", "Poland", "Brazil"] as const;

export const softwareTypes = [
  { value: "WEBSITE", label: "Website" },
  { value: "ANDROID_APP", label: "Android app" },
  { value: "IOS_APP", label: "iOS app" },
  { value: "DESKTOP_SOFTWARE", label: "Desktop software" },
] as const;

export const roleNavigation: Record<Role, { href: string; label: string }[]> = {
  CLIENT: [
    { href: "/client/dashboard", label: "Dashboard" },
    { href: "/client/campaigns/new", label: "Create campaign" },
    { href: "/client/reports", label: "Campaign reports" },
  ],
  TESTER: [
    { href: "/tester/profile", label: "Profile" },
    { href: "/tester/campaigns", label: "Available campaigns" },
    { href: "/tester/bugs/new", label: "Submit bug" },
  ],
  MODERATOR: [
    { href: "/moderator/review-queue", label: "Review queue" },
    { href: "/moderator/campaigns/seed-campaign", label: "Campaign moderation" },
  ],
  TEST_MANAGER: [
    { href: "/manager/dashboard", label: "Project dashboard" },
    { href: "/manager/validation", label: "Bug validation" },
    { href: "/manager/reports", label: "Final reports" },
  ],
  ADMIN: [
    { href: "/admin/users", label: "User management" },
    { href: "/admin/campaigns", label: "Campaign monitoring" },
    { href: "/admin/settings", label: "System settings" },
  ],
};
