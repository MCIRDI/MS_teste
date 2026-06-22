"use client";

import { useRef, useState, useTransition } from "react";

import { updateCampaignStageAction } from "@/app/actions/campaigns";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CampaignStageBadge } from "@/components/ui/campaign-stage-badge";

const ALL_STAGES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "TESTING",
  "BUG_REVIEW",
  "COMPLETED",
  "ARCHIVED",
] as const;

const STAGE_LABELS: Record<(typeof ALL_STAGES)[number], string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  TESTING: "Testing phase",
  BUG_REVIEW: "Bug review",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

type Stage = (typeof ALL_STAGES)[number];

export function CampaignStageEditor({
  campaignId,
  currentStage,
}: {
  campaignId: string;
  currentStage: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Stage>(currentStage as Stage);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      await updateCampaignStageAction(formData);
      setOpen(false);
    });
  }

  return (
    <>
      {/* Pencil icon trigger — sits inline next to the badge */}
      <button
        type="button"
        onClick={() => {
          setSelected(currentStage as Stage);
          setOpen(true);
        }}
        className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Edit campaign status"
        title="Edit status"
      >
        {/* Pencil SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.596l-2.047.814a.75.75 0 0 1-.98-.98l.814-2.047c.143-.358.352-.686.596-.892l7.296-7.228Z" />
          <path d="m13.487 1.487-1.013 1.013 1.013 1.013 1.013-1.013a.75.75 0 0 0-1.013-1.013Z" />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Change campaign status"
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
              Current status
            </p>
            <CampaignStageBadge stage={currentStage} />
          </div>

          <div>
            <label
              htmlFor="stage-select"
              className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide"
            >
              New status
            </label>
            <Select
              id="stage-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value as Stage)}
            >
              {ALL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
          </div>

          {/* Hidden form that holds the data for the server action */}
          <form ref={formRef}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="stage" value={selected} />
            <input type="hidden" name="forceStage" value="true" />
          </form>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || selected === currentStage}
            >
              {isPending ? "Saving…" : "Apply"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
