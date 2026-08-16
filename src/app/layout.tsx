import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getTenant } from "@/lib/tenant/resolve";
import { ThemeStyle } from "@/theme/ThemeStyle";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  const { name, tagline } = tenant.branding;
  const markets = tenant.markets?.markets ?? [];
  return {
    metadataBase: new URL(tenant.domain),
    title: {
      default: tagline ? `${name} — ${tagline}` : name,
      template: `%s · ${name}`,
    },
    description: tagline,
    // hreflang: cada mercado vive en su dominio (mismo deploy).
    alternates:
      markets.length > 0
        ? {
            languages: {
              [tenant.locale]: tenant.domain,
              ...Object.fromEntries(
                markets.map((m) => [m.locale, `https://${m.domains[0]}`]),
              ),
            },
          }
        : undefined,
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
