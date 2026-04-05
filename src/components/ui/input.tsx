import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400",
        className,
      )}
      {...props}
    />
  );
}
