import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { FooterProps } from "./types";

export function DefaultFooter({ shopName, tagline, nav, legalNav }: FooterProps) {
  return (
    <footer className="mt-[var(--section-gap)] border-t border-line">
      <Container className="flex flex-col gap-8 py-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">{shopName}</p>
            {tagline && <p className="text-sm text-muted">{tagline}</p>}
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shopName}. Pagos gestionados de forma segura por
            Shopify.
          </p>
          {legalNav && legalNav.length > 0 && (
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {legalNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </Container>
    </footer>
  );
}
