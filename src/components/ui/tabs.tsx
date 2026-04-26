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
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
              isActive ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200",
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? (
              <span className={cn("rounded-full px-2 py-0.5 text-xs", isActive ? "bg-white/20" : "bg-white")}>
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
