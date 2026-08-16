import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Consola",
  robots: { index: false, follow: false },
};

/** Consola de la factoría: fuera del layout de storefront (sin header/carrito). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bg px-6 py-10 text-ink">{children}</div>;
}
