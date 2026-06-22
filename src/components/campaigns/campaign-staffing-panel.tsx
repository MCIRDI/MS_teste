"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";

import { sendManualInvitationsAction } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Person = {
  id: string;
  name: string;
  email: string;
  country: string | null;
  isCertified?: boolean;
  role?: string;
};

type CampaignInfo = {
  id: string;
  projectName: string;
  moderatorSlots: number;
  crowdTesterCount: number;
  certTesterCount: number;
  assignments: Array<{ userId: string; assignmentRole: string }>;
  invitations: Array<{ recipientId: string; assignmentRole: string }>;
} | null;

type Props = {
  campaign: CampaignInfo;
  moderators: Person[];
  testers: Person[];
};

type Tab = "MODERATOR" | "CROWD_TESTER" | "CERT_TESTER";

const initialState = { success: false, message: "" };

function assignedCount(campaign: NonNullable<CampaignInfo>, role: string) {
  return campaign.assignments.filter((a) => a.assignmentRole === role).length;
}

function pendingCount(campaign: NonNullable<CampaignInfo>, role: string) {
  return campaign.invitations.filter((i) => i.assignmentRole === role).length;
}

function isAlreadyInvited(campaign: NonNullable<CampaignInfo>, userId: string, role: string) {
  return (
    campaign.assignments.some((a) => a.userId === userId && a.assignmentRole === role) ||
    campaign.invitations.some((i) => i.recipientId === userId && i.assignmentRole === role)
  );
}

export function CampaignStaffingPanel({ campaign, moderators, testers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("MODERATOR");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(sendManualInvitationsAction, initialState);

  // Reset selection when tab or modal changes
  useEffect(() => {
    setSelected(new Set());
  }, [tab, open]);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!campaign) return null;

  const tabPeople: Person[] =
    tab === "MODERATOR"
      ? moderators
      : testers.filter((t) =>
          tab === "CERT_TESTER" ? t.isCertified : !t.isCertified,
        );

  const tabRole = tab; // maps 1:1 to AssignmentRole

  const slotLabel =
    tab === "MODERATOR"
      ? `${assignedCount(campaign, "MODERATOR")}/${campaign.moderatorSlots} assigned, ${pendingCount(campaign, "MODERATOR")} pending`
      : tab === "CERT_TESTER"
      ? `${assignedCount(campaign, "CERT_TESTER")}/${campaign.certTesterCount} assigned, ${pendingCount(campaign, "CERT_TESTER")} pending`
      : `${assignedCount(campaign, "CROWD_TESTER")}/${campaign.crowdTesterCount} assigned, ${pendingCount(campaign, "CROWD_TESTER")} pending`;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const eligible = tabPeople.filter((p) => !isAlreadyInvited(campaign!, p.id, tabRole));
    const allSelected = eligible.every((p) => selected.has(p.id));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((p) => p.id)));
    }
  }

  const eligible = tabPeople.filter((p) => !isAlreadyInvited(campaign, p.id, tabRole));

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
        Manage staffing
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Staffing — ${campaign.projectName}`}
        className="max-w-2xl"
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["MODERATOR", "CROWD_TESTER", "CERT_TESTER"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === t
                  ? "bg-white shadow-sm text-blue-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "MODERATOR" ? "Moderators" : t === "CERT_TESTER" ? "Cert. testers" : "Crowd testers"}
            </button>
          ))}
        </div>

        <p className="mb-3 text-xs text-slate-500">{slotLabel}</p>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <input type="hidden" name="assignmentRole" value={tabRole} />

          {tabPeople.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No eligible users found.</p>
          ) : (
            <>
              {/* Select-all row */}
              {eligible.length > 0 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={eligible.length > 0 && eligible.every((p) => selected.has(p.id))}
                    onChange={toggleAll}
                  />
                  Select all eligible ({eligible.length})
                </label>
              )}

              {/* People list */}
              <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                {tabPeople.map((person) => {
                  const alreadyDone = isAlreadyInvited(campaign, person.id, tabRole);
                  return (
                    <li key={person.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                          alreadyDone
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                            : selected.has(person.id)
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="recipientIds"
                          value={person.id}
                          disabled={alreadyDone}
                          checked={selected.has(person.id)}
                          onChange={() => toggle(person.id)}
                          className="rounded border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">{person.name}</p>
                          <p className="truncate text-xs text-slate-500">{person.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {person.country ? (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {person.country.toUpperCase()}
                            </span>
                          ) : null}
                          {alreadyDone ? (
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              ✓ invited
                            </span>
                          ) : null}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {state.message ? (
            <p className={`text-sm ${state.success ? "text-emerald-700" : "text-red-700"}`}>
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={pending || selected.size === 0}>
              {pending
                ? "Sending…"
                : `Send ${selected.size > 0 ? selected.size : ""} invitation${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
