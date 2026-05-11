import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";

export default async function TesterSetupPage() {
  await requireSession(["TESTER"]);
  redirect("/tester/campaigns");
}

