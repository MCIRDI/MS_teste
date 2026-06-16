import type { Role } from "@/generated/prisma";
import { cn } from "@/lib/utils";

export function getProfileCircleClass(role: Role, size: "sm" | "md" = "sm") {
  const sizeClass = size === "md" ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs";

  switch (role) {
    case "TESTER":
    case "CERT_TESTER":
      return cn(
        sizeClass,
        "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/20",
      );
    case "CLIENT":
      return cn(
        sizeClass,
        "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-600/20",
      );
    case "ADMIN":
      return cn(
        sizeClass,
        "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-600/20",
      );
    default:
      return cn(
        sizeClass,
        "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20",
      );
  }
}
