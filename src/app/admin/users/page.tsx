import { sendRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { roleLabels } from "@/lib/constants";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
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
      <Card padding="none">
        <CardHeader>
          <SectionHeading
            density="panel"
            eyebrow="Users"
            title="Account management"
            description="Approve or suspend accounts and elevate users into moderator or test manager roles."
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90 px-0 pb-0 pt-0">
          <div className="overflow-x-auto px-5 pb-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Country</th>
                    <th>Pending upgrade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="font-medium text-slate-900">{user.name}</td>
                      <td>{roleLabels[user.role]}</td>
                      <td>{user.accountStatus}</td>
                      <td>{user.country ?? "Not set"}</td>
                      <td>
                        {user.receivedRoleUpgradeInvitations[0]
                          ? roleLabels[user.receivedRoleUpgradeInvitations[0].targetRole]
                          : "None"}
                      </td>
                      <td>
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
                          <span className="text-sm text-slate-500">
                            {getUpgradeLabel(user.role) ? "Invitation already pending" : "Not eligible"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardSection>
      </Card>
    </div>
  );
}
