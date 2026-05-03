import Link from "next/link";

import { cn } from "@/lib/utils";

export function Tabs({
  items,
  active,
  className,
}: {
  items: { href: string; label: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => {
        const isActive = item.label === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-xs",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-white text-slate-600",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
