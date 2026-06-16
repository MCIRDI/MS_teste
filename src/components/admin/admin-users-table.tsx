"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import {
  approvePendingAccountAction,
  certifyTesterAction,
  rejectPendingAccountAction,
  sendRoleUpgradeInvitationAction,
  updateUserByAdminAction,
} from "@/app/actions/admin";
import { CountrySelect } from "@/components/forms/country-select";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { AccountStatus, CountrySource, Role } from "@/generated/prisma";
import { getCountrySourceBadgeClass, getCountrySourceLabel } from "@/lib/country-source";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  country: string | null;
  countrySource: CountrySource | null;
  vetingScore: number | null;
  isCertified: boolean;
  score: number;
  totalEarned: number;
  languages: string[];
  testingExperience: string | null;
  receivedRoleUpgradeInvitations: Array<{ targetRole: Role }>;
};

const editInitialState = { success: false, message: "" };

function getUpgradeLabel(role: Role, t: (key: string) => string) {
  switch (role) {
    case "TESTER":
      return t("inviteModerator");
    case "MODERATOR":
      return t("inviteManager");
    default:
      return null;
  }
}

export function AdminUsersTable({
  users,
  roleLabels,
}: {
  users: AdminUserRow[];
  roleLabels: Record<string, string>;
}) {
  const t = useTranslations("admin.home");
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editState, editAction, editPending] = useActionState(updateUserByAdminAction, editInitialState);

  useEffect(() => {
    if (editState.success) {
      setEditingUser(null);
      router.refresh();
    }
  }, [editState.success, router]);

  return (
    <>
      <RealtimeRefresh />

      <div className="overflow-x-auto px-4 pb-4 md:px-5 md:pb-5">
        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-inner shadow-slate-100/50">
          <table className="saas-table">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                <th>{t("users.columns.name")}</th>
                <th>{t("users.columns.role")}</th>
                <th>{t("users.columns.status")}</th>
                <th>{t("users.columns.country")}</th>
                <th>Country source</th>
                <th>{t("users.columns.vetting")}</th>
                <th>{t("users.columns.upgrade")}</th>
                <th>{t("users.columns.action")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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
                  <td className="text-slate-600">
                    <div>{user.country ?? t("users.notSet")}</div>
                  </td>
                  <td>
                    {user.country ? (
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${getCountrySourceBadgeClass(user.countrySource)}`}
                      >
                        {getCountrySourceLabel(user.countrySource)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {user.vetingScore != null ? `${user.vetingScore}%` : t("users.notSet")}
                  </td>
                  <td>
                    {user.receivedRoleUpgradeInvitations[0]
                      ? roleLabels[user.receivedRoleUpgradeInvitations[0].targetRole]
                      : t("users.none")}
                  </td>
                  <td className="space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-600 hover:text-blue-700"
                      onClick={() => setEditingUser(user)}
                      aria-label={`Edit ${user.name}`}
                      title="Edit user"
                    >
                      ✏️
                    </Button>

                    {user.accountStatus === "PENDING_APPROVAL" ? (
                      <div className="space-y-2">
                        {(user.vetingScore ?? 0) < 60 ? (
                          <p className="text-xs text-amber-700">{t("users.awaitingVetting")}</p>
                        ) : (
                          <p className="text-xs text-emerald-700">{t("users.vettingPassed")}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <form action={approvePendingAccountAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button type="submit" className="h-8 text-xs">
                              {t("users.approve")}
                            </Button>
                          </form>
                          <form action={rejectPendingAccountAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button type="submit" variant="secondary" className="h-8 text-xs">
                              {t("users.reject")}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ) : null}

                    {user.role === "TESTER" && user.accountStatus === "ACTIVE" ? (
                      <form action={certifyTesterAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <Button type="submit" variant="secondary" className="h-8 text-xs">
                          {t("users.certify")}
                        </Button>
                      </form>
                    ) : null}

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

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Edit ${editingUser.name}` : "Edit user"}
        className="max-w-2xl"
      >
        {editingUser ? (
          <form action={editAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="userId" value={editingUser.id} />

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-name">
                Name
              </label>
              <Input id="edit-name" name="name" defaultValue={editingUser.name} required />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-email">
                Email
              </label>
              <Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-role">
                Role
              </label>
              <select
                id="edit-role"
                name="role"
                defaultValue={editingUser.role}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                {Object.keys(roleLabels).map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-status">
                Status
              </label>
              <select
                id="edit-status"
                name="accountStatus"
                defaultValue={editingUser.accountStatus}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BANNED">BANNED</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-country">
                Country
              </label>
              <CountrySelect id="edit-country" defaultValue={editingUser.country ?? ""} />
              {editingUser.country ? (
                <p className="text-xs text-slate-500">
                  Current source: {getCountrySourceLabel(editingUser.countrySource)}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">Changing the country marks it as set by admin.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-languages">
                Languages (comma-separated)
              </label>
              <Input
                id="edit-languages"
                name="languages"
                defaultValue={editingUser.languages.join(", ")}
                placeholder="fr, en, ar"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-veting">
                Vetting score (%)
              </label>
              <Input
                id="edit-veting"
                name="vetingScore"
                type="number"
                min={0}
                max={100}
                defaultValue={editingUser.vetingScore ?? ""}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-score">
                Score
              </label>
              <Input id="edit-score" name="score" type="number" min={0} defaultValue={editingUser.score} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-earned">
                Total earned
              </label>
              <Input
                id="edit-earned"
                name="totalEarned"
                type="number"
                min={0}
                step="0.01"
                defaultValue={editingUser.totalEarned}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="isCertified"
                  defaultChecked={editingUser.isCertified}
                  className="rounded border-slate-300"
                />
                Certified tester
              </label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-experience">
                Testing experience
              </label>
              <Input
                id="edit-experience"
                name="testingExperience"
                defaultValue={editingUser.testingExperience ?? ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-password">
                New password (optional)
              </label>
              <Input id="edit-password" name="password" type="password" minLength={8} placeholder="Leave blank to keep" />
            </div>

            {editState.message ? (
              <p className={`text-sm sm:col-span-2 ${editState.success ? "text-emerald-700" : "text-red-700"}`}>
                {editState.message}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editPending}>
                {editPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
