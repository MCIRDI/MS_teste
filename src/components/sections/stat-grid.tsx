import { IconChart, IconClock, IconGlobe, IconUsers } from "@/components/marketing/icons";
import { cn } from "@/lib/utils";

const defaultIcons = [IconChart, IconUsers, IconGlobe, IconClock];
const accents = [
  "from-blue-600 to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-cyan-600 to-blue-500",
  "from-emerald-600 to-teal-600",
];

export function StatGrid({
  items,
  className,
}: {
  items: { label: string; value: string | number }[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item, index) => {
        const Icon = defaultIcons[index] ?? IconChart;
        const accent = accents[index % accents.length];

        return (
          <div key={item.label} className="stat-card group">
            <div
              className="pointer-events-none absolute -end-4 -top-4 h-20 w-20 rounded-full bg-indigo-100/80 opacity-0 transition group-hover:opacity-100"
              aria-hidden
            />
            <div className="relative flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                  accent,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 tabular-nums text-2xl font-semibold tracking-tight text-slate-900">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
