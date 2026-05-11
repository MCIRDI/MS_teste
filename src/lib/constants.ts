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
export const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;

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
    { href: "/tester/setup", label: "Testing info" },
    { href: "/tester/campaigns", label: "Available campaigns" },
    { href: "/tester/bugs/new", label: "Submit bug" },
  ],
  MODERATOR: [
    { href: "/moderator/review-queue", label: "Inbox" },
    { href: "/moderator/campaigns", label: "Campaigns" },
    { href: "/moderator/reports/new", label: "Send report" },
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
