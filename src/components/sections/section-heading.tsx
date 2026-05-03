import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  density = "page",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** `panel` = tighter type for use inside cards */
  density?: "page" | "panel";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        density === "panel" && "gap-3 md:items-start",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.18em] text-slate-500",
              density === "page" ? "text-xs" : "text-[10px] tracking-[0.14em] text-slate-400",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-semibold tracking-tight text-slate-900",
            density === "page" ? "mt-2 text-2xl md:text-3xl" : "mt-1 text-lg md:text-xl",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-slate-600",
              density === "page" ? "mt-2 text-sm leading-6" : "mt-1.5 text-xs leading-5 md:text-sm md:leading-6",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
