import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-stone-900 text-white hover:bg-stone-700 focus-visible:outline-stone-900",
  secondary:
    "bg-white text-stone-900 ring-1 ring-stone-200 hover:bg-stone-50 focus-visible:outline-stone-400",
  ghost:
    "bg-transparent text-stone-700 hover:bg-stone-100 focus-visible:outline-stone-400",
  danger:
    "bg-red-700 text-white hover:bg-red-600 focus-visible:outline-red-700",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
