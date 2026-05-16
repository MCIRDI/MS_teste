import { getTranslations } from "next-intl/server";

import { sendRoleUpgradeInvitationAction } from "@/app/actions/admin";
import { LiveRefresh } from "@/components/live-refresh";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getLocalizedLabels } from "@/lib/i18n-server";

function getUpgradeLabel(role: string, t: (key: string) => string) {
  switch (role) {
    case "TESTER":
      return t("inviteModerator");
    case "MODERATOR":
      return t("inviteManager");
    default:
      return null;
  }
}

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.home");
  const { roleLabels } = await getLocalizedLabels();
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <LiveRefresh />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/campaigns"
          className="bento-card flex items-center gap-3 p-4 transition hover:border-blue-200"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">📊</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("quickLinks.campaigns")}</p>
            <p className="text-xs text-slate-500">{t("quickLinks.campaignsDesc")}</p>
          </div>
        </Link>
        <Link
          href="/admin/settings"
          className="bento-card flex items-center gap-3 p-4 transition hover:border-blue-200"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg">⚙️</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("quickLinks.settings")}</p>
            <p className="text-xs text-slate-500">{t("quickLinks.settingsDesc")}</p>
          </div>
        </Link>
        <div className="bento-card flex items-center gap-3 border-dashed border-blue-200/80 bg-blue-50/50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            🐛
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("quickLinks.bugs")}</p>
            <p className="text-xs text-slate-500">{data.totalBugs} {t("quickLinks.bugsTotal")}</p>
          </div>
        </div>
      </div>

      <StatGrid items={data.stats} />

      <Card padding="none" className="overflow-hidden border-slate-200/90 shadow-sm">
        <CardHeader className="border-0 bg-gradient-to-r from-slate-50 to-blue-50/50">
          <SectionHeading
            density="panel"
            eyebrow={t("users.eyebrow")}
            title={t("users.title")}
            description={t("users.description")}
          />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90 px-0 pb-0 pt-0">
          <div className="overflow-x-auto px-4 pb-4 md:px-5 md:pb-5">
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-inner shadow-slate-100/50">
              <table className="saas-table">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                    <th>{t("users.columns.name")}</th>
                    <th>{t("users.columns.role")}</th>
                    <th>{t("users.columns.status")}</th>
                    <th>{t("users.columns.country")}</th>
                    <th>{t("users.columns.upgrade")}</th>
                    <th>{t("users.columns.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="font-medium text-slate-900">{user.name}</td>
                      <td>
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                            user.accountStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : user.accountStatus === "SUSPENDED"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {user.accountStatus}
                        </span>
                      </td>
                      <td className="text-slate-600">{user.country ?? t("users.notSet")}</td>
                      <td>
                        {user.receivedRoleUpgradeInvitations[0]
                          ? roleLabels[user.receivedRoleUpgradeInvitations[0].targetRole]
                          : t("users.none")}
                      </td>
                      <td>
                        {getUpgradeLabel(user.role, t) &&
                        user.accountStatus === "ACTIVE" &&
                        !user.receivedRoleUpgradeInvitations[0] ? (
                          <form action={sendRoleUpgradeInvitationAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button type="submit" variant="secondary" className="h-8 text-xs">
                              {getUpgradeLabel(user.role, t)}
                            </Button>
                          </form>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {getUpgradeLabel(user.role, t) ? t("users.pendingInvite") : t("users.notEligible")}
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
