import type { ReactNode } from "react";

import "./globals.css";

// Locale-specific <html> lives in app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
