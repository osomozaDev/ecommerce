import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-button bg-ink px-2.5 py-0.5 text-xs font-medium text-bg">
      {children}
    </span>
  );
}
