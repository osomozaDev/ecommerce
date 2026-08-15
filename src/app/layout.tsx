import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getTenant } from "@/lib/tenant/resolve";
import { ThemeStyle } from "@/theme/ThemeStyle";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = getTenant();
  const { name, tagline } = tenant.branding;
  return {
    metadataBase: new URL(tenant.domain),
    title: {
      default: tagline ? `${name} — ${tagline}` : name,
      template: `%s · ${name}`,
    },
    description: tagline,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeStyle />
        {children}
      </body>
    </html>
  );
}
