import { sendRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { roleLabels } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { Button } from "@/components/ui/button";

function getUpgradeLabel(role: string) {
  switch (role) {
    case "TESTER":
      return "Invite to moderator";
    case "MODERATOR":
      return "Invite to manager";
    default:
      return null;
  }
}

export default async function AdminUsersPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <StatGrid items={data.stats} />
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Users"
          title="Account management"
          description="Admins approve or suspend accounts and can elevate users into moderator or test manager roles."
        />
        <div className="overflow-hidden rounded-3xl border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Pending upgrade</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-t border-stone-200 align-top">
                  <td className="px-4 py-4 text-stone-900">{user.name}</td>
                  <td className="px-4 py-4 text-stone-600">{roleLabels[user.role]}</td>
                  <td className="px-4 py-4 text-stone-600">{user.accountStatus}</td>
                  <td className="px-4 py-4 text-stone-600">{user.country ?? "Not set"}</td>
                  <td className="px-4 py-4 text-stone-600">
                    {user.receivedRoleUpgradeInvitations[0]
                      ? roleLabels[user.receivedRoleUpgradeInvitations[0].targetRole]
                      : "None"}
                  </td>
                  <td className="px-4 py-4">
                    {getUpgradeLabel(user.role) &&
                    user.accountStatus === "ACTIVE" &&
                    !user.receivedRoleUpgradeInvitations[0] ? (
                      <form action={sendRoleUpgradeInvitationAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <Button type="submit" variant="secondary">
                          {getUpgradeLabel(user.role)}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-sm text-stone-500">
                        {getUpgradeLabel(user.role) ? "Invitation already pending" : "Not eligible"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
