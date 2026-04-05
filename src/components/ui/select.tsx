import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-stone-400",
        className,
      )}
      {...props}
    />
  );
}
