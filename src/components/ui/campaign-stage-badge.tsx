import { cn } from "@/lib/utils";

type Stage =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "TESTING"
  | "BUG_REVIEW"
  | "COMPLETED"
  | "ARCHIVED";

const stageConfig: Record<Stage, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PENDING_APPROVAL: {
    label: "Pending approval",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  TESTING: {
    label: "Testing phase",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  BUG_REVIEW: {
    label: "Bug review",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

export function CampaignStageBadge({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const config = stageConfig[stage as Stage] ?? {
    label: stage.replace(/_/g, " "),
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
