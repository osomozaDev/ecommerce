import type { ReactNode } from "react";
import { getTenant } from "@/lib/tenant/resolve";
import { getCommerce } from "@/lib/commerce/provider";
import { getCartAction } from "@/lib/cart/actions";
import { CartProvider } from "@/lib/cart/cart-context";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { ConsentBanner } from "@/components/storefront/consent-banner";
import { JsonLd } from "@/lib/seo/json-ld";
import { organizationJsonLd } from "@/lib/seo/jsonld";
import { AnalyticsScripts } from "@/lib/analytics/AnalyticsScripts";
import { hasAnalyticsVendor } from "@/lib/analytics/consent";
import { getConsent } from "@/lib/analytics/consent-server";

/**
 * Layout del storefront: resuelve tenant, carrito inicial (cookie) y
 * navegación, y monta el CartProvider. Todo lo que hay debajo puede usar
 * useCart() sin saber nada de Shopify.
 */
export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenant();
  const [initialCart, collections, consent] = await Promise.all([
    getCartAction(),
    getCommerce().getCollections(),
    getConsent(),
  ]);

  const nav = [
    { label: "Productos", href: "/productos" },
    { label: "Colecciones", href: "/colecciones" },
    ...collections.slice(0, 3).map((c) => ({ label: c.title, href: c.href })),
  ];

  return (
    <CartProvider initialCart={initialCart}>
      <JsonLd data={organizationJsonLd(tenant)} />
      <AnalyticsScripts tenant={tenant} />
      <Header
        shopName={tenant.branding.name}
        nav={nav}
        accountHref={tenant.customerAccount ? "/cuenta" : undefined}
      />
      <main className="flex-1">{children}</main>
      <Footer
        shopName={tenant.branding.name}
        tagline={tenant.branding.tagline}
        nav={nav}
      />
      {hasAnalyticsVendor(tenant.analytics) && consent === null && (
        <ConsentBanner shopName={tenant.branding.name} />
      )}
    </CartProvider>
  );
}
