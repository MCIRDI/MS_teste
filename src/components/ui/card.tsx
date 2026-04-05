import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(28,25,23,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
