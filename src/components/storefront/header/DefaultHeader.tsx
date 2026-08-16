import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CartWidget } from "@/components/storefront/cart/CartDrawer";
import { SearchBox } from "./SearchBox";
import type { HeaderProps } from "./types";

export function DefaultHeader({ shopName, nav, accountHref }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          {shopName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
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
        <div className="flex items-center gap-4">
          <SearchBox />
          {accountHref && (
            <Link
              href={accountHref}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Cuenta
            </Link>
          )}
          <CartWidget />
        </div>
      </Container>
    </header>
  );
}
