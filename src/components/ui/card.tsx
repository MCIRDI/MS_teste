import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "muted" | "highlight";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  /** `none` = shell only; use CardHeader / CardSection / CardFooter for inner padding */
  padding?: "md" | "none";
};

const variantClass: Record<CardVariant, string> = {
  default:
    "bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/85",
  muted: "bg-slate-50/90 ring-1 ring-slate-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
  highlight:
    "bg-gradient-to-br from-blue-50/90 via-white to-white ring-1 ring-blue-200/55 shadow-[0_1px_3px_rgba(37,99,235,0.08)]",
};

export function Card({ className, variant = "default", padding = "md", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "overflow-hidden rounded-2xl",
        variantClass[variant],
        padding === "md" ? "p-5" : "p-0",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("border-b border-slate-100/95 bg-slate-50/70 px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 data-slot="card-title" className={cn("text-base font-semibold tracking-tight text-slate-900", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="card-description" className={cn("mt-1 text-sm leading-relaxed text-slate-600", className)} {...props} />
  );
}

/** Primary body region inside a `padding="none"` card */
export function CardSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-section" className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("border-t border-slate-100/95 bg-slate-50/60 px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardDivider({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-divider" className={cn("border-t border-slate-100", className)} {...props} />;
}

/** Label / value grid for metadata (tester, environment, etc.) */
export function CardMeta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl data-slot="card-meta" className={cn("grid gap-4 text-sm sm:grid-cols-2", className)}>
      {children}
    </dl>
  );
}

export function CardMetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/** Long-form report text */
export function CardProse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="card-prose"
      className={cn(
        "rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
