import { redirectTo } from "@/lib/redirect";

import { requireSession } from "@/lib/auth";

export default async function TesterSetupPage() {
  await requireSession(["TESTER"]);
  await redirectTo("/tester/campaigns");
}

