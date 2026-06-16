import { getTranslations } from "next-intl/server";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getLocalizedLabels } from "@/lib/i18n-server";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.home");
  const { roleLabels } = await getLocalizedLabels();
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
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
          <AdminUsersTable users={data.users} roleLabels={roleLabels} />
        </CardSection>
      </Card>
    </div>
  );
}
